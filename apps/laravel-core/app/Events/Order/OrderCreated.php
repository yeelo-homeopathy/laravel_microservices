<?php

namespace App\Events\Order;

use App\Events\BaseEvent;

/**
 * Order Created Event
 * 
 * Fired when a new order is created in the system.
 * This event triggers various downstream processes like:
 * - Inventory reservation
 * - Payment processing
 * - Order confirmation email
 * - Analytics tracking
 * - Seller notifications
 */
class OrderCreated extends BaseEvent
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $orderNumber,
        public readonly string $customerId,
        public readonly array $items,
        public readonly float $totalAmount,
        public readonly string $currency,
        public readonly array $shippingAddress,
        public readonly array $billingAddress,
        ?string $correlationId = null,
        ?string $causationId = null,
        array $metadata = []
    ) {
        parent::__construct(
            aggregateId: $this->orderId,
            aggregateType: 'Order',
            correlationId: $correlationId,
            causationId: $causationId,
            metadata: $metadata
        );
    }

    /**
     * Get the event payload
     */
    public function getPayload(): array
    {
        return [
            'order_id' => $this->orderId,
            'order_number' => $this->orderNumber,
            'customer_id' => $this->customerId,
            'items' => $this->items,
            'total_amount' => $this->totalAmount,
            'currency' => $this->currency,
            'shipping_address' => $this->shippingAddress,
            'billing_address' => $this->billingAddress,
        ];
    }

    /**
     * Get the channels the event should broadcast on
     */
    public function broadcastOn(): array
    {
        return [
            new \Illuminate\Broadcasting\PrivateChannel('admin'),
            new \Illuminate\Broadcasting\PrivateChannel("customer.{$this->customerId}"),
            new \Illuminate\Broadcasting\Channel('orders'),
        ];
    }
}
