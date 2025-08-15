<?php

namespace App\Http\Middleware\ApiGateway;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Circuit Breaker Middleware
 * 
 * This middleware implements the Circuit Breaker pattern to prevent cascading
 * failures in microservices architecture. It monitors service health and
 * automatically stops sending requests to failing services.
 * 
 * Circuit States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 * 
 * Features:
 * - Configurable failure thresholds
 * - Automatic recovery testing
 * - Fallback responses
 * - Detailed monitoring and logging
 */
class CircuitBreaker
{
    // Circuit breaker states
    const STATE_CLOSED = 'closed';
    const STATE_OPEN = 'open';
    const STATE_HALF_OPEN = 'half_open';

    /**
     * Handle an incoming request with circuit breaker protection
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $serviceName
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $serviceName): Response
    {
        try {
            $circuitState = $this->getCircuitState($serviceName);
            
            // Check if circuit is open (service is failing)
            if ($circuitState === self::STATE_OPEN) {
                if ($this->shouldAttemptRecovery($serviceName)) {
                    // Transition to half-open state for recovery testing
                    $this->setCircuitState($serviceName, self::STATE_HALF_OPEN);
                    Log::info("Circuit breaker transitioning to half-open", [
                        'service' => $serviceName,
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ]);
                } else {
                    // Circuit is open, return fallback response
                    return $this->getFallbackResponse($serviceName, $request);
                }
            }

            // Record request attempt
            $this->recordRequestAttempt($serviceName);
            
            // Process the request
            $startTime = microtime(true);
            $response = $next($request);
            $responseTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
            
            // Analyze response and update circuit state
            $this->analyzeResponse($serviceName, $response, $responseTime);
            
            return $response;
            
        } catch (\Exception $e) {
            // Record failure and update circuit state
            $this->recordFailure($serviceName, $e);
            
            Log::error("Circuit breaker caught exception", [
                'service' => $serviceName,
                'error' => $e->getMessage(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ]);
            
            // Check if we should open the circuit
            $this->evaluateCircuitState($serviceName);
            
            // Return fallback response for exceptions
            return $this->getFallbackResponse($serviceName, $request, $e);
        }
    }

    /**
     * Get the current circuit state for a service
     *
     * @param string $serviceName
     * @return string
     */
    protected function getCircuitState(string $serviceName): string
    {
        $cacheKey = "circuit_breaker:{$serviceName}:state";
        return Cache::get($cacheKey, self::STATE_CLOSED);
    }

    /**
     * Set the circuit state for a service
     *
     * @param string $serviceName
     * @param string $state
     * @return void
     */
    protected function setCircuitState(string $serviceName, string $state): void
    {
        $cacheKey = "circuit_breaker:{$serviceName}:state";
        $ttl = $this->getStateTTL($state);
        
        Cache::put($cacheKey, $state, $ttl);
        
        // Record state change timestamp
        $timestampKey = "circuit_breaker:{$serviceName}:state_changed";
        Cache::put($timestampKey, now(), now()->addHours(24));
        
        Log::info("Circuit breaker state changed", [
            'service' => $serviceName,
            'new_state' => $state,
            'ttl_minutes' => $ttl->diffInMinutes(now()),
        ]);
    }

    /**
     * Get TTL for circuit state based on state type
     *
     * @param string $state
     * @return \Carbon\Carbon
     */
    protected function getStateTTL(string $state): \Carbon\Carbon
    {
        return match ($state) {
            self::STATE_OPEN => now()->addMinutes(config('circuit_breaker.open_timeout', 60)),
            self::STATE_HALF_OPEN => now()->addMinutes(config('circuit_breaker.half_open_timeout', 30)),
            default => now()->addHours(24), // CLOSED state
        };
    }

    /**
     * Check if we should attempt recovery from open state
     *
     * @param string $serviceName
     * @return bool
     */
    protected function shouldAttemptRecovery(string $serviceName): bool
    {
        $stateChangedKey = "circuit_breaker:{$serviceName}:state_changed";
        $stateChanged = Cache::get($stateChangedKey);
        
        if (!$stateChanged) {
            return true; // No timestamp means we can try
        }
        
        $recoveryTimeout = config('circuit_breaker.recovery_timeout', 60); // minutes
        return $stateChanged->addMinutes($recoveryTimeout) <= now();
    }

    /**
     * Record a request attempt
     *
     * @param string $serviceName
     * @return void
     */
    protected function recordRequestAttempt(string $serviceName): void
    {
        $statsKey = "circuit_breaker:{$serviceName}:stats";
        $stats = $this->getCircuitStats($serviceName);
        
        $stats['total_requests']++;
        $stats['last_request'] = now();
        
        Cache::put($statsKey, $stats, now()->addHours(24));
    }

