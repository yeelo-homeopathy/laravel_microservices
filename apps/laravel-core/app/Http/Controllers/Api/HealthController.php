<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ServiceDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

/**
 * Health Check Controller
 * 
 * Provides health check endpoints for the API Gateway and microservices.
 * 
 * @OA\Tag(
 *     name="Health",
 *     description="System health check endpoints"
 * )
 */
class HealthController extends Controller
{
    public function __construct(
        private ServiceDiscoveryService $serviceDiscovery
    ) {}

    /**
     * Basic health check
     * 
     * @OA\Get(
     *     path="/api/health",
     *     tags={"Health"},
     *     summary="Basic health check",
     *     @OA\Response(
     *         response=200,
     *         description="System is healthy"
     *     )
     * )
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'service' => 'laravel-core',
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    /**
     * Services health check
     * 
     * @OA\Get(
     *     path="/api/health/services",
     *     tags={"Health"},
     *     summary="Check all services health",
     *     @OA\Response(
     *         response=200,
     *         description="Services health status"
     *     )
     * )
     */
    public function services(): JsonResponse
    {
        $services = $this->serviceDiscovery->getAllServicesHealth();
        $overallStatus = $this->calculateOverallStatus($services);
        
        return response()->json([
            'status' => $overallStatus,
            'services' => $services,
            'timestamp' => now()->toISOString(),
        ], $overallStatus === 'healthy' ? 200 : 503);
    }

    /**
     * Detailed health check
     * 
     * @OA\Get(
     *     path="/api/health/detailed",
     *     tags={"Health"},
     *     summary="Detailed system health check",
     *     @OA\Response(
     *         response=200,
     *         description="Detailed health information"
     *     )
     * )
     */
    public function detailed(): JsonResponse
    {
        $health = [
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'service' => 'laravel-core',
            'version' => config('app.version', '1.0.0'),
            'checks' => [
                'database' => $this->checkDatabase(),
                'redis' => $this->checkRedis(),
                'cache' => $this->checkCache(),
                'queue' => $this->checkQueue(),
                'storage' => $this->checkStorage(),
            ],
            'services' => $this->serviceDiscovery->getAllServicesHealth(),
            'system' => [
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
            ],
        ];

        // Calculate overall status
        $allChecks = array_merge(
            array_column($health['checks'], 'status'),
            array_column($health['services'], 'status')
        );
        
        $health['status'] = in_array('unhealthy', $allChecks) ? 'unhealthy' : 'healthy';
        
        return response()->json($health, $health['status'] === 'healthy' ? 200 : 503);
    }

    /**
     * Check database connectivity
     */
    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'healthy',
                'message' => 'Database connection successful',
                'response_time' => $this->measureResponseTime(fn() => DB::select('SELECT 1')),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Database connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Redis connectivity
     */
    private function checkRedis(): array
    {
        try {
            Redis::ping();
            return [
                'status' => 'healthy',
                'message' => 'Redis connection successful',
                'response_time' => $this->measureResponseTime(fn() => Redis::ping()),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Redis connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check cache functionality
     */
    private function checkCache(): array
    {
        try {
            $key = 'health_check_' . uniqid();
            $value = 'test_value';
            
            Cache::put($key, $value, 60);
            $retrieved = Cache::get($key);
            Cache::forget($key);
            
            if ($retrieved === $value) {
                return [
                    'status' => 'healthy',
                    'message' => 'Cache operations successful',
                ];
            } else {
                return [
                    'status' => 'unhealthy',
                    'message' => 'Cache value mismatch',
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Cache operations failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check queue functionality
     */
    private function checkQueue(): array
    {
        try {
            // Simple queue connection check
            $queueSize = Cache::get('queue_size', 0);
            
            return [
                'status' => 'healthy',
                'message' => 'Queue connection successful',
                'queue_size' => $queueSize,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Queue connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check storage functionality
     */
    private function checkStorage(): array
    {
        try {
            $testFile = storage_path('app/health_check.txt');
            file_put_contents($testFile, 'health check');
            $content = file_get_contents($testFile);
            unlink($testFile);
            
            return [
                'status' => 'healthy',
                'message' => 'Storage operations successful',
                'writable' => is_writable(storage_path('app')),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Storage operations failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Calculate overall status from services
     */
    private function calculateOverallStatus(array $services): string
    {
        foreach ($services as $service) {
            if ($service['status'] === 'unhealthy') {
                return 'unhealthy';
            }
        }
        return 'healthy';
    }

    /**
     * Measure response time for a callback
     */
    private function measureResponseTime(callable $callback): float
    {
        $start = microtime(true);
        $callback();
        return round((microtime(true) - $start) * 1000, 2); // milliseconds
    }
}
