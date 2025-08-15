<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Base Event Class
 * 
 * Abstract base class for all domain events in the e-commerce platform.
 * Provides common functionality for event sourcing, broadcasting, and
 * integration with external event systems like Kafka.
 * 
 * Features:
 * - Automatic event ID generation
 * - Timestamp tracking
 * - Event versioning
 * - Correlation ID support for distributed tracing
 * - Metadata handling
 * - Broadcasting capabilities
 */
abstract class BaseEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Unique event identifier
     */
    public readonly string $eventId;

    /**
     * Event timestamp
     */
    public readonly \DateTimeImmutable $occurredAt;

    /**
     * Event version for schema evolution
     */
    public readonly int $version;

    /**
     * Correlation ID for distributed tracing
     */
    public readonly ?string $correlationId;

    /**
     * Causation ID for event chains
     */
    public readonly ?string $causationId;

    /**
     * Event metadata
     */
    public readonly array $metadata;

    /**
     * Aggregate ID that this event belongs to
     */
    public readonly ?string $aggregateId;

    /**
     * Aggregate type
     */
    public readonly ?string $aggregateType;

    public function __construct(
        ?string $aggregateId = null,
        ?string $aggregateType = null,
        ?string $correlationId = null,
        ?string $causationId = null,
        array $metadata = []
    ) {
        $this->eventId = Str::uuid()->toString();
        $this->occurredAt = new \DateTimeImmutable();
        $this->version = $this->getEventVersion();
        $this->correlationId = $correlationId ?? request()->header('X-Correlation-ID') ?? Str::uuid()->toString();
        $this->causationId = $causationId;
        $this->aggregateId = $aggregateId;
        $this->aggregateType = $aggregateType;
        $this->metadata = array_merge([
            'user_id' => auth()->id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'source' => 'laravel-core',
        ], $metadata);
    }

    /**
     * Get the event name for external systems
     */
    public function getEventName(): string
    {
        return class_basename(static::class);
    }

    /**
     * Get the event type with namespace
     */
    public function getEventType(): string
    {
        return static::class;
    }

    /**
     * Get event version for schema evolution
     */
    protected function getEventVersion(): int
    {
        return 1; // Override in child classes when schema changes
    }

    /**
     * Get the channels the event should broadcast on
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin'),
            new Channel('events'),
        ];
    }

    /**
     * Get the broadcast event name
     */
    public function broadcastAs(): string
    {
        return $this->getEventName();
    }

    /**
     * Get the data to broadcast
     */
    public function broadcastWith(): array
    {
        return [
            'event_id' => $this->eventId,
            'event_name' => $this->getEventName(),
            'event_type' => $this->getEventType(),
            'occurred_at' => $this->occurredAt->format('c'),
            'version' => $this->version,
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'aggregate_id' => $this->aggregateId,
            'aggregate_type' => $this->aggregateType,
            'payload' => $this->getPayload(),
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Convert event to array for serialization
     */
    public function toArray(): array
    {
        return $this->broadcastWith();
    }

    /**
     * Convert event to JSON
     */
    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_THROW_ON_ERROR);
    }

    /**
     * Get the event payload (to be implemented by child classes)
     */
    abstract public function getPayload(): array;

    /**
     * Create event from array (for event replay)
     */
    public static function fromArray(array $data): static
    {
        $event = new static(
            $data['aggregate_id'] ?? null,
            $data['aggregate_type'] ?? null,
            $data['correlation_id'] ?? null,
            $data['causation_id'] ?? null,
            $data['metadata'] ?? []
        );

        // Override readonly properties for deserialization
        $reflection = new \ReflectionClass($event);
        
        if (isset($data['event_id'])) {
            $property = $reflection->getProperty('eventId');
            $property->setAccessible(true);
            $property->setValue($event, $data['event_id']);
        }

        if (isset($data['occurred_at'])) {
            $property = $reflection->getProperty('occurredAt');
            $property->setAccessible(true);
            $property->setValue($event, new \DateTimeImmutable($data['occurred_at']));
        }

        if (isset($data['version'])) {
            $property = $reflection->getProperty('version');
            $property->setAccessible(true);
            $property->setValue($event, $data['version']);
        }

        return $event;
    }
}