    /**
     * Analyze response and update circuit state accordingly
     *
     * @param string $serviceName
     * @param Response $response
     * @param float $responseTime
     * @return void
     */
    protected function analyzeResponse(string $serviceName, Response $response, float $responseTime): void
    {
        $isSuccess = $this->isSuccessfulResponse($response, $responseTime);
        
        if ($isSuccess) {
            $this->recordSuccess($serviceName, $responseTime);
        } else {
            $this->recordFailure($serviceName, null, $response);
        }
        
        // Evaluate if circuit state should change
        $this->evaluateCircuitState($serviceName);
    }

    /**
     * Determine if a response is considered successful
     *
     * @param Response $response
     * @param float $responseTime
     * @return bool
     */
    protected function isSuccessfulResponse(Response $response, float $responseTime): bool
    {
        $statusCode = $response->getStatusCode();
        $maxResponseTime = config('circuit_breaker.max_response_time', 5000); // 5 seconds
        
        // Consider 2xx and 3xx as success, but also check response time
        return $statusCode < 400 && $responseTime <= $maxResponseTime;
    }

    /**
     * Record a successful request
     *
     * @param string $serviceName
     * @param float $responseTime
     * @return void
     */
    protected function recordSuccess(string $serviceName, float $responseTime): void
    {
        $stats = $this->getCircuitStats($serviceName);
        
        $stats['successful_requests']++;
        $stats['total_response_time'] += $responseTime;
        $stats['last_success'] = now();
        
        // Reset consecutive failures on success
        $stats['consecutive_failures'] = 0;
        
        // If we're in half-open state and got a success, close the circuit
        if ($this->getCircuitState($serviceName) === self::STATE_HALF_OPEN) {
            $this->setCircuitState($serviceName, self::STATE_CLOSED);
            Log::info("Circuit breaker closed after successful recovery test", [
                'service' => $serviceName,
            ]);
        }
        
        $this->updateCircuitStats($serviceName, $stats);
    }

    /**
     * Record a failed request
     *
     * @param string $serviceName
     * @param \Exception|null $exception
     * @param Response|null $response
     * @return void
     */
    protected function recordFailure(string $serviceName, ?\Exception $exception = null, ?Response $response = null): void
    {
        $stats = $this->getCircuitStats($serviceName);
        
        $stats['failed_requests']++;
        $stats['consecutive_failures']++;
        $stats['last_failure'] = now();
        
        // Record failure details
        $failureDetails = [
            'timestamp' => now(),
            'type' => $exception ? 'exception' : 'response_error',
            'message' => $exception ? $exception->getMessage() : 'HTTP error',
            'status_code' => $response ? $response->getStatusCode() : null,
        ];
        
        $stats['recent_failures'][] = $failureDetails;
        
        // Keep only recent failures (last 100)
        if (count($stats['recent_failures']) > 100) {
            $stats['recent_failures'] = array_slice($stats['recent_failures'], -100);
        }
        
        $this->updateCircuitStats($serviceName, $stats);
    }

    /**
     * Evaluate if the circuit state should change based on current statistics
     *
     * @param string $serviceName
     * @return void
     */
    protected function evaluateCircuitState(string $serviceName): void
    {
        $currentState = $this->getCircuitState($serviceName);
        $stats = $this->getCircuitStats($serviceName);
        
        // Configuration thresholds
        $failureThreshold = config('circuit_breaker.failure_threshold', 5);
        $failureRate = config('circuit_breaker.failure_rate', 0.5); // 50%
        $minimumRequests = config('circuit_breaker.minimum_requests', 10);
        
        // Don't evaluate if we don't have enough requests
        if ($stats['total_requests'] < $minimumRequests) {
            return;
        }
        
        $currentFailureRate = $stats['total_requests'] > 0 
            ? $stats['failed_requests'] / $stats['total_requests'] 
            : 0;
        
        // Determine if we should open the circuit
        $shouldOpen = ($stats['consecutive_failures'] >= $failureThreshold) || 
                     ($currentFailureRate >= $failureRate);
        
        if ($currentState === self::STATE_CLOSED && $shouldOpen) {
            $this->setCircuitState($serviceName, self::STATE_OPEN);
            
            Log::warning("Circuit breaker opened due to failures", [
                'service' => $serviceName,
                'consecutive_failures' => $stats['consecutive_failures'],
                'failure_rate' => $currentFailureRate,
                'total_requests' => $stats['total_requests'],
                'failed_requests' => $stats['failed_requests'],
            ]);
        }
        
        // If in half-open and we get a failure, go back to open
        if ($currentState === self::STATE_HALF_OPEN && $stats['consecutive_failures'] > 0) {
            $this->setCircuitState($serviceName, self::STATE_OPEN);
            
            Log::warning("Circuit breaker reopened after failed recovery test", [
                'service' => $serviceName,
            ]);
        }
    }

