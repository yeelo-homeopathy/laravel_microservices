import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { EventEmitter2 } from "@nestjs/event-emitter"
import { Kafka, type Consumer, type Producer, type KafkaMessage } from "kafkajs"
import type { BaseEvent } from "./base.event"

/**
 * Event Bus Service for NestJS Microservices
 *
 * Provides event-driven communication between microservices using Apache Kafka.
 * Handles both publishing and consuming events with proper error handling,
 * dead letter queues, and monitoring capabilities.
 *
 * Features:
 * - Kafka integration with automatic reconnection
 * - Event serialization/deserialization
 * - Dead letter queue for failed events
 * - Consumer group management
 * - Event replay capabilities
 * - Comprehensive logging and monitoring
 */
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name)
  private kafka: Kafka
  private producer: Producer
  private consumer: Consumer
  private readonly serviceName: string
  private readonly topicPrefix: string

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.serviceName = this.configService.get<string>("SERVICE_NAME", "identity-service")
    this.topicPrefix = this.configService.get<string>("KAFKA_TOPIC_PREFIX", "ecommerce")

    this.initializeKafka()
  }

  /**
   * Initialize Kafka client, producer, and consumer
   */
  private initializeKafka(): void {
    const brokers = this.configService.get<string>("KAFKA_BROKERS", "kafka:9092").split(",")

    this.kafka = new Kafka({
      clientId: this.serviceName,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
        factor: 2,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    })

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 3,
        maxRetryTime: 30000,
      },
    })

    this.consumer = this.kafka.consumer({
      groupId: `${this.serviceName}-group`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
      },
    })
  }

  /**
   * Initialize the event bus on module startup
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect()
      await this.consumer.connect()

      // Subscribe to relevant topics
      await this.subscribeToTopics()

      // Start consuming messages
      await this.startConsuming()

      this.logger.log("Event bus initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize event bus", error.stack)
      throw error
    }
  }

  /**
   * Clean up resources on module shutdown
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer.disconnect()
      await this.producer.disconnect()
      this.logger.log("Event bus disconnected successfully")
    } catch (error) {
      this.logger.error("Error disconnecting event bus", error.stack)
    }
  }

  /**
   * Publish an event to Kafka
   */
  async publishEvent(event: BaseEvent, topicName?: string): Promise<void> {
    try {
      const topic = topicName || this.getTopicName(event.getEventName())
      const message = this.prepareMessage(event)

      await this.producer.send({
        topic,
        messages: [
          {
            key: event.aggregateId || event.correlationId,
            value: JSON.stringify(message),
            headers: {
              "event-type": event.getEventType(),
              "event-version": event.version.toString(),
              "correlation-id": event.correlationId,
              "source-service": this.serviceName,
            },
          },
        ],
      })

      this.logger.debug(`Event published to topic ${topic}`, {
        eventId: event.eventId,
        eventType: event.getEventType(),
        correlationId: event.correlationId,
      })
    } catch (error) {
      this.logger.error("Failed to publish event", {
        eventId: event.eventId,
        eventType: event.getEventType(),
        error: error.message,
      })

      // Send to dead letter queue
      await this.sendToDeadLetterQueue(event, error)
      throw error
    }
  }

  /**
   * Publish multiple events in a batch
   */
  async publishEvents(events: BaseEvent[]): Promise<void> {
    if (events.length === 0) return

    try {
      // Group events by topic
      const eventsByTopic = new Map<string, BaseEvent[]>()

      for (const event of events) {
        const topic = this.getTopicName(event.getEventName())
        if (!eventsByTopic.has(topic)) {
          eventsByTopic.set(topic, [])
        }
        eventsByTopic.get(topic)!.push(event)
      }

      // Send batched messages per topic
      const promises = Array.from(eventsByTopic.entries()).map(([topic, topicEvents]) => {
        const messages = topicEvents.map((event) => ({
          key: event.aggregateId || event.correlationId,
          value: JSON.stringify(this.prepareMessage(event)),
          headers: {
            "event-type": event.getEventType(),
            "event-version": event.version.toString(),
            "correlation-id": event.correlationId,
            "source-service": this.serviceName,
          },
        }))

        return this.producer.send({ topic, messages })
      })

      await Promise.all(promises)

      this.logger.debug(`Batch published ${events.length} events to ${eventsByTopic.size} topics`)
    } catch (error) {
      this.logger.error("Failed to publish event batch", {
        eventCount: events.length,
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Subscribe to relevant Kafka topics
   */
  private async subscribeToTopics(): Promise<void> {
    const topics = [
      `${this.topicPrefix}.user-registered`,
      `${this.topicPrefix}.user-updated`,
      `${this.topicPrefix}.order-created`,
      `${this.topicPrefix}.payment-processed`,
      // Add more topics as needed
    ]

    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false })
      this.logger.debug(`Subscribed to topic: ${topic}`)
    }
  }

  /**
   * Start consuming messages from Kafka
   */
  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await this.handleMessage(topic, partition, message)
        } catch (error) {
          this.logger.error("Error processing message", {
            topic,
            partition,
            offset: message.offset,
            error: error.message,
          })

          // Send to dead letter queue
          await this.sendMessageToDeadLetterQueue(topic, message, error)
        }
      },
    })
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(topic: string, partition: number, message: KafkaMessage): Promise<void> {
    if (!message.value) {
      this.logger.warn("Received message with no value", { topic, partition })
      return
    }

    try {
      const eventData = JSON.parse(message.value.toString())
      const eventType = message.headers?.["event-type"]?.toString()

      if (!eventType) {
        this.logger.warn("Received message without event-type header", { topic })
        return
      }

      // Emit the event locally for handlers to process
      await this.eventEmitter.emitAsync(eventType, eventData)

      this.logger.debug("Message processed successfully", {
        topic,
        partition,
        offset: message.offset,
        eventType,
        eventId: eventData.event_id,
      })
    } catch (error) {
      this.logger.error("Failed to parse message", {
        topic,
        partition,
        offset: message.offset,
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Get topic name for an event
   */
  private getTopicName(eventName: string): string {
    // Convert PascalCase to kebab-case
    const topicName = eventName
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .substring(1)
    return `${this.topicPrefix}.${topicName}`
  }

  /**
   * Prepare message envelope for Kafka
   */
  private prepareMessage(event: BaseEvent): any {
    return {
      event_id: event.eventId,
      event_type: event.getEventType(),
      event_name: event.getEventName(),
      version: event.version,
      occurred_at: event.occurredAt.toISOString(),
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      aggregate_id: event.aggregateId,
      aggregate_type: event.aggregateType,
      payload: event.getPayload(),
      metadata: {
        ...event.metadata,
        source_service: this.serviceName,
      },
    }
  }

  /**
   * Send failed event to dead letter queue
   */
  private async sendToDeadLetterQueue(event: BaseEvent, error: Error): Promise<void> {
    try {
      const dlqMessage = {
        original_event: this.prepareMessage(event),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        failed_at: new Date().toISOString(),
        source_service: this.serviceName,
        retry_count: 0,
      }

      await this.producer.send({
        topic: `${this.topicPrefix}.dead-letter-queue`,
        messages: [
          {
            key: event.eventId,
            value: JSON.stringify(dlqMessage),
            headers: {
              "original-topic": this.getTopicName(event.getEventName()),
              "failure-reason": error.name,
              "source-service": this.serviceName,
            },
          },
        ],
      })

      this.logger.warn("Event sent to dead letter queue", {
        eventId: event.eventId,
        eventType: event.getEventType(),
        error: error.message,
      })
    } catch (dlqError) {
      this.logger.error("Failed to send event to dead letter queue", {
        eventId: event.eventId,
        originalError: error.message,
        dlqError: dlqError.message,
      })
    }
  }

  /**
   * Send failed message to dead letter queue
   */
  private async sendMessageToDeadLetterQueue(
    originalTopic: string,
    message: KafkaMessage,
    error: Error,
  ): Promise<void> {
    try {
      const dlqMessage = {
        original_message: {
          topic: originalTopic,
          partition: message.partition,
          offset: message.offset,
          value: message.value?.toString(),
          headers: message.headers,
        },
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        failed_at: new Date().toISOString(),
        source_service: this.serviceName,
        retry_count: 0,
      }

      await this.producer.send({
        topic: `${this.topicPrefix}.dead-letter-queue`,
        messages: [
          {
            key: message.key?.toString() || "unknown",
            value: JSON.stringify(dlqMessage),
            headers: {
              "original-topic": originalTopic,
              "failure-reason": error.name,
              "source-service": this.serviceName,
            },
          },
        ],
      })
    } catch (dlqError) {
      this.logger.error("Failed to send message to dead letter queue", {
        originalTopic,
        originalError: error.message,
        dlqError: dlqError.message,
      })
    }
  }

  /**
   * Get consumer group information
   */
  async getConsumerGroupInfo(): Promise<any> {
    const admin = this.kafka.admin()
    try {
      await admin.connect()
      const groups = await admin.listGroups()
      return groups.groups.find((group) => group.groupId === `${this.serviceName}-group`)
    } finally {
      await admin.disconnect()
    }
  }

  /**
   * Reset consumer group offset (for event replay)
   */
  async resetConsumerOffset(topic: string, partition: number, offset: number): Promise<void> {
    const admin = this.kafka.admin()
    try {
      await admin.connect()
      await admin.setOffsets({
        groupId: `${this.serviceName}-group`,
        topic,
        partitions: [{ partition, offset: offset.toString() }],
      })
      this.logger.log(`Reset consumer offset for ${topic}:${partition} to ${offset}`)
    } finally {
      await admin.disconnect()
    }
  }
}
