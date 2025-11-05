<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UsersSeeder::class,
            BrandsSeeder::class,
            ProductsSeeder::class,
            CustomersSeeder::class,
            SuppliersSeeder::class,
            BatchesSeeder::class,
            SalesOrdersSeeder::class,
            PurchaseOrdersSeeder::class,
        ]);
    }
}
