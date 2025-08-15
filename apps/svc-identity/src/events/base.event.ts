/**
 * Base Event Interface for NestJS Microservices
 *
 * Defines the contract for all domain events in the system.
 * Ensures consistency across different microservices and
 * provides type safety for event handling.
 */
export interface BaseEvent {
  /**
   * Unique event identifier
   */
  eventId: string

  /**
   * Event name (class name without namespace)
   */
  getEventName(): string

  /**
   * Full event type with namespace
   */
  getEventType(): string

  /**
   * Event schema version for evolution
   */
  version: number

  /**
   * When the event occurred
   */
  occurredAt: Date

  /**
   * Correlation ID for distributed tracing
   */
  correlationId: string

  /**
   * Causation ID for event chains
   */
  causationId?: string

  /**
   * Aggregate ID this event belongs to
   */
  aggregateId?: string

  /**
   * Aggregate type
   */
  aggregateType?: string

  /**
   * Event payload data
   */
  getPayload(): Record<string, any>

  /**
   * Event metadata
   */
  metadata: Record<string, any>
}

/**
 * Abstract base class implementing BaseEvent interface
 */
export abstract class AbstractBaseEvent implements BaseEvent {
  public readonly eventId: string
  public readonly occurredAt: Date
  public readonly version: number
  public readonly correlationId: string
  public readonly causationId?: string
  public readonly aggregateId?: string
  public readonly aggregateType?: string
  public readonly metadata: Record<string, any>

  constructor(
    aggregateId?: string,
    aggregateType?: string,
    correlationId?: string,
    causationId?: string,
    metadata: Record<string, any> = {},
  ) {
    this.eventId = this.generateEventId()
    this.occurredAt = new Date()
    this.version = this.getEventVersion()
    this.correlationId = correlationId || this.generateCorrelationId()
    this.causationId = causationId
    this.aggregateId = aggregateId
    this.aggregateType = aggregateType
    this.metadata = {
      source: "identity-service",
      ...metadata,
    }
  }

  /**
   * Get event name (class name)
   */
  getEventName(): string {
    return this.constructor.name
  }

  /**
   * Get full event type with namespace
   */
  getEventType(): string {
    return this.constructor.name
  }

  /**
   * Get event version (override in subclasses for schema evolution)
   */
  protected getEventVersion(): number {
    return 1
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Abstract method to get event payload
   */
  abstract getPayload(): Record<string, any>
}
