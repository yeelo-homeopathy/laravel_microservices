<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Microservices Configuration
    |--------------------------------------------------------------------------
    */

    'microservices' => [
        'identity' => [
            'name' => 'Identity Service',
            'description' => 'User management and authentication',
            'instances' => [
                [
                    'host' => env('IDENTITY_SERVICE_HOST', 'svc-identity'),
                    'port' => env('IDENTITY_SERVICE_PORT', 3000),
                ],
            ],
        ],
        'catalog' => [
            'name' => 'Catalog Service',
            'description' => 'Product catalog and categories',
            'instances' => [
                [
                    'host' => env('CATALOG_SERVICE_HOST', 'svc-catalog'),
                    'port' => env('CATALOG_SERVICE_PORT', 3000),
                ],
            ],
        ],
        'inventory' => [
            'name' => 'Inventory Service',
            'description' => 'Stock and warehouse management',
            'instances' => [
                [
                    'host' => env('INVENTORY_SERVICE_HOST', 'svc-inventory'),
                    'port' => env('INVENTORY_SERVICE_PORT', 3000),
                ],
            ],
        ],
        'pricing' => [
            'name' => 'Pricing Service',
            'description' => 'Dynamic pricing and promotions',
            'instances' => [
                [
                    'host' => env('PRICING_SERVICE_HOST', 'svc-pricing'),
                    'port' => env('PRICING_SERVICE_PORT', 3000),
                ],
            ],
        ],
        'orders' => [
            'name' => 'Orders Service',
            'description' => 'Order processing and fulfillment',
            'instances' => [
                [
                    'host' => env('ORDERS_SERVICE_HOST', 'svc-orders'),
                    'port' => env('ORDERS_SERVICE_PORT', 3000),
                ],
            ],
        ],
        'payments' => [
            'name' => 'Payments Service',
            'description' => 'Payment processing and transactions',
            'instances' => [
                [
                    'host' => env('PAYMENTS_SERVICE_HOST', 'svc-payments'),
                    'port' => env('PAYMENTS_SERVICE_PORT', 3000),
                ],
            ],
        ],
    ],
];
