<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name' => 'Arnica Montana',
                'sku' => 'ARN-001',
                'brand_id' => 1,
                'category' => 'Homeopathic Remedies',
                'potency' => '30CH',
                'therapeutic_use' => 'Injuries and trauma',
                'cost_price' => 50.00,
                'margin_percent' => 40,
                'hsn_code' => '3004',
                'tax_rate' => 18,
                'reorder_level' => 10,
            ],
            [
                'name' => 'Belladonna',
                'sku' => 'BEL-001',
                'brand_id' => 2,
                'category' => 'Homeopathic Remedies',
                'potency' => '30CH',
                'therapeutic_use' => 'Fever and inflammation',
                'cost_price' => 45.00,
                'margin_percent' => 35,
                'hsn_code' => '3004',
                'tax_rate' => 18,
                'reorder_level' => 15,
            ],
            [
                'name' => 'Nux Vomica',
                'sku' => 'NUX-001',
                'brand_id' => 3,
                'category' => 'Homeopathic Remedies',
                'potency' => '30CH',
                'therapeutic_use' => 'Digestive issues',
                'cost_price' => 55.00,
                'margin_percent' => 38,
                'hsn_code' => '3004',
                'tax_rate' => 18,
                'reorder_level' => 12,
            ],
            [
                'name' => 'Bryonia Alba',
                'sku' => 'BRY-001',
                'brand_id' => 4,
                'category' => 'Homeopathic Remedies',
                'potency' => '30CH',
                'therapeutic_use' => 'Dry cough and respiratory',
                'cost_price' => 48.00,
                'margin_percent' => 36,
                'hsn_code' => '3004',
                'tax_rate' => 18,
                'reorder_level' => 20,
            ],
            [
                'name' => 'Pulsatilla',
                'sku' => 'PUL-001',
                'brand_id' => 5,
                'category' => 'Homeopathic Remedies',
                'potency' => '30CH',
                'therapeutic_use' => 'Emotional balance',
                'cost_price' => 52.00,
                'margin_percent' => 40,
                'hsn_code' => '3004',
                'tax_rate' => 18,
                'reorder_level' => 8,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
