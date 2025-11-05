<?php

namespace Database\Seeders;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class SalesOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $orders = [
            [
                'order_number' => 'SO-2024-001',
                'customer_id' => 1,
                'order_date' => Carbon::now()->subDays(10),
                'delivery_date' => Carbon::now()->subDays(5),
                'subtotal' => 5900,
                'discount_amount' => 0,
                'tax_amount' => 1062,
                'grand_total' => 6962,
                'status' => 'delivered',
                'payment_status' => 'paid',
            ],
            [
                'order_number' => 'SO-2024-002',
                'customer_id' => 2,
                'order_date' => Carbon::now()->subDays(5),
                'delivery_date' => Carbon::now()->addDays(2),
                'subtotal' => 12500,
                'discount_amount' => 625,
                'tax_amount' => 2137.5,
                'grand_total' => 14012.5,
                'status' => 'confirmed',
                'payment_status' => 'partial',
            ],
            [
                'order_number' => 'SO-2024-003',
                'customer_id' => 3,
                'order_date' => Carbon::now()->subDays(2),
                'delivery_date' => Carbon::now()->addDays(5),
                'subtotal' => 8750,
                'discount_amount' => 0,
                'tax_amount' => 1575,
                'grand_total' => 10325,
                'status' => 'confirmed',
                'payment_status' => 'unpaid',
            ],
        ];

        foreach ($orders as $order) {
            SalesOrder::create($order);
        }
    }
}
