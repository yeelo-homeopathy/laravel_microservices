<?php

namespace Database\Seeders;

use App\Models\Batch;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class BatchesSeeder extends Seeder
{
    public function run(): void
    {
        $batches = [
            [
                'product_id' => 1,
                'batch_number' => 'ARN-2024-001',
                'quantity' => 100,
                'available_quantity' => 85,
                'purchase_date' => Carbon::now()->subDays(45),
                'expiry_date' => Carbon::now()->addMonths(12),
                'cost_price' => 50.00,
            ],
            [
                'product_id' => 1,
                'batch_number' => 'ARN-2024-002',
                'quantity' => 150,
                'available_quantity' => 150,
                'purchase_date' => Carbon::now()->subDays(15),
                'expiry_date' => Carbon::now()->addMonths(14),
                'cost_price' => 50.00,
            ],
            [
                'product_id' => 2,
                'batch_number' => 'BEL-2024-001',
                'quantity' => 200,
                'available_quantity' => 120,
                'purchase_date' => Carbon::now()->subDays(90),
                'expiry_date' => Carbon::now()->addMonths(6),
                'cost_price' => 45.00,
            ],
            [
                'product_id' => 3,
                'batch_number' => 'NUX-2024-001',
                'quantity' => 120,
                'available_quantity' => 45,
                'purchase_date' => Carbon::now()->subDays(120),
                'expiry_date' => Carbon::now()->addMonths(3),
                'cost_price' => 55.00,
            ],
            [
                'product_id' => 4,
                'batch_number' => 'BRY-2024-001',
                'quantity' => 250,
                'available_quantity' => 250,
                'purchase_date' => Carbon::now()->subDays(5),
                'expiry_date' => Carbon::now()->addMonths(18),
                'cost_price' => 48.00,
            ],
            [
                'product_id' => 5,
                'batch_number' => 'PUL-2024-001',
                'quantity' => 80,
                'available_quantity' => 30,
                'purchase_date' => Carbon::now()->subDays(180),
                'expiry_date' => Carbon::now()->subDays(10),
                'cost_price' => 52.00,
            ],
        ];

        foreach ($batches as $batch) {
            Batch::create($batch);
        }
    }
}
