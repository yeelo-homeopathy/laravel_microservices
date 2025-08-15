<?php

namespace App\Events\User;

use App\Events\BaseEvent;
use App\Models\User;

/**
 * User Registered Event
 * 
 * Fired when a new user registers on the platform.
 * This event triggers various downstream processes like:
 * - Welcome email sending
 * - User profile creation
 * - Analytics tracking
 * - Notification to admin users
 */
class UserRegistered extends BaseEvent
{
    public function __construct(
        public readonly User $user,
        ?string $correlationId = null,
        ?string $causationId = null,
        array $metadata = []
    ) {
        parent::__construct(
            aggregateId: $this->user->id,
            aggregateType: 'User',
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
            'user_id' => $this->user->id,
            'name' => $this->user->name,
            'email' => $this->user->email,
            'role' => $this->user->role,
            'status' => $this->user->status,
            'email_verified' => $this->user->email_verified_at !== null,
            'registered_at' => $this->user->created_at->toISOString(),
        ];
    }

    /**
     * Get the channels the event should broadcast on
     */
    public function broadcastOn(): array
    {
        return [
            new \Illuminate\Broadcasting\PrivateChannel('admin'),
            new \Illuminate\Broadcasting\Channel('user-registrations'),
        ];
    }
}
