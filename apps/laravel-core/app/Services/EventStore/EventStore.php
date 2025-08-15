<?php

namespace App\Services\EventStore;

use App\Events\BaseEvent;
use App\Models\EventStore as EventStoreModel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Event Store Service
 * 
 * Provides event sourcing capabilities for the e-commerce platform.
 * Stores all domain events for audit trails, event replay, and
 * building read models from event streams.
 * 
 * Features:
 * - Event persistence with optimistic concurrency control
 * - Event stream reading with filtering
 * - Snapshot support for performance
 * - Event replay capabilities
 * - Aggregate reconstruction from events
 */
class EventStore
{
    /**
     * Append events to the event store
     */
    public function append(
        string $streamId,
        array $events,
        int $expectedVersion = -1
    ): void {
        if (empty($events)) {
            return;
        }

        DB::transaction(function () use ($streamId, $events, $expectedVersion) {
            // Check current version for optimistic concurrency control
            if ($expectedVersion >= 0) {
                $currentVersion = $this->getCurrentVersion($streamId);
                if ($currentVersion !== $expectedVersion) {
                    throw new \Exception(
                        "Concurrency conflict. Expected version {$expectedVersion}, but current version is {$currentVersion}"
                    );
                }
            }

            $version = $this->getCurrentVersion($streamId);

            foreach ($events as $event) {
                if (!$event instanceof BaseEvent) {
                    throw new \InvalidArgumentException('All events must extend BaseEvent');
                }

                $version++;

                EventStoreModel::create([
                    'stream_id' => $streamId,
                    'event_id' => $event->eventId,
                    'event_type' => $event->getEventType(),
                    'event_name' => $event->getEventName(),
                    'version' => $version,
                    'event_version' => $event->version,
                    'aggregate_id' => $event->aggregateId,
                    'aggregate_type' => $event->aggregateType,
                    'correlation_id' => $event->correlationId,
                    'causation_id' => $event->causationId,
                    'payload' => json_encode($event->getPayload()),
                    'metadata' => json_encode($event->metadata),
                    'occurred_at' => $event->occurredAt,
                ]);

                Log::info('Event stored', [
                    'stream_id' => $streamId,
                    'event_id' => $event->eventId,
                    'event_type' => $event->getEventType(),
                    'version' => $version,
                ]);
            }
        });
    }

    /**
     * Read events from a stream
     */
    public function readStream(
        string $streamId,
        int $fromVersion = 0,
        ?int $toVersion = null,
        ?int $limit = null
    ): Collection {
        $query = EventStoreModel::where('stream_id', $streamId)
            ->where('version', '>', $fromVersion)
            ->orderBy('version');

        if ($toVersion !== null) {
            $query->where('version', '<=', $toVersion);
        }

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Read all events of a specific type
     */
    public function readEventsByType(
        string $eventType,
        ?\DateTimeInterface $fromDate = null,
        ?\DateTimeInterface $toDate = null,
        ?int $limit = null
    ): Collection {
        $query = EventStoreModel::where('event_type', $eventType)
            ->orderBy('occurred_at');

        if ($fromDate) {
            $query->where('occurred_at', '>=', $fromDate);
        }

        if ($toDate) {
            $query->where('occurred_at', '<=', $toDate);
        }

        if ($limit) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Read events by correlation ID (for distributed tracing)
     */
    public function readEventsByCorrelationId(string $correlationId): Collection
    {
        return EventStoreModel::where('correlation_id', $correlationId)
            ->orderBy('occurred_at')
            ->get();
    }

    /**
     * Get current version of a stream
     */
    public function getCurrentVersion(string $streamId): int
    {
        return EventStoreModel::where('stream_id', $streamId)
            ->max('version') ?? 0;
    }

    /**
     * Check if stream exists
     */
    public function streamExists(string $streamId): bool
    {
        return EventStoreModel::where('stream_id', $streamId)->exists();
    }

    /**
     * Get stream statistics
     */
    public function getStreamStats(string $streamId): array
    {
        $stats = EventStoreModel::where('stream_id', $streamId)
            ->selectRaw('
                COUNT(*) as event_count,
                MAX(version) as current_version,
                MIN(occurred_at) as first_event_at,
                MAX(occurred_at) as last_event_at
            ')
            ->first();

        return [
            'stream_id' => $streamId,
            'event_count' => $stats->event_count ?? 0,
            'current_version' => $stats->current_version ?? 0,
            'first_event_at' => $stats->first_event_at,
            'last_event_at' => $stats->last_event_at,
        ];
    }

    /**
     * Replay events from a specific point in time
     */
    public function replayEvents(
        \DateTimeInterface $fromDate,
        ?string $eventType = null,
        ?callable $handler = null
    ): int {
        $query = EventStoreModel::where('occurred_at', '>=', $fromDate)
            ->orderBy('occurred_at');

        if ($eventType) {
            $query->where('event_type', $eventType);
        }

        $processedCount = 0;

        $query->chunk(100, function ($events) use ($handler, &$processedCount) {
            foreach ($events as $eventData) {
                try {
                    // Reconstruct the event object
                    $eventClass = $eventData->event_type;
                    
                    if (!class_exists($eventClass)) {
                        Log::warning("Event class not found: {$eventClass}");
                        continue;
                    }

                    $event = $eventClass::fromArray([
                        'event_id' => $eventData->event_id,
                        'occurred_at' => $eventData->occurred_at,
                        'version' => $eventData->event_version,
                        'correlation_id' => $eventData->correlation_id,
                        'causation_id' => $eventData->causation_id,
                        'aggregate_id' => $eventData->aggregate_id,
                        'aggregate_type' => $eventData->aggregate_type,
                        'payload' => json_decode($eventData->payload, true),
                        'metadata' => json_decode($eventData->metadata, true),
                    ]);

                    // Process the event
                    if ($handler) {
                        $handler($event, $eventData);
                    } else {
                        // Default: re-dispatch the event
                        event($event);
                    }

                    $processedCount++;

                } catch (\Exception $e) {
                    Log::error('Error replaying event', [
                        'event_id' => $eventData->event_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        return $processedCount;
    }

    /**
     * Create a snapshot of an aggregate's current state
     */
    public function createSnapshot(
        string $streamId,
        string $aggregateType,
        string $aggregateId,
        array $data,
        int $version
    ): void {
        DB::table('event_snapshots')->updateOrInsert(
            [
                'stream_id' => $streamId,
                'aggregate_type' => $aggregateType,
                'aggregate_id' => $aggregateId,
            ],
            [
                'version' => $version,
                'data' => json_encode($data),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Get the latest snapshot for an aggregate
     */
    public function getSnapshot(string $streamId): ?array
    {
        $snapshot = DB::table('event_snapshots')
            ->where('stream_id', $streamId)
            ->first();

        if (!$snapshot) {
            return null;
        }

        return [
            'version' => $snapshot->version,
            'data' => json_decode($snapshot->data, true),
            'created_at' => $snapshot->created_at,
        ];
    }
}
