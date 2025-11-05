<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Batch;

class ProductService
{
    public function getAllProducts($filters = [])
    {
        $query = Product::with('brand', 'batches');

        if (isset($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('sku', 'like', '%' . $filters['search'] . '%');
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function createProduct($data)
    {
        return Product::create($data);
    }

    public function updateProduct($productId, $data)
    {
        $product = Product::findOrFail($productId);
        $product->update($data);
        return $product;
    }

    public function deleteProduct($productId)
    {
        return Product::findOrFail($productId)->delete();
    }

    public function getProductStock($productId)
    {
        $batches = Batch::where('product_id', $productId)
            ->where('quantity_in_stock', '>', 0)
            ->where('expiry_date', '>', now())
            ->get();

        return [
            'total_stock' => $batches->sum('quantity_in_stock'),
            'batches' => $batches,
        ];
    }
}
