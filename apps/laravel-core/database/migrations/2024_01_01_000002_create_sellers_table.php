<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sellers table migration
 * 
 * Creates the sellers table for managing seller accounts,
 * KYC information, and business details in the e-commerce platform.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            
            // User relationship
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Business information
            $table->string('business_name');
            $table->string('business_type')->nullable(); // individual, company, partnership
            $table->string('business_registration_number')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('vat_number')->nullable();
            
            // Contact information
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            
            // Address information
            $table->text('business_address');
            $table->string('city');
            $table->string('state');
            $table->string('country');
            $table->string('postal_code');
            
            // Bank details for payouts
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_routing_number')->nullable();
            $table->string('bank_account_holder_name')->nullable();
            
            // KYC and verification
            $table->enum('kyc_status', ['pending', 'in_review', 'approved', 'rejected'])
                  ->default('pending')
                  ->index();
            $table->json('kyc_documents')->nullable(); // Store document URLs and metadata
            $table->timestamp('kyc_submitted_at')->nullable();
            $table->timestamp('kyc_approved_at')->nullable();
            $table->text('kyc_rejection_reason')->nullable();
            
            // Seller status and settings
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending_approval'])
                  ->default('pending_approval')
                  ->index();
            $table->boolean('is_verified')->default(false);
            $table->decimal('commission_rate', 5, 2)->default(10.00); // Platform commission percentage
            
            // Business metrics
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            
            // Settings and preferences
            $table->json('settings')->nullable();
            $table->json('shipping_methods')->nullable();
            $table->json('return_policy')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['status', 'is_verified']);
            $table->index('kyc_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sellers');
    }
};
