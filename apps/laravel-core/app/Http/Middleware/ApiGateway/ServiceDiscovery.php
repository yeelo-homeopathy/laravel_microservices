<?php

namespace App\Http\Middleware\ApiGateway;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\ApiGateway\ServiceRegistry;
use Symfony\Component\HttpFoundation\Response;

/**
 * Service Discovery Middleware
 * 
 * This middleware handles service discovery for the API Gateway.
 * It discovers available service instances, maintains service registry,
 * and handles service health checking for load balancing decisions.
 * 
 * Features:
 * - Automatic service discovery
 * - Health check monitoring
 * - Service registry management
 * - Failover handling
 * - Service metadata caching
 */
class ServiceDiscovery
{
    protected ServiceRegistry $serviceRegistry;
    
    public function __construct(ServiceRegistry $serviceRegistry)
    {
        $this->serviceRegistry = $serviceRegistry;
    }

    /**
     * Handle an incoming request and discover available services
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $serviceName
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $serviceName): Response
    {
        try {
            // Discover and validate service instances
            $serviceInstances = $this->discoverServiceInstances($serviceName);
            
            if (empty($serviceInstances)) {
                Log::error("No healthy instances found for service: {$serviceName}");
                
                return response()->json([
                    'error' => 'Service Unavailable',
                    'message' => "The {$serviceName} service is currently unavailable. Please try again later.",
                    'service' => $serviceName,
                    'timestamp' => now()->toISOString(),
                ], 503);
            }

            // Store discovered services in request for downstream middleware
            $request->attributes->set('discovered_services', $serviceInstances);
            $request->attributes->set('target_service', $serviceName);
            
            // Log service discovery for monitoring
            Log::info("Service discovery completed", [
                'service' => $serviceName,
                'instances_found' => count($serviceInstances),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ]);

            return $next($request);
            
        } catch (\Exception $e) {
            Log::error("Service discovery failed for {$serviceName}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ]);

            return response()->json([
                'error' => 'Service Discovery Failed',
                'message' => 'Unable to locate the requested service. Please try again later.',
                'service' => $serviceName,
                'timestamp' => now()->toISOString(),
            ], 503);
        }
    }

    /**
     * Discover available instances for a service
     *
     * @param string $serviceName
     * @return array
     */
    protected function discoverServiceInstances(string $serviceName): array
    {
        // Check cache first for performance
        $cacheKey = "service_discovery:{$serviceName}";
        $cachedInstances = Cache::get($cacheKey);
        
        if ($cachedInstances && $this->shouldUseCachedInstances($serviceName)) {
            return $cachedInstances;
        }

        // Discover fresh service instances
        $instances = $this->performServiceDiscovery($serviceName);
        
        // Filter healthy instances
        $healthyInstances = $this->filterHealthyInstances($instances);
        
        // Cache the results
        if (!empty($healthyInstances)) {
            Cache::put($cacheKey, $healthyInstances, now()->addMinutes(5));
        }
        
        return $healthyInstances;
    }

    /**
     * Perform actual service discovery based on configuration
     *
     * @param string $serviceName
     * @return array
     */
    protected function performServiceDiscovery(string $serviceName): array
    {
        $discoveryMethod = config("services.discovery.method", "static");
        
        return match ($discoveryMethod) {
            'consul' => $this->discoverViaConsul($serviceName),
            'kubernetes' => $this->discoverViaKubernetes($serviceName),
            'docker' => $this->discoverViaDocker($serviceName),
            'static' => $this->discoverViaStaticConfig($serviceName),
            default => $this->discoverViaStaticConfig($serviceName),
        };
    }

    /**
     * Discover services via Consul service registry
     *
     * @param string $serviceName
     * @return array
     */
    protected function discoverViaConsul(string $serviceName): array
    {
        try {
            $consulUrl = config('services.consul.url', 'http://consul:8500');
            $response = Http::timeout(5)->get("{$consulUrl}/v1/health/service/{$serviceName}");
            
            if (!$response->successful()) {
                Log::warning("Consul service discovery failed for {$serviceName}");
                return $this->discoverViaStaticConfig($serviceName);
            }
            
            $services = $response->json();
            $instances = [];
            
            foreach ($services as $service) {
                if ($service['Checks'][0]['Status'] === 'passing') {
                    $instances[] = [
                        'id' => $service['Service']['ID'],
                        'host' => $service['Service']['Address'],
                        'port' => $service['Service']['Port'],
                        'url' => "http://{$service['Service']['Address']}:{$service['Service']['Port']}",
                        'health' => 'healthy',
                        'metadata' => $service['Service']['Meta'] ?? [],
                        'last_check' => now(),
                    ];
                }
            }
            
            return $instances;
            
        } catch (\Exception $e) {
            Log::error("Consul discovery error for {$serviceName}: " . $e->getMessage());
            return $this->discoverViaStaticConfig($serviceName);
        }
    }

