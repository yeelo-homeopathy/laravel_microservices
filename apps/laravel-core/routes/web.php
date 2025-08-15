<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\AuthController as WebAuthController;

/*
|--------------------------------------------------------------------------
| Web Routes - E-commerce Platform Admin Panel
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// =============================================================================
// PUBLIC WEB ROUTES
// =============================================================================

// Landing page - redirect to admin dashboard or login
Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/admin');
    }
    return redirect('/login');
});

// Authentication Routes (Web Interface)
Route::middleware('guest')->group(function () {
    Route::get('/login', [WebAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [WebAuthController::class, 'login']);
    Route::get('/register', [WebAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [WebAuthController::class, 'register']);
    Route::get('/forgot-password', [WebAuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [WebAuthController::class, 'forgotPassword'])->name('password.email');
    Route::get('/reset-password/{token}', [WebAuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password', [WebAuthController::class, 'resetPassword'])->name('password.update');
});

// =============================================================================
// AUTHENTICATED WEB ROUTES
// =============================================================================

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Logout
    Route::post('/logout', [WebAuthController::class, 'logout'])->name('logout');
    
    // Admin Dashboard (React SPA)
    Route::prefix('admin')->group(function () {
        // Main dashboard route - serves React application
        Route::get('/{path?}', [DashboardController::class, 'index'])
            ->where('path', '.*')
            ->name('admin.dashboard');
    });
    
    // Profile Management
    Route::prefix('profile')->group(function () {
        Route::get('/', [DashboardController::class, 'profile'])->name('profile.show');
        Route::put('/', [DashboardController::class, 'updateProfile'])->name('profile.update');
        Route::delete('/', [DashboardController::class, 'deleteProfile'])->name('profile.delete');
    });
});

// =============================================================================
// EMAIL VERIFICATION ROUTES
// =============================================================================

Route::middleware('auth')->group(function () {
    Route::get('/email/verify', [WebAuthController::class, 'showVerifyEmail'])->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', [WebAuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [WebAuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});

// =============================================================================
// API DOCUMENTATION ROUTES
// =============================================================================

// Swagger UI for API documentation
Route::get('/api/documentation', function () {
    return view('swagger.index');
})->name('api.docs');

// OpenAPI JSON specification
Route::get('/api/openapi.json', function () {
    return response()->file(storage_path('api-docs/openapi.json'));
})->name('api.openapi');

// =============================================================================
// HEALTH CHECK ROUTES (Web Interface)
// =============================================================================

Route::prefix('system')->middleware(['auth', 'role:super-admin|admin'])->group(function () {
    Route::get('/health', [DashboardController::class, 'systemHealth'])->name('system.health');
    Route::get('/services', [DashboardController::class, 'servicesStatus'])->name('system.services');
    Route::get('/metrics', [DashboardController::class, 'systemMetrics'])->name('system.metrics');
});

// =============================================================================
// DEVELOPMENT ROUTES (Only in non-production environments)
// =============================================================================

if (app()->environment(['local', 'staging'])) {
    // Telescope (Laravel debugging tool)
    Route::get('/telescope', function () {
        return redirect('/telescope/requests');
    });
    
    // Horizon (Queue monitoring)
    Route::get('/horizon', function () {
        return redirect('/horizon/dashboard');
    });
    
    // API testing interface
    Route::get('/api-test', function () {
        return view('api-test.index');
    })->name('api.test');
}
