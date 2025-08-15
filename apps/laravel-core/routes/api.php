<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ServiceProxyController;
use App\Http\Middleware\ApiGateway\ServiceDiscovery;
use App\Http\Middleware\ApiGateway\LoadBalancer;
use App\Http\Middleware\ApiGateway\CircuitBreaker;
use App\Http\Middleware\ApiGateway\RateLimiter;
use App\Http\Middleware\ApiGateway\RequestTransformer;
use App\Http\Middleware\ApiGateway\ResponseTransformer;

/*
|--------------------------------------------------------------------------
| API Routes - E-commerce Platform API Gateway
|--------------------------------------------------------------------------
|
| This file contains the API routes for the e-commerce platform.
| The Laravel core application acts as an API Gateway, routing requests
| to appropriate microservices while handling authentication, rate limiting,
| and request/response transformation.
|
*/

// =============================================================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================================================

// Health Check Endpoints
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'index']);
    Route::get('/services', [HealthController::class, 'services']);
    Route::get('/detailed', [HealthController::class, 'detailed']);
});

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    
    // OAuth Routes
    Route::get('/oauth/{provider}', [AuthController::class, 'redirectToProvider']);
    Route::get('/oauth/{provider}/callback', [AuthController::class, 'handleProviderCallback']);
});

// =============================================================================
// PROTECTED ROUTES (Authentication Required)
// =============================================================================

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Authentication Management
    Route::prefix('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/sessions', [AuthController::class, 'sessions']);
        Route::delete('/sessions/{id}', [AuthController::class, 'revokeSession']);
    });

    // =============================================================================
    // MICROSERVICE PROXY ROUTES
    // =============================================================================
    
    /*
     * Identity & Access Management Service
     * Handles user management, roles, permissions, and authentication
     */
    Route::prefix('identity')->middleware([
        ServiceDiscovery::class . ':identity',
        LoadBalancer::class,
        CircuitBreaker::class . ':identity',
        RateLimiter::class . ':identity:100,1', // 100 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('identity.proxy');
    });

    /*
     * Catalog Service
     * Handles products, categories, brands, and product information
     */
    Route::prefix('catalog')->middleware([
        ServiceDiscovery::class . ':catalog',
        LoadBalancer::class,
        CircuitBreaker::class . ':catalog',
        RateLimiter::class . ':catalog:200,1', // 200 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('catalog.proxy');
    });

    /*
     * Inventory Service
     * Handles stock management, warehouse operations, and inventory tracking
     */
    Route::prefix('inventory')->middleware([
        ServiceDiscovery::class . ':inventory',
        LoadBalancer::class,
        CircuitBreaker::class . ':inventory',
        RateLimiter::class . ':inventory:150,1', // 150 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('inventory.proxy');
    });

    /*
     * Pricing Service
     * Handles dynamic pricing, discounts, promotions, and price calculations
     */
    Route::prefix('pricing')->middleware([
        ServiceDiscovery::class . ':pricing',
        LoadBalancer::class,
        CircuitBreaker::class . ':pricing',
        RateLimiter::class . ':pricing:300,1', // 300 requests per minute (high frequency)
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('pricing.proxy');
    });

    /*
     * Orders Service
     * Handles order processing, fulfillment, and order management
     */
    Route::prefix('orders')->middleware([
        ServiceDiscovery::class . ':orders',
        LoadBalancer::class,
        CircuitBreaker::class . ':orders',
        RateLimiter::class . ':orders:100,1', // 100 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('orders.proxy');
    });

    /*
     * Payments Service
     * Handles payment processing, refunds, and financial transactions
     */
    Route::prefix('payments')->middleware([
        ServiceDiscovery::class . ':payments',
        LoadBalancer::class,
        CircuitBreaker::class . ':payments',
        RateLimiter::class . ':payments:50,1', // 50 requests per minute (sensitive operations)
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('payments.proxy');
    });

    /*
     * Notifications Service
     * Handles email, SMS, push notifications, and communication
     */
    Route::prefix('notifications')->middleware([
        ServiceDiscovery::class . ':notifications',
        LoadBalancer::class,
        CircuitBreaker::class . ':notifications',
        RateLimiter::class . ':notifications:200,1', // 200 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('notifications.proxy');
    });

    /*
     * Analytics Service
     * Handles data analytics, reporting, and business intelligence
     */
    Route::prefix('analytics')->middleware([
        ServiceDiscovery::class . ':analytics',
        LoadBalancer::class,
        CircuitBreaker::class . ':analytics',
        RateLimiter::class . ':analytics:100,1', // 100 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('analytics.proxy');
    });

    /*
     * Search Service
     * Handles product search, filtering, and search analytics
     */
    Route::prefix('search')->middleware([
        ServiceDiscovery::class . ':search',
        LoadBalancer::class,
        CircuitBreaker::class . ':search',
        RateLimiter::class . ':search:500,1', // 500 requests per minute (high frequency)
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('search.proxy');
    });

    /*
     * Reviews Service
     * Handles product reviews, ratings, and review management
     */
    Route::prefix('reviews')->middleware([
        ServiceDiscovery::class . ':reviews',
        LoadBalancer::class,
        CircuitBreaker::class . ':reviews',
        RateLimiter::class . ':reviews:100,1', // 100 requests per minute
        RequestTransformer::class,
        ResponseTransformer::class,
    ])->group(function () {
        Route::any('/{path?}', [ServiceProxyController::class, 'proxy'])
            ->where('path', '.*')
            ->name('reviews.proxy');
    });
});

