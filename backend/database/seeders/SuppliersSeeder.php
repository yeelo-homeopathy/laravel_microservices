<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SuppliersSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'SBL Supplier',
                'email' => 'supplier@sbl.com',
                'phone' => '9876543220',
                'address' => '123 Supplier Lane',
                'city' => 'Delhi',
                'state' => 'Delhi',
                'gstin' => '07AABFD5055K1ZA',
                'payment_terms' => '30',
                'credit_limit' => 1000000,
            ],
            [
                'name' => 'Boiron Distribution',
                'email' => 'dist@boiron.com',
                'phone' => '9876543221',
                'address' => '456 Distribution Road',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'gstin' => '27AABFD5055K1ZA',
                'payment_terms' => '45',
                'credit_limit' => 1500000,
            ],
            [
                'name' => 'Heel Products',
                'email' => 'sales@heel.com',
                'phone' => '9876543222',
                'address' => '789 Product Avenue',
                'city' => 'Bangalore',
                'state' => 'Karnataka',
                'gstin' => '29AABFD5055K1ZA',
                'payment_terms' => '30',
                'credit_limit' => 800000,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}
