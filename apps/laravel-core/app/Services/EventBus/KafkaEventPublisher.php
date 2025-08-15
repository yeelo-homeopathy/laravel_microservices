<?php

namespace App\Services\EventBus;

use App\Events\BaseEvent;
use Illuminate\Support\Facades\Log;
use RdKafka\Producer;
use RdKafka\ProducerTopic;
use RdKafka\Conf;

/**
 * Kafka Event Publisher
 * 
 * Publishes domain events to Apache Kafka for distributed event processing.
 * Enables microservices to react to events from other services in real-time.
 * 
 * Features:
 * - Reliable event publishing with retries
 * - Dead letter queue for failed events
 * - Event partitioning for scalability
 * - Compression and batching for performance
 * - Monitoring and metrics collection
 */
class KafkaEventPublisher
{
    private Producer $producer;
    private array $topics = [];

    public function __construct()
    {
        $this->initializeProducer();
    }

    /**
     * Initialize Kafka producer with configuration
     */
    private function initializeProducer(): void
    {
        $conf = new Conf();
        
        // Basic configuration
        $conf->set('bootstrap.servers', config('kafka.brokers', 'kafka:9092'));
        $conf->set('client.id', config('app.name', 'laravel-core'));
        
        // Performance and reliability settings
        $conf->set('acks', 'all'); // Wait for all replicas to acknowledge
        $conf->set('retries', 3); // Retry failed sends
        $conf->set('retry.backoff.ms', 100);
        $conf->set('batch.size', 16384); // Batch size in bytes
        $conf->set('linger.ms', 5); // Wait up to 5ms to batch messages
        $conf->set('compression.type', 'snappy'); // Compress messages
        
        // Error handling
        $conf->set('enable.idempotence', 'true'); // Prevent duplicate messages
        $conf->set('max.in.flight.requests.per.connection', 1);
        
        // Delivery report callback
        $conf->setDrMsgCb(function ($kafka, $message) {
            if ($message->err) {
                Log::error('Kafka message delivery failed', [
                    'error' => rd_kafka_err2str($message->err),
                    'topic' => $message->topic_name,
                    'partition' => $message->partition,
                    'offset' => $message->offset,
                    'payload' => $message->payload,
                ]);
            } else {
                Log::debug('Kafka message delivered', [
                    'topic' => $message->topic_name,
                    'partition' => $message->partition,
                    'offset' => $message->offset,
                ]);
            }
        });

        // Error callback
        $conf->setErrorCb(function ($kafka, $err, $reason) {
            Log::error('Kafka error', [
                'error' => rd_kafka_err2str($err),
                'reason' => $reason,
            ]);
        });

        $this->producer = new Producer($conf);
    }

    /**
     * Publish an event to Kafka
     */
    public function publish(BaseEvent $event, ?string $topicName = null): void
    {
        try {
            $topicName = $topicName ?? $this->getTopicName($event);
            $topic = $this->getTopic($topicName);
            
            $message = $this->prepareMessage($event);
            $partitionKey = $this->getPartitionKey($event);

            // Produce the message
            $topic->produce(
                RD_KAFKA_PARTITION_UA, // Let Kafka choose partition
                0, // No flags
                $message,
                $partitionKey
            );

            // Poll for delivery reports
            $this->producer->poll(0);

            Log::info('Event published to Kafka', [
                'event_id' => $event->eventId,
                'event_type' => $event->getEventType(),
                'topic' => $topicName,
                'correlation_id' => $event->correlationId,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to publish event to Kafka', [
                'event_id' => $event->eventId,
                'event_type' => $event->getEventType(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Send to dead letter queue
            $this->sendToDeadLetterQueue($event, $e);
            
            throw $e;
        }
    }

    /**
     * Publish multiple events in a batch
     */
    public function publishBatch(array $events): void
    {
        foreach ($events as $event) {
            if (!$event instanceof BaseEvent) {
                throw new \InvalidArgumentException('All events must extend BaseEvent');
            }
            
            $this->publish($event);
        }

        // Flush all pending messages
        $this->flush();
    }

    /**
     * Flush pending messages
     */
    public function flush(int $timeoutMs = 10000): void
    {
        $result = $this->producer->flush($timeoutMs);
        
        if ($result !== RD_KAFKA_RESP_ERR_NO_ERROR) {
            Log::warning('Kafka flush incomplete', [
                'result' => $result,
                'timeout_ms' => $timeoutMs,
            ]);
        }
    }

    /**
     * Get or create a Kafka topic
     */
    private function getTopic(string $topicName): ProducerTopic
    {
        if (!isset($this->topics[$topicName])) {
            $this->topics[$topicName] = $this->producer->newTopic($topicName);
        }

        return $this->topics[$topicName];
    }

    /**
     * Get topic name for an event
     */
    private function getTopicName(BaseEvent $event): string
    {
        $eventName = $event->getEventName();
        $prefix = config('kafka.topic_prefix', 'ecommerce');
        
        // Convert PascalCase to kebab-case
        $topicName = strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $eventName));
        
        return "{$prefix}.{$topicName}";
    }

    /**
     * Prepare message for Kafka
     */
    private function prepareMessage(BaseEvent $event): string
    {
        $envelope = [
            'event_id' => $event->eventId,
            'event_type' => $event->getEventType(),
            'event_name' => $event->getEventName(),
            'version' => $event->version,
            'occurred_at' => $event->occurredAt->format('c'),
            'correlation_id' => $event->correlationId,
            'causation_id' => $event->causationId,
            'aggregate_id' => $event->aggregateId,
            'aggregate_type' => $event->aggregateType,
            'payload' => $event->getPayload(),
            'metadata' => $event->metadata,
        ];

        return json_encode($envelope, JSON_THROW_ON_ERROR);
    }

    /**
     * Get partition key for event distribution
     */
    private function getPartitionKey(BaseEvent $event): ?string
    {
        // Use aggregate ID for partitioning to ensure event ordering per aggregate
        return $event->aggregateId ?? $event->correlationId;
    }

    /**
     * Send failed event to dead letter queue
     */
    private function sendToDeadLetterQueue(BaseEvent $event, \Exception $exception): void
    {
        try {
            $dlqTopic = $this->getTopic('dead-letter-queue');
            
            $dlqMessage = json_encode([
                'original_event' => $event->toArray(),
                'error' => [
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                ],
                'failed_at' => now()->toISOString(),
                'retry_count' => 0,
            ], JSON_THROW_ON_ERROR);

            $dlqTopic->produce(RD_KAFKA_PARTITION_UA, 0, $dlqMessage, $event->eventId);
            $this->producer->poll(0);

            Log::info('Event sent to dead letter queue', [
                'event_id' => $event->eventId,
                'event_type' => $event->getEventType(),
            ]);

        } catch (\Exception $dlqException) {
            Log::critical('Failed to send event to dead letter queue', [
                'event_id' => $event->eventId,
                'original_error' => $exception->getMessage(),
                'dlq_error' => $dlqException->getMessage(),
            ]);
        }
    }

    /**
     * Get producer statistics
     */
    public function getStats(): array
    {
        return json_decode($this->producer->getMetadata(false, null, 1000)->getOrigBrokerName(), true);
    }

    /**
     * Close the producer and clean up resources
     */
    public function __destruct()
    {
        if (isset($this->producer)) {
            $this->flush(5000); // 5 second timeout
        }
    }
}
