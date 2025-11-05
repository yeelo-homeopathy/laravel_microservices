<?php

namespace Database\Seeders;

use App\Models\PurchaseOrder;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PurchaseOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $orders = [
            [
                'po_number' => 'PO-2024-001',
                'supplier_id' => 1,
                'order_date' => Carbon::now()->subDays(20),
                'delivery_date' => Carbon::now()->subDays(10),
                'total_amount' => 10000,
                'tax_amount' => 1800,
                'grand_total' => 11800,
                'status' => 'received',
            ],
            [
                'po_number' => 'PO-2024-002',
                'supplier_id' => 2,
                'order_date' => Carbon::now()->subDays(15),
                'delivery_date' => Carbon::now()->addDays(5),
                'total_amount' => 25000,
                'tax_amount' => 4500,
                'grand_total' => 29500,
                'status' => 'confirmed',
            ],
        ];

        foreach ($orders as $order) {
            PurchaseOrder::create($order);
        }
    }
}
