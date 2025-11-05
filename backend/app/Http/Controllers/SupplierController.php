<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->is_active !== null) {
            $query->where('is_active', $request->is_active);
        }

        $suppliers = $query->latest()->paginate(15);

        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:suppliers',
            'phone' => 'required|string',
            'address' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'gstin' => 'required|string|unique:suppliers',
            'payment_terms' => 'required|string',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $supplier = Supplier::create($request->validated());

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier)
    {
        return response()->json($supplier->load('purchaseOrders'));
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:suppliers,email,' . $supplier->id,
            'phone' => 'string',
            'address' => 'string',
            'city' => 'string',
            'state' => 'string',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms' => 'string',
        ]);

        $supplier->update($validated);

        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return response()->json(['message' => 'Supplier deleted']);
    }
}
