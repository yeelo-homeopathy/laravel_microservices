<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Event Store Migration
 * 
 * Creates the event store table for event sourcing capabilities.
 * This table stores all domain events for audit trails, event replay,
 * and building read models from event streams.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_store', function (Blueprint $table) {
            $table->id();
            
            // Stream identification
            $table->string('stream_id')->index();
            $table->unsignedBigInteger('version');
            
            // Event identification
            $table->uuid('event_id')->unique();
            $table->string('event_type');
            $table->string('event_name');
            $table->unsignedTinyInteger('event_version')->default(1);
            
            // Aggregate information
            $table->string('aggregate_id')->nullable()->index();
            $table->string('aggregate_type')->nullable();
            
            // Distributed tracing
            $table->uuid('correlation_id')->index();
            $table->uuid('causation_id')->nullable();
            
            // Event data
            $table->json('payload');
            $table->json('metadata')->nullable();
            
            // Timestamps
            $table->timestamp('occurred_at');
            $table->timestamps();
            
            // Indexes for performance
            $table->unique(['stream_id', 'version']);
            $table->index(['event_type', 'occurred_at']);
            $table->index(['aggregate_id', 'aggregate_type']);
            $table->index('occurred_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_store');
    }
};
