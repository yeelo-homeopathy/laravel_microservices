<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandsSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'SBL Homeopathy', 'description' => 'Premium homeopathic remedies'],
            ['name' => 'Boiron', 'description' => 'International homeopathy brand'],
            ['name' => 'Heel', 'description' => 'German homeopathic medicines'],
            ['name' => 'Schwabe', 'description' => 'Natural homeopathy products'],
            ['name' => 'Willmar Schwabe', 'description' => 'Liquid homeopathic remedies'],
        ];

        foreach ($brands as $brand) {
            Brand::create($brand);
        }
    }
}
