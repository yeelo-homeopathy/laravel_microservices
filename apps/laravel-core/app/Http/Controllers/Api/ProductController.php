<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Services\ProductService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private ProductService $productService)
    {
    }

    public function index(Request $request)
    {
        $filters = $request->only(['brand_id', 'category', 'search', 'is_active', 'per_page']);
        return response()->json($this->productService->getAllProducts($filters));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_id' => 'required|exists:brands,id',
            'name' => 'required|string',
            'sku' => 'required|unique:products',
            'cost_price' => 'required|numeric',
            'markup_percentage' => 'required|numeric',
            'category' => 'required|string',
        ]);

        $product = $this->productService->createProduct($validated);
        return response()->json($product, 201);
    }

    public function show($id)
    {
        $product = Product::with('brand', 'batches')->findOrFail($id);
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'string',
            'cost_price' => 'numeric',
            'markup_percentage' => 'numeric',
        ]);

        $product = $this->productService->updateProduct($id, $validated);
        return response()->json($product);
    }

    public function destroy($id)
    {
        $this->productService->deleteProduct($id);
        return response()->json(['message' => 'Product deleted']);
    }

    public function getStock($id)
    {
        return response()->json($this->productService->getProductStock($id));
    }
}