// =============================================================================
// ADMIN ROUTES (Admin Authentication Required)
// =============================================================================

Route::middleware(['auth:sanctum', 'role:super-admin|admin'])->prefix('admin')->group(function () {
    
    // Service Management
    Route::prefix('services')->group(function () {
        Route::get('/', [ServiceProxyController::class, 'listServices']);
        Route::get('/{service}/health', [ServiceProxyController::class, 'serviceHealth']);
        Route::post('/{service}/restart', [ServiceProxyController::class, 'restartService']);
        Route::get('/{service}/metrics', [ServiceProxyController::class, 'serviceMetrics']);
        Route::get('/{service}/logs', [ServiceProxyController::class, 'serviceLogs']);
    });

    // API Gateway Configuration
    Route::prefix('gateway')->group(function () {
        Route::get('/config', [ServiceProxyController::class, 'getGatewayConfig']);
        Route::put('/config', [ServiceProxyController::class, 'updateGatewayConfig']);
        Route::get('/metrics', [ServiceProxyController::class, 'gatewayMetrics']);
        Route::get('/circuit-breakers', [ServiceProxyController::class, 'circuitBreakerStatus']);
        Route::post('/circuit-breakers/{service}/reset', [ServiceProxyController::class, 'resetCircuitBreaker']);
    });

    // Rate Limiting Management
    Route::prefix('rate-limits')->group(function () {
        Route::get('/', [ServiceProxyController::class, 'getRateLimits']);
        Route::put('/{service}', [ServiceProxyController::class, 'updateRateLimit']);
        Route::delete('/{service}/reset', [ServiceProxyController::class, 'resetRateLimit']);
    });
});

// =============================================================================
// FALLBACK ROUTES
// =============================================================================

// API Documentation
Route::get('/docs', function () {
    return response()->json([
        'message' => 'E-commerce Platform API Gateway',
        'version' => '1.0.0',
        'documentation' => url('/api/documentation'),
        'health' => url('/api/health'),
        'services' => [
            'identity' => 'User management and authentication',
            'catalog' => 'Product catalog and categories',
            'inventory' => 'Stock and warehouse management',
            'pricing' => 'Dynamic pricing and promotions',
            'orders' => 'Order processing and fulfillment',
            'payments' => 'Payment processing and transactions',
            'notifications' => 'Email, SMS, and push notifications',
            'analytics' => 'Data analytics and reporting',
            'search' => 'Product search and filtering',
            'reviews' => 'Product reviews and ratings',
        ],
    ]);
});

// Catch-all route for undefined API endpoints
Route::fallback(function () {
    return response()->json([
        'error' => 'API endpoint not found',
        'message' => 'The requested API endpoint does not exist.',
        'documentation' => url('/api/docs'),
    ], 404);
});
