<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Users table migration
 * 
 * Creates the core users table with all necessary fields for
 * authentication, authorization, and user management in the
 * e-commerce platform.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            
            // Basic user information
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // User status and preferences
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending'])
                  ->default('active')
                  ->index();
            $table->json('preferences')->nullable();
            
            // Login tracking
            $table->timestamp('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();
            
            // Standard Laravel fields
            $table->rememberToken();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['email', 'status']);
            $table->index('created_at');
            $table->index('last_login_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
