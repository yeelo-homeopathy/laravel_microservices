<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

Route::prefix('api')->middleware(['api'])->group(function () {
    // Health check endpoint for liveness probe
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Readiness check endpoint - checks all dependencies
    Route::get('/ready', function () {
        try {
            // Check database connection
            DB::connection()->getPdo();
            
            // Check Redis connection
            Redis::connection()->ping();

            return response()->json([
                'status' => 'ready',
                'database' => 'connected',
                'cache' => 'connected',
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'not_ready',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 503);
        }
    });
});
