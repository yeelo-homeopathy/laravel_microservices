<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Event Snapshots Migration
 * 
 * Creates the event snapshots table for performance optimization.
 * Snapshots store the current state of aggregates to avoid
 * replaying all events from the beginning.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_snapshots', function (Blueprint $table) {
            $table->id();
            
            // Stream and aggregate identification
            $table->string('stream_id')->unique();
            $table->string('aggregate_type');
            $table->string('aggregate_id');
            
            // Snapshot data
            $table->unsignedBigInteger('version');
            $table->json('data');
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index(['aggregate_type', 'aggregate_id']);
            $table->index('version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_snapshots');
    }
};
