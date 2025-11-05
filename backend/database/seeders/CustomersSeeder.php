<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomersSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name' => 'Dr. Rajesh Kumar',
                'email' => 'dr.rajesh@example.com',
                'phone' => '9876543210',
                'customer_type' => 'doctor',
                'address' => '123 Medical Lane',
                'city' => 'Delhi',
                'state' => 'Delhi',
                'gstin' => '07AABFD5055K1ZA',
                'credit_limit' => 100000,
                'credit_days' => 30,
            ],
            [
                'name' => 'Health Pharmacy',
                'email' => 'info@healthpharmacy.com',
                'phone' => '9876543211',
                'customer_type' => 'pharmacy',
                'address' => '456 Pharmacy Lane',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'gstin' => '27AABFD5055K1ZA',
                'credit_limit' => 250000,
                'credit_days' => 45,
            ],
            [
                'name' => 'Wellness Clinic',
                'email' => 'wellness@clinic.com',
                'phone' => '9876543212',
                'customer_type' => 'clinic',
                'address' => '789 Clinic Avenue',
                'city' => 'Bangalore',
                'state' => 'Karnataka',
                'gstin' => '29AABFD5055K1ZA',
                'credit_limit' => 150000,
                'credit_days' => 30,
            ],
            [
                'name' => 'Retail Store Owner',
                'email' => 'retail@store.com',
                'phone' => '9876543213',
                'customer_type' => 'retail',
                'address' => '321 Market Street',
                'city' => 'Hyderabad',
                'state' => 'Telangana',
                'gstin' => null,
                'credit_limit' => 50000,
                'credit_days' => 15,
            ],
            [
                'name' => 'Wholesale Distributor',
                'email' => 'wholesale@dist.com',
                'phone' => '9876543214',
                'customer_type' => 'distributor',
                'address' => '654 Distribution Hub',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'gstin' => '33AABFD5055K1ZA',
                'credit_limit' => 500000,
                'credit_days' => 60,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}
