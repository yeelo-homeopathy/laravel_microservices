<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Service Discovery Service
 * 
 * Handles discovery and health monitoring of microservices
 * in the e-commerce platform.
 */
class ServiceDiscoveryService
{
    private array $services;
    private int $healthCheckInterval = 30; // seconds

    public function __construct()
    {
        $this->services = config('services.microservices', []);
    }

    /**
     * Get all registered services
     */
    public function getAllServices(): array
    {
        return $this->services;
    }

    /**
     * Get healthy instances for a service
     */
    public function getHealthyInstances(string $serviceName): array
    {
        $service = $this->services[$serviceName] ?? null;
        
        if (!$service) {
            return [];
        }

        $healthyInstances = [];
        
        foreach ($service['instances'] as $instance) {
            if ($this->isInstanceHealthy($serviceName, $instance)) {
                $healthyInstances[] = $instance;
            }
        }

        return $healthyInstances;
    }

    /**
     * Get service health status
     */
    public function getServiceHealth(string $serviceName): array
    {
        $service = $this->services[$serviceName] ?? null;
        
        if (!$service) {
            return [
                'status' => 'unknown',
                'message' => 'Service not found',
            ];
        }

        $instances = [];
        $healthyCount = 0;
        
        foreach ($service['instances'] as $instance) {
            $isHealthy = $this->isInstanceHealthy($serviceName, $instance);
            
            $instances[] = [
                'host' => $instance['host'],
                'port' => $instance['port'],
                'status' => $isHealthy ? 'healthy' : 'unhealthy',
                'last_check' => $this->getLastHealthCheck($serviceName, $instance),
            ];
            
            if ($isHealthy) {
                $healthyCount++;
            }
        }

        return [
            'service' => $serviceName,
            'status' => $healthyCount > 0 ? 'healthy' : 'unhealthy',
            'healthy_instances' => $healthyCount,
            'total_instances' => count($service['instances']),
            'instances' => $instances,
        ];
    }

    /**
     * Get health status for all services
     */
    public function getAllServicesHealth(): array
    {
        $servicesHealth = [];
        
        foreach (array_keys($this->services) as $serviceName) {
            $servicesHealth[$serviceName] = $this->getServiceHealth($serviceName);
        }

        return $servicesHealth;
    }

    /**
     * Check if a service instance is healthy
     */
    private function isInstanceHealthy(string $serviceName, array $instance): bool
    {
        $cacheKey = "service_health_{$serviceName}_{$instance['host']}_{$instance['port']}";
        
        return Cache::remember($cacheKey, $this->healthCheckInterval, function () use ($serviceName, $instance) {
            return $this->performHealthCheck($serviceName, $instance);
        });
    }

    /**
     * Perform actual health check on service instance
     */
    private function performHealthCheck(string $serviceName, array $instance): bool
    {
        try {
            $url = "http://{$instance['host']}:{$instance['port']}/health";
            
            $response = Http::timeout(5)->get($url);
            
            $isHealthy = $response->successful() && 
                        ($response->json('status') === 'healthy' || $response->json('status') === 'ok');
            
            // Cache the last check time
            $this->cacheLastHealthCheck($serviceName, $instance, now());
            
            if (!$isHealthy) {
                Log::warning("Service instance unhealthy", [
                    'service' => $serviceName,
                    'instance' => "{$instance['host']}:{$instance['port']}",
                    'status_code' => $response->status(),
                    'response' => $response->body(),
                ]);
            }
            
            return $isHealthy;
            
        } catch (\Exception $e) {
            Log::error("Health check failed", [
                'service' => $serviceName,
                'instance' => "{$instance['host']}:{$instance['port']}",
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Cache the last health check time
     */
    private function cacheLastHealthCheck(string $serviceName, array $instance, $timestamp): void
    {
        $cacheKey = "service_last_check_{$serviceName}_{$instance['host']}_{$instance['port']}";
        Cache::put($cacheKey, $timestamp, 3600); // 1 hour
    }

    /**
     * Get the last health check time
     */
    private function getLastHealthCheck(string $serviceName, array $instance): ?string
    {
        $cacheKey = "service_last_check_{$serviceName}_{$instance['host']}_{$instance['port']}";
        $timestamp = Cache::get($cacheKey);
        
        return $timestamp ? $timestamp->toISOString() : null;
    }
}
