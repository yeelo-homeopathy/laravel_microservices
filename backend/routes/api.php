<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\DashboardController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Products & Brands
    Route::apiResource('products', ProductController::class);
    Route::get('/products/{id}/stock', [ProductController::class, 'getStock']);
    Route::apiResource('brands', 'BrandController');

    // Inventory & Batches
    Route::get('/inventory/aging', [InventoryController::class, 'agingReport']);
    Route::get('/inventory/expiry-alerts', [InventoryController::class, 'expiryAlerts']);
    Route::get('/inventory/dead-stock', [InventoryController::class, 'deadStock']);
    Route::apiResource('batches', BatchController::class);
    Route::get('/batches/aging/analysis', [BatchController::class, 'getAgingAnalysis']);
    Route::get('/batches/expiry/alerts', [BatchController::class, 'getExpiryAlerts']);

    // Sales Orders
    Route::apiResource('sales-orders', SalesOrderController::class);
    Route::patch('/sales-orders/{salesOrder}/status', [SalesOrderController::class, 'updateStatus']);

    // Purchase Orders
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('/purchase-orders/{purchaseOrder}/receive-goods', [PurchaseOrderController::class, 'receiveGoods']);

    // Customers & Suppliers
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/outstanding', [CustomerController::class, 'getOutstanding']);
    Route::apiResource('suppliers', SupplierController::class);

    // Payments
    Route::apiResource('payments', PaymentController::class);
    Route::post('/payments/sales-order/{salesOrder}', [PaymentController::class, 'recordPayment']);

    // Analytics & Dashboard
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::get('/dashboard/sales-summary', [DashboardController::class, 'salesSummary']);
    Route::get('/analytics/aging', [DashboardController::class, 'agingAnalysis']);
    Route::get('/analytics/profitability', [DashboardController::class, 'profitabilityAnalysis']);
});
