<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

/**
 * Authentication Service
 * 
 * Handles complex authentication logic, token management,
 * and user registration for the e-commerce platform.
 * 
 * This service encapsulates business logic for authentication
 * operations, making controllers thin and testable.
 */
class AuthService
{
    /**
     * Register a new user
     * 
     * @param array $data User registration data
     * @return array Contains user and token
     * @throws \Exception
     */
    public function register(array $data): array
    {
        // Create user with validated data
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'status' => User::STATUS_ACTIVE,
        ]);

        // Assign default customer role
        $user->assignRole('customer');

        // Fire registered event for email verification
        event(new Registered($user));

        // Generate API token
        $token = $user->generateApiToken('registration-token');

        // Log activity
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->log('User registered');

        return [
            'user' => $user->fresh(['roles', 'permissions']),
            'token' => $token,
        ];
    }

    /**
     * Authenticate user and generate token
     * 
     * @param array $credentials Login credentials
     * @param string|null $ip User's IP address
     * @return array Contains user, token, and expiration
     * @throws ValidationException
     */
    public function login(array $credentials, string $ip = null): array
    {
        // Find user by email
        $user = User::where('email', $credentials['email'])->first();

        // Validate user exists and password is correct
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is active
        if (!$user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact support.'],
            ]);
        }

        // Update last login information
        $user->updateLastLogin($ip);

        // Generate token with appropriate abilities based on user role
        $abilities = $this->getTokenAbilities($user);
        $tokenName = $credentials['remember'] ?? false ? 'remember-token' : 'session-token';
        
        $token = $user->generateApiToken($tokenName, $abilities);

        // Calculate token expiration
        $expiresAt = $credentials['remember'] ?? false 
            ? Carbon::now()->addDays(30)
            : Carbon::now()->addHours(24);

        // Log activity
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties(['ip' => $ip])
            ->log('User logged in');

        return [
            'user' => $user->fresh(['roles', 'permissions']),
            'token' => $token,
            'expires_at' => $expiresAt,
        ];
    }

    /**
     * Logout user by revoking current token
     * 
     * @param User $user
     * @return void
     */
    public function logout(User $user): void
    {
        // Revoke current token
        $user->currentAccessToken()?->delete();

        // Log activity
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->log('User logged out');
    }

    /**
     * Logout user from all devices
     * 
     * @param User $user
     * @return void
     */
    public function logoutAll(User $user): void
    {
        // Revoke all tokens
        $user->tokens()->delete();

        // Log activity
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->log('User logged out from all devices');
    }

    /**
     * Refresh user token
     * 
     * @param User $user
     * @return array Contains new token and expiration
     */
    public function refreshToken(User $user): array
    {
        // Get current token name and abilities
        $currentToken = $user->currentAccessToken();
        $tokenName = $currentToken->name ?? 'refreshed-token';
        $abilities = $currentToken->abilities ?? ['*'];

        // Generate new token
        $token = $user->generateApiToken($tokenName, $abilities);
        
        // Calculate expiration
        $expiresAt = str_contains($tokenName, 'remember') 
            ? Carbon::now()->addDays(30)
            : Carbon::now()->addHours(24);

        // Log activity
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->log('Token refreshed');

        return [
            'token' => $token,
            'expires_at' => $expiresAt,
        ];
    }

    /**
     * Get token abilities based on user roles
     * 
     * @param User $user
     * @return array
     */
    private function getTokenAbilities(User $user): array
    {
        $abilities = ['*']; // Default abilities

        // Admin users get full access
        if ($user->hasRole('super-admin')) {
            return ['*'];
        }

        // Admin users get admin abilities
        if ($user->hasRole('admin')) {
            return [
                'admin:read',
                'admin:write',
                'users:read',
                'users:write',
                'orders:read',
                'orders:write',
                'products:read',
                'products:write',
            ];
        }

        // Seller users get seller abilities
        if ($user->hasRole('seller')) {
            return [
                'seller:read',
                'seller:write',
                'products:read',
                'products:write',
                'orders:read',
                'inventory:read',
                'inventory:write',
            ];
        }

        // Customer users get basic abilities
        if ($user->hasRole('customer')) {
            return [
                'customer:read',
                'customer:write',
                'orders:read',
                'cart:read',
                'cart:write',
            ];
        }

        return $abilities;
    }

    /**
     * Verify user email
     * 
     * @param User $user
     * @return void
     */
    public function verifyEmail(User $user): void
    {
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();

            // Log activity
            activity()
                ->performedOn($user)
                ->causedBy($user)
                ->log('Email verified');
        }
    }

    /**
     * Send password reset link
     * 
     * @param string $email
     * @return bool
     */
    public function sendPasswordResetLink(string $email): bool
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return false;
        }

        // Send password reset notification
        $user->sendPasswordResetNotification(
            app('auth.password.broker')->createToken($user)
        );

        // Log activity
        activity()
            ->performedOn($user)
            ->log('Password reset requested');

        return true;
    }
}
