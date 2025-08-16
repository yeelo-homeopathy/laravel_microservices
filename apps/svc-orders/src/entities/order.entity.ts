import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import { OrderItem } from "./order-item.entity"

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum FulfillmentStatus {
  UNFULFILLED = "unfulfilled",
  PARTIAL = "partial",
  FULFILLED = "fulfilled",
}

/**
 * Order Entity
 *
 * Represents a customer order in the e-commerce system.
 * Contains comprehensive order information including:
 * - Customer details and addresses
 * - Order status and fulfillment tracking
 * - Payment information and status
 * - Pricing breakdown (subtotal, tax, shipping, discounts)
 * - Timestamps for order lifecycle events
 * - Metadata for additional order information
 */
@Entity("orders")
@Index(["user_id"])
@Index(["order_number"], { unique: true })
@Index(["status"])
@Index(["payment_status"])
@Index(["created_at"])
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  @Index()
  user_id: string

  @Column({ type: "varchar", length: 50, unique: true })
  order_number: string

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus

  @Column({
    type: "enum",
    enum: FulfillmentStatus,
    default: FulfillmentStatus.UNFULFILLED,
  })
  fulfillment_status: FulfillmentStatus

  // Pricing information (stored in cents to avoid floating point issues)
  @Column({ type: "integer", default: 0 })
  subtotal: number

  @Column({ type: "integer", default: 0 })
  tax_amount: number

  @Column({ type: "integer", default: 0 })
  shipping_amount: number

  @Column({ type: "integer", default: 0 })
  discount_amount: number

  @Column({ type: "integer" })
  total_amount: number

  @Column({ type: "varchar", length: 3, default: "USD" })
  currency: string

  // Customer information
  @Column({ type: "varchar", length: 255 })
  customer_email: string

  @Column({ type: "varchar", length: 50, nullable: true })
  customer_phone: string

  // Address information (stored as JSON for flexibility)
  @Column({ type: "jsonb" })
  billing_address: {
    first_name: string
    last_name: string
    company?: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone?: string
  }

  @Column({ type: "jsonb" })
  shipping_address: {
    first_name: string
    last_name: string
    company?: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone?: string
  }

  // Order notes and metadata
  @Column({ type: "text", nullable: true })
  notes: string

  @Column({ type: "text", nullable: true })
  internal_notes: string

  @Column({ type: "simple-array", nullable: true })
  tags: string[]

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>

  // Lifecycle timestamps
  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column({ type: "timestamp", nullable: true })
  processed_at: Date

  @Column({ type: "timestamp", nullable: true })
  shipped_at: Date

  @Column({ type: "timestamp", nullable: true })
  delivered_at: Date

  @Column({ type: "timestamp", nullable: true })
  cancelled_at: Date

  // Relationships
  @OneToMany(
    () => OrderItem,
    (orderItem) => orderItem.order,
    {
      cascade: true,
      eager: false,
    },
  )
  items: OrderItem[]

  // Computed properties
  get formatted_total(): string {
    return (this.total_amount / 100).toFixed(2)
  }

  get item_count(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  }

  get is_paid(): boolean {
    return this.payment_status === PaymentStatus.PAID
  }

  get is_fulfilled(): boolean {
    return this.fulfillment_status === FulfillmentStatus.FULFILLED
  }

  get can_cancel(): boolean {
    return ![OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.REFUNDED].includes(this.status)
  }

  get can_refund(): boolean {
    return (
      this.payment_status === PaymentStatus.PAID && ![OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.status)
    )
  }
}