    /**
     * Discover services via Kubernetes service discovery
     *
     * @param string $serviceName
     * @return array
     */
    protected function discoverViaKubernetes(string $serviceName): array
    {
        try {
            // In Kubernetes, services are typically accessed via DNS
            $namespace = config('services.kubernetes.namespace', 'default');
            $serviceDns = "{$serviceName}.{$namespace}.svc.cluster.local";
            
            // For Kubernetes, we typically use the service DNS name directly
            return [[
                'id' => "{$serviceName}-k8s",
                'host' => $serviceDns,
                'port' => config("services.{$serviceName}.port", 80),
                'url' => "http://{$serviceDns}:" . config("services.{$serviceName}.port", 80),
                'health' => 'healthy', // Kubernetes handles health checking
                'metadata' => ['type' => 'kubernetes'],
                'last_check' => now(),
            ]];
            
        } catch (\Exception $e) {
            Log::error("Kubernetes discovery error for {$serviceName}: " . $e->getMessage());
            return $this->discoverViaStaticConfig($serviceName);
        }
    }

    /**
     * Discover services via Docker service discovery
     *
     * @param string $serviceName
     * @return array
     */
    protected function discoverViaDocker(string $serviceName): array
    {
        try {
            // In Docker Compose, services are accessible by their service name
            $serviceHost = config("services.{$serviceName}.host", $serviceName);
            $servicePort = config("services.{$serviceName}.port", 80);
            
            return [[
                'id' => "{$serviceName}-docker",
                'host' => $serviceHost,
                'port' => $servicePort,
                'url' => "http://{$serviceHost}:{$servicePort}",
                'health' => 'healthy', // Docker Compose handles basic networking
                'metadata' => ['type' => 'docker'],
                'last_check' => now(),
            ]];
            
        } catch (\Exception $e) {
            Log::error("Docker discovery error for {$serviceName}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Discover services via static configuration
     *
     * @param string $serviceName
     * @return array
     */
    protected function discoverViaStaticConfig(string $serviceName): array
    {
        $serviceConfig = config("services.{$serviceName}");
        
        if (!$serviceConfig) {
            Log::warning("No configuration found for service: {$serviceName}");
            return [];
        }

        // Handle multiple instances
        if (isset($serviceConfig['instances'])) {
            $instances = [];
            foreach ($serviceConfig['instances'] as $index => $instance) {
                $instances[] = [
                    'id' => "{$serviceName}-{$index}",
                    'host' => $instance['host'],
                    'port' => $instance['port'],
                    'url' => "http://{$instance['host']}:{$instance['port']}",
                    'health' => 'unknown',
                    'metadata' => $instance['metadata'] ?? [],
                    'last_check' => null,
                ];
            }
            return $instances;
        }

        // Single instance configuration
        return [[
            'id' => $serviceName,
            'host' => $serviceConfig['host'] ?? $serviceName,
            'port' => $serviceConfig['port'] ?? 80,
            'url' => "http://{$serviceConfig['host']}:{$serviceConfig['port']}",
            'health' => 'unknown',
            'metadata' => $serviceConfig['metadata'] ?? [],
            'last_check' => null,
        ]];
    }

    /**
     * Filter instances based on health status
     *
     * @param array $instances
     * @return array
     */
    protected function filterHealthyInstances(array $instances): array
    {
        $healthyInstances = [];
        
        foreach ($instances as $instance) {
            if ($this->isInstanceHealthy($instance)) {
                $healthyInstances[] = $instance;
            }
        }
        
        return $healthyInstances;
    }

    /**
     * Check if a service instance is healthy
     *
     * @param array $instance
     * @return bool
     */
    protected function isInstanceHealthy(array $instance): bool
    {
        // If health status is already known and recent, use it
        if (isset($instance['health']) && $instance['health'] === 'healthy' && 
            isset($instance['last_check']) && 
            $instance['last_check'] > now()->subMinutes(2)) {
            return true;
        }

        // Perform health check
        try {
            $healthUrl = $instance['url'] . '/health';
            $response = Http::timeout(3)->get($healthUrl);
            
            $isHealthy = $response->successful() && 
                        ($response->json('status') === 'healthy' || $response->status() === 200);
            
            // Update instance health status
            $instance['health'] = $isHealthy ? 'healthy' : 'unhealthy';
            $instance['last_check'] = now();
            
            return $isHealthy;
            
        } catch (\Exception $e) {
            Log::debug("Health check failed for {$instance['url']}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Determine if cached instances should be used
     *
     * @param string $serviceName
     * @return bool
     */
    protected function shouldUseCachedInstances(string $serviceName): bool
    {
        // Use cached instances if discovery method is static or if we're in high-load scenario
        $discoveryMethod = config("services.discovery.method", "static");
        
        return $discoveryMethod === 'static' || 
               Cache::get("high_load_mode", false) ||
               config('services.discovery.prefer_cache', false);
    }
}
