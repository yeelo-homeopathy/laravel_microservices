<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');
            $table->string('batch_number')->unique();
            $table->date('manufacturing_date');
            $table->date('expiry_date');
            $table->integer('quantity_in_stock')->default(0);
            $table->decimal('cost_price', 10, 2);
            $table->decimal('purchase_price', 10, 2);
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('purchase_order_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index('expiry_date');
            $table->index('batch_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
