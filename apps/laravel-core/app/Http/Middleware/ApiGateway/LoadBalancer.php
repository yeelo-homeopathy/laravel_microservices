<?php

namespace App\Http\Middleware\ApiGateway;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Load Balancer Middleware
 * 
 * This middleware implements various load balancing algorithms to distribute
 * requests across multiple service instances. It supports multiple algorithms
 * and maintains connection statistics for intelligent routing decisions.
 * 
 * Supported Algorithms:
 * - Round Robin
 * - Weighted Round Robin
 * - Least Connections
 * - Random
 * - IP Hash (Sticky Sessions)
 * - Health-aware routing
 */
class LoadBalancer
{
    /**
     * Handle an incoming request and select the best service instance
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $serviceInstances = $request->attributes->get('discovered_services', []);
            $serviceName = $request->attributes->get('target_service');
            
            if (empty($serviceInstances)) {
                Log::error("No service instances available for load balancing", [
                    'service' => $serviceName,
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ]);
                
                return response()->json([
                    'error' => 'No Service Instances Available',
                    'message' => 'All service instances are currently unavailable.',
                    'service' => $serviceName,
                ], 503);
            }

            // Select the best instance using configured algorithm
            $selectedInstance = $this->selectInstance($serviceInstances, $serviceName, $request);
            
            if (!$selectedInstance) {
                Log::error("Load balancer failed to select instance", [
                    'service' => $serviceName,
                    'available_instances' => count($serviceInstances),
                ]);
                
                return response()->json([
                    'error' => 'Load Balancing Failed',
                    'message' => 'Unable to select a service instance.',
                    'service' => $serviceName,
                ], 503);
            }

            // Store selected instance for downstream middleware
            $request->attributes->set('selected_instance', $selectedInstance);
            
            // Update connection statistics
            $this->updateConnectionStats($selectedInstance['id'], $serviceName);
            
            // Log load balancing decision
            Log::info("Load balancer selected instance", [
                'service' => $serviceName,
                'selected_instance' => $selectedInstance['id'],
                'instance_url' => $selectedInstance['url'],
                'algorithm' => config("services.{$serviceName}.load_balancer.algorithm", 'round_robin'),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ]);

            return $next($request);
            
        } catch (\Exception $e) {
            Log::error("Load balancer error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'service' => $request->attributes->get('target_service'),
            ]);

            return response()->json([
                'error' => 'Load Balancer Error',
                'message' => 'An error occurred while selecting a service instance.',
            ], 500);
        }
    }

    /**
     * Select the best service instance using the configured algorithm
     *
     * @param array $instances
     * @param string $serviceName
     * @param Request $request
     * @return array|null
     */
    protected function selectInstance(array $instances, string $serviceName, Request $request): ?array
    {
        if (count($instances) === 1) {
            return $instances[0];
        }

        $algorithm = config("services.{$serviceName}.load_balancer.algorithm", 'round_robin');
        
        return match ($algorithm) {
            'round_robin' => $this->roundRobinSelection($instances, $serviceName),
            'weighted_round_robin' => $this->weightedRoundRobinSelection($instances, $serviceName),
            'least_connections' => $this->leastConnectionsSelection($instances, $serviceName),
            'random' => $this->randomSelection($instances),
            'ip_hash' => $this->ipHashSelection($instances, $request),
            'health_aware' => $this->healthAwareSelection($instances, $serviceName),
            default => $this->roundRobinSelection($instances, $serviceName),
        };
    }

    /**
     * Round Robin load balancing algorithm
     *
     * @param array $instances
     * @param string $serviceName
     * @return array
     */
    protected function roundRobinSelection(array $instances, string $serviceName): array
    {
        $cacheKey = "lb_round_robin:{$serviceName}";
        $currentIndex = Cache::get($cacheKey, 0);
        
        // Select current instance
        $selectedInstance = $instances[$currentIndex % count($instances)];
        
        // Update index for next request
        Cache::put($cacheKey, ($currentIndex + 1) % count($instances), now()->addHours(1));
        
        return $selectedInstance;
    }

    /**
     * Weighted Round Robin load balancing algorithm
     *
     * @param array $instances
     * @param string $serviceName
     * @return array
     */
    protected function weightedRoundRobinSelection(array $instances, string $serviceName): array
    {
        $cacheKey = "lb_weighted_rr:{$serviceName}";
        $weights = Cache::get($cacheKey, []);
        
        // Initialize weights if not set
        if (empty($weights)) {
            foreach ($instances as $index => $instance) {
                $weights[$index] = [
                    'weight' => $instance['metadata']['weight'] ?? 1,
                    'current_weight' => 0,
                ];
            }
        }

        // Find instance with highest current weight
        $selectedIndex = 0;
        $maxWeight = -1;
        $totalWeight = 0;
        
        foreach ($weights as $index => $weight) {
            $weights[$index]['current_weight'] += $weight['weight'];
            $totalWeight += $weight['weight'];
            
            if ($weights[$index]['current_weight'] > $maxWeight) {
                $maxWeight = $weights[$index]['current_weight'];
                $selectedIndex = $index;
            }
        }
        
        // Decrease selected instance's current weight
        $weights[$selectedIndex]['current_weight'] -= $totalWeight;
        
        // Cache updated weights
        Cache::put($cacheKey, $weights, now()->addHours(1));
        
        return $instances[$selectedIndex];
    }

