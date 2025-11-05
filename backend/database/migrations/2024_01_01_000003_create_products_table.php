<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('potency')->nullable();
            $table->string('therapeutic_use')->nullable();
            $table->text('description')->nullable();
            $table->decimal('cost_price', 10, 2);
            $table->decimal('markup_percentage', 5, 2);
            $table->string('category');
            $table->string('hsn_code')->nullable();
            $table->decimal('gst_rate', 5, 2)->default(5.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
