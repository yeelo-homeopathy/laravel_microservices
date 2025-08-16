<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ServiceDiscoveryService;
use App\Services\LoadBalancerService;
use App\Services\CircuitBreakerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Service Proxy Controller
 * 
 * Handles proxying requests to microservices with load balancing,
 * circuit breaker patterns, and service discovery.
 * 
 * @OA\Tag(
 *     name="Service Proxy",
 *     description="Microservice proxy and management endpoints"
 * )
 */
class ServiceProxyController extends Controller
{
    public function __construct(
        private ServiceDiscoveryService $serviceDiscovery,
        private LoadBalancerService $loadBalancer,
        private CircuitBreakerService $circuitBreaker
    ) {}

    /**
     * Proxy requests to microservices
     * 
     * This method handles routing requests to appropriate microservices
     * with automatic load balancing, circuit breaker protection, and
     * request/response transformation.
     */
    public function proxy(Request $request): JsonResponse
    {
        $service = $request->route('service') ?? $this->extractServiceFromPath($request);
        $path = $request->route('path') ?? '';
        
        try {
            // Get service instance from load balancer
            $serviceInstance = $this->loadBalancer->getHealthyInstance($service);
            
            if (!$serviceInstance) {
                return $this->serviceUnavailableResponse($service);
            }

            // Check circuit breaker status
            if ($this->circuitBreaker->isOpen($service)) {
                return $this->circuitBreakerOpenResponse($service);
            }

            // Build target URL
            $targetUrl = $this->buildTargetUrl($serviceInstance, $path);
            
            // Prepare request headers
            $headers = $this->prepareHeaders($request);
            
            // Make HTTP request to microservice
            $response = $this->makeServiceRequest(
                $request->method(),
                $targetUrl,
                $request->all(),
                $headers
            );

            // Record successful request for circuit breaker
            $this->circuitBreaker->recordSuccess($service);
            
            // Transform and return response
            return $this->transformResponse($response);
            
        } catch (\Exception $e) {
            // Record failure for circuit breaker
            $this->circuitBreaker->recordFailure($service);
            
            Log::error("Service proxy error for {$service}", [
                'error' => $e->getMessage(),
                'path' => $path,
                'method' => $request->method(),
            ]);
            
            return $this->errorResponse($service, $e);
        }
    }

    /**
     * Get list of available services
     * 
     * @OA\Get(
     *     path="/api/admin/services",
     *     tags={"Service Proxy"},
     *     summary="List available services",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Services list retrieved successfully"
     *     )
     * )
     */
    public function listServices(): JsonResponse
    {
        $services = $this->serviceDiscovery->getAllServices();
        
        return response()->json([
            'services' => $services,
            'total' => count($services),
        ]);
    }

    /**
     * Get service health status
     */
    public function serviceHealth(string $service): JsonResponse
    {
        $health = $this->serviceDiscovery->getServiceHealth($service);
        
        return response()->json([
            'service' => $service,
            'health' => $health,
            'circuit_breaker' => $this->circuitBreaker->getStatus($service),
        ]);
    }

    /**
     * Get service metrics
     */
    public function serviceMetrics(string $service): JsonResponse
    {
        $metrics = Cache::get("service_metrics_{$service}", []);
        
        return response()->json([
            'service' => $service,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Get gateway configuration
     */
    public function getGatewayConfig(): JsonResponse
    {
        return response()->json([
            'services' => config('services'),
            'circuit_breakers' => $this->circuitBreaker->getAllStatus(),
            'load_balancer' => $this->loadBalancer->getConfiguration(),
        ]);
    }

    /**
     * Reset circuit breaker for a service
     */
    public function resetCircuitBreaker(string $service): JsonResponse
    {
        $this->circuitBreaker->reset($service);
        
        return response()->json([
            'message' => "Circuit breaker reset for service: {$service}",
        ]);
    }

    /**
     * Extract service name from request path
     */
    private function extractServiceFromPath(Request $request): string
    {
        $path = $request->path();
        $segments = explode('/', $path);
        
        // Assuming path format: api/{service}/{...}
        return $segments[1] ?? 'unknown';
    }

    /**
     * Build target URL for microservice
     */
    private function buildTargetUrl(array $serviceInstance, string $path): string
    {
        $baseUrl = "http://{$serviceInstance['host']}:{$serviceInstance['port']}";
        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }

    /**
     * Prepare headers for microservice request
     */
    private function prepareHeaders(Request $request): array
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'X-Gateway-Request-ID' => uniqid('gw_'),
            'X-Gateway-Timestamp' => now()->toISOString(),
        ];

        // Forward authentication headers
        if ($request->hasHeader('Authorization')) {
            $headers['Authorization'] = $request->header('Authorization');
        }

        // Forward user context
        if ($user = $request->user()) {
            $headers['X-User-ID'] = $user->id;
            $headers['X-User-Roles'] = $user->roles->pluck('name')->implode(',');
        }

        return $headers;
    }

    /**
     * Make HTTP request to microservice
     */
    private function makeServiceRequest(string $method, string $url, array $data, array $headers)
    {
        $http = Http::withHeaders($headers)->timeout(30);

        return match (strtoupper($method)) {
            'GET' => $http->get($url, $data),
            'POST' => $http->post($url, $data),
            'PUT' => $http->put($url, $data),
            'PATCH' => $http->patch($url, $data),
            'DELETE' => $http->delete($url, $data),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };
    }

    /**
     * Transform microservice response
     */
    private function transformResponse($response): JsonResponse
    {
        return response()->json(
            $response->json(),
            $response->status(),
            [
                'X-Gateway-Response-Time' => now()->toISOString(),
                'X-Service-Response-Time' => $response->header('X-Response-Time'),
            ]
        );
    }

    /**
     * Return service unavailable response
     */
    private function serviceUnavailableResponse(string $service): JsonResponse
    {
        return response()->json([
            'error' => 'Service Unavailable',
            'message' => "No healthy instances available for service: {$service}",
            'service' => $service,
        ], 503);
    }

    /**
     * Return circuit breaker open response
     */
    private function circuitBreakerOpenResponse(string $service): JsonResponse
    {
        return response()->json([
            'error' => 'Circuit Breaker Open',
            'message' => "Circuit breaker is open for service: {$service}",
            'service' => $service,
        ], 503);
    }

    /**
     * Return error response
     */
    private function errorResponse(string $service, \Exception $e): JsonResponse
    {
        return response()->json([
            'error' => 'Service Error',
            'message' => "Error communicating with service: {$service}",
            'details' => app()->environment('local') ? $e->getMessage() : null,
        ], 500);
    }
}