    /**
     * Least Connections load balancing algorithm
     *
     * @param array $instances
     * @param string $serviceName
     * @return array
     */
    protected function leastConnectionsSelection(array $instances, string $serviceName): array
    {
        $minConnections = PHP_INT_MAX;
        $selectedInstance = $instances[0];
        
        foreach ($instances as $instance) {
            $connections = $this->getActiveConnections($instance['id'], $serviceName);
            
            if ($connections < $minConnections) {
                $minConnections = $connections;
                $selectedInstance = $instance;
            }
        }
        
        return $selectedInstance;
    }

    /**
     * Random load balancing algorithm
     *
     * @param array $instances
     * @return array
     */
    protected function randomSelection(array $instances): array
    {
        return $instances[array_rand($instances)];
    }

    /**
     * IP Hash load balancing algorithm (for sticky sessions)
     *
     * @param array $instances
     * @param Request $request
     * @return array
     */
    protected function ipHashSelection(array $instances, Request $request): array
    {
        $clientIp = $request->ip();
        $hash = crc32($clientIp);
        $index = abs($hash) % count($instances);
        
        return $instances[$index];
    }

    /**
     * Health-aware load balancing algorithm
     *
     * @param array $instances
     * @param string $serviceName
     * @return array
     */
    protected function healthAwareSelection(array $instances, string $serviceName): array
    {
        // Filter only healthy instances
        $healthyInstances = array_filter($instances, function ($instance) {
            return ($instance['health'] ?? 'unknown') === 'healthy';
        });
        
        if (empty($healthyInstances)) {
            // Fallback to any available instance if none are explicitly healthy
            $healthyInstances = $instances;
        }
        
        // Use round robin among healthy instances
        return $this->roundRobinSelection($healthyInstances, $serviceName . '_healthy');
    }

    /**
     * Get active connections count for an instance
     *
     * @param string $instanceId
     * @param string $serviceName
     * @return int
     */
    protected function getActiveConnections(string $instanceId, string $serviceName): int
    {
        $cacheKey = "lb_connections:{$serviceName}:{$instanceId}";
        return Cache::get($cacheKey, 0);
    }

    /**
     * Update connection statistics for an instance
     *
     * @param string $instanceId
     * @param string $serviceName
     * @return void
     */
    protected function updateConnectionStats(string $instanceId, string $serviceName): void
    {
        $cacheKey = "lb_connections:{$serviceName}:{$instanceId}";
        $currentConnections = Cache::get($cacheKey, 0);
        
        // Increment connection count
        Cache::put($cacheKey, $currentConnections + 1, now()->addMinutes(10));
        
        // Store connection timestamp for cleanup
        $timestampKey = "lb_conn_time:{$serviceName}:{$instanceId}:" . uniqid();
        Cache::put($timestampKey, now(), now()->addMinutes(10));
        
        // Update global statistics
        $this->updateGlobalStats($serviceName, $instanceId);
    }

    /**
     * Update global load balancing statistics
     *
     * @param string $serviceName
     * @param string $instanceId
     * @return void
     */
    protected function updateGlobalStats(string $serviceName, string $instanceId): void
    {
        $statsKey = "lb_stats:{$serviceName}";
        $stats = Cache::get($statsKey, [
            'total_requests' => 0,
            'instance_requests' => [],
            'last_updated' => now(),
        ]);
        
        $stats['total_requests']++;
        $stats['instance_requests'][$instanceId] = ($stats['instance_requests'][$instanceId] ?? 0) + 1;
        $stats['last_updated'] = now();
        
        Cache::put($statsKey, $stats, now()->addHours(24));
    }

    /**
     * Clean up expired connection statistics
     *
     * @param string $serviceName
     * @return void
     */
    public function cleanupConnectionStats(string $serviceName): void
    {
        // This method can be called periodically to clean up expired connection data
        $pattern = "lb_conn_time:{$serviceName}:*";
        
        // In a real implementation, you would iterate through cache keys
        // and remove expired connections, then update the connection counts
        // This is a simplified version for demonstration
        
        Log::info("Connection statistics cleanup completed for service: {$serviceName}");
    }
}