    /**
     * Get circuit breaker statistics for a service
     *
     * @param string $serviceName
     * @return array
     */
    protected function getCircuitStats(string $serviceName): array
    {
        $statsKey = "circuit_breaker:{$serviceName}:stats";
        
        return Cache::get($statsKey, [
            'total_requests' => 0,
            'successful_requests' => 0,
            'failed_requests' => 0,
            'consecutive_failures' => 0,
            'total_response_time' => 0,
            'last_request' => null,
            'last_success' => null,
            'last_failure' => null,
            'recent_failures' => [],
        ]);
    }

    /**
     * Update circuit breaker statistics
     *
     * @param string $serviceName
     * @param array $stats
     * @return void
     */
    protected function updateCircuitStats(string $serviceName, array $stats): void
    {
        $statsKey = "circuit_breaker:{$serviceName}:stats";
        Cache::put($statsKey, $stats, now()->addHours(24));
    }

    /**
     * Get fallback response when circuit is open
     *
     * @param string $serviceName
     * @param Request $request
     * @param \Exception|null $exception
     * @return Response
     */
    protected function getFallbackResponse(string $serviceName, Request $request, ?\Exception $exception = null): Response
    {
        $stats = $this->getCircuitStats($serviceName);
        
        // Check if there's a custom fallback configured
        $fallbackConfig = config("services.{$serviceName}.circuit_breaker.fallback");
        
        if ($fallbackConfig && isset($fallbackConfig['response'])) {
            return response()->json($fallbackConfig['response'], $fallbackConfig['status_code'] ?? 503);
        }
        
        // Default fallback response
        $responseData = [
            'error' => 'Service Temporarily Unavailable',
            'message' => "The {$serviceName} service is currently experiencing issues. Please try again later.",
            'service' => $serviceName,
            'circuit_state' => $this->getCircuitState($serviceName),
            'retry_after' => config('circuit_breaker.retry_after', 300), // 5 minutes
            'timestamp' => now()->toISOString(),
        ];
        
        // Add debug information in non-production environments
        if (!app()->environment('production')) {
            $responseData['debug'] = [
                'consecutive_failures' => $stats['consecutive_failures'],
                'total_requests' => $stats['total_requests'],
                'failed_requests' => $stats['failed_requests'],
                'last_failure' => $stats['last_failure'],
                'exception' => $exception ? $exception->getMessage() : null,
            ];
        }
        
        return response()->json($responseData, 503)
            ->header('Retry-After', config('circuit_breaker.retry_after', 300));
    }

    /**
     * Reset circuit breaker for a service (admin function)
     *
     * @param string $serviceName
     * @return void
     */
    public function resetCircuitBreaker(string $serviceName): void
    {
        $this->setCircuitState($serviceName, self::STATE_CLOSED);
        
        // Reset statistics
        $statsKey = "circuit_breaker:{$serviceName}:stats";
        Cache::forget($statsKey);
        
        Log::info("Circuit breaker manually reset", [
            'service' => $serviceName,
        ]);
    }

    /**
     * Get circuit breaker status for monitoring
     *
     * @param string $serviceName
     * @return array
     */
    public function getCircuitStatus(string $serviceName): array
    {
        $stats = $this->getCircuitStats($serviceName);
        $state = $this->getCircuitState($serviceName);
        
        return [
            'service' => $serviceName,
            'state' => $state,
            'statistics' => $stats,
            'health_score' => $this->calculateHealthScore($stats),
            'average_response_time' => $stats['successful_requests'] > 0 
                ? $stats['total_response_time'] / $stats['successful_requests'] 
                : 0,
        ];
    }

    /**
     * Calculate health score based on statistics
     *
     * @param array $stats
     * @return float
     */
    protected function calculateHealthScore(array $stats): float
    {
        if ($stats['total_requests'] === 0) {
            return 1.0; // Perfect score if no requests
        }
        
        $successRate = $stats['successful_requests'] / $stats['total_requests'];
        $consecutiveFailurePenalty = min($stats['consecutive_failures'] * 0.1, 0.5);
        
        return max(0.0, $successRate - $consecutiveFailurePenalty);
    }
}
