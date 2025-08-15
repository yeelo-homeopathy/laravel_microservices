<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Kafka Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Apache Kafka integration in the e-commerce platform.
    | This handles event streaming between microservices for real-time
    | communication and event-driven architecture.
    |
    */

    'brokers' => env('KAFKA_BROKERS', 'kafka:9092'),
    
    'topic_prefix' => env('KAFKA_TOPIC_PREFIX', 'ecommerce'),
    
    'client_id' => env('KAFKA_CLIENT_ID', config('app.name', 'laravel-core')),
    
    /*
    |--------------------------------------------------------------------------
    | Producer Configuration
    |--------------------------------------------------------------------------
    */
    'producer' => [
        'acks' => env('KAFKA_PRODUCER_ACKS', 'all'),
        'retries' => env('KAFKA_PRODUCER_RETRIES', 3),
        'retry_backoff_ms' => env('KAFKA_PRODUCER_RETRY_BACKOFF_MS', 100),
        'batch_size' => env('KAFKA_PRODUCER_BATCH_SIZE', 16384),
        'linger_ms' => env('KAFKA_PRODUCER_LINGER_MS', 5),
        'compression_type' => env('KAFKA_PRODUCER_COMPRESSION', 'snappy'),
        'enable_idempotence' => env('KAFKA_PRODUCER_IDEMPOTENCE', true),
        'max_in_flight_requests' => env('KAFKA_PRODUCER_MAX_IN_FLIGHT', 1),
    ],

    /*
    |--------------------------------------------------------------------------
    | Consumer Configuration
    |--------------------------------------------------------------------------
    */
    'consumer' => [
        'group_id' => env('KAFKA_CONSUMER_GROUP', 'laravel-core-group'),
        'session_timeout_ms' => env('KAFKA_CONSUMER_SESSION_TIMEOUT', 30000),
        'heartbeat_interval_ms' => env('KAFKA_CONSUMER_HEARTBEAT_INTERVAL', 3000),
        'max_bytes_per_partition' => env('KAFKA_CONSUMER_MAX_BYTES_PER_PARTITION', 1048576),
        'auto_offset_reset' => env('KAFKA_CONSUMER_AUTO_OFFSET_RESET', 'latest'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Topic Configuration
    |--------------------------------------------------------------------------
    */
    'topics' => [
        'user_events' => [
            'user-registered',
            'user-updated',
            'user-deleted',
        ],
        'order_events' => [
            'order-created',
            'order-updated',
            'order-cancelled',
            'order-fulfilled',
        ],
        'payment_events' => [
            'payment-initiated',
            'payment-completed',
            'payment-failed',
            'payment-refunded',
        ],
        'inventory_events' => [
            'inventory-updated',
            'stock-low',
            'stock-out',
        ],
        'catalog_events' => [
            'product-created',
            'product-updated',
            'product-deleted',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Dead Letter Queue Configuration
    |--------------------------------------------------------------------------
    */
    'dead_letter_queue' => [
        'enabled' => env('KAFKA_DLQ_ENABLED', true),
        'topic' => env('KAFKA_DLQ_TOPIC', 'dead-letter-queue'),
        'max_retries' => env('KAFKA_DLQ_MAX_RETRIES', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Monitoring Configuration
    |--------------------------------------------------------------------------
    */
    'monitoring' => [
        'enabled' => env('KAFKA_MONITORING_ENABLED', true),
        'metrics_interval' => env('KAFKA_METRICS_INTERVAL', 60), // seconds
    ],
];
