<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->string('phone');
            $table->enum('customer_type', ['retail', 'wholesale', 'doctor', 'pharmacy', 'clinic', 'distributor']);
            $table->string('company_name')->nullable();
            $table->string('gstin')->nullable()->unique();
            $table->text('address');
            $table->string('city');
            $table->string('state');
            $table->string('pincode');
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->integer('payment_terms')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
