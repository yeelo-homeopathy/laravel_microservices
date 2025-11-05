<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index()
    {
        return response()->json(Brand::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:brands',
            'description' => 'nullable|string',
        ]);

        $brand = Brand::create($request->validated());

        return response()->json($brand, 201);
    }

    public function show(Brand $brand)
    {
        return response()->json($brand->load('products'));
    }

    public function update(Request $request, Brand $brand)
    {
        $request->validate([
            'name' => 'string|unique:brands,name,' . $brand->id,
            'description' => 'nullable|string',
        ]);

        $brand->update($request->validated());

        return response()->json($brand);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();

        return response()->json(['message' => 'Brand deleted']);
    }
}
