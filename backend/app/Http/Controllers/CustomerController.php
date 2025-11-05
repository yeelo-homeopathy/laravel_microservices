<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->customer_type) {
            $query->where('customer_type', $request->customer_type);
        }

        if ($request->is_active !== null) {
            $query->where('is_active', $request->is_active);
        }

        $customers = $query->latest()->paginate(15);

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:customers',
            'phone' => 'required|string',
            'customer_type' => 'required|in:retail,wholesale,doctor,pharmacy,clinic,distributor',
            'address' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'gstin' => 'nullable|string|unique:customers',
            'credit_limit' => 'nullable|numeric|min:0',
            'credit_days' => 'nullable|integer|min:0',
        ]);

        $customer = Customer::create($request->validated());

        return response()->json($customer, 201);
    }

    public function show(Customer $customer)
    {
        return response()->json($customer->load(['salesOrders', 'payments']));
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:customers,email,' . $customer->id,
            'phone' => 'string',
            'address' => 'string',
            'city' => 'string',
            'state' => 'string',
            'credit_limit' => 'nullable|numeric|min:0',
            'credit_days' => 'nullable|integer|min:0',
        ]);

        $customer->update($request->validated());

        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json(['message' => 'Customer deleted']);
    }

    public function getOutstanding(Customer $customer)
    {
        $outstanding = $customer->salesOrders()
            ->where('payment_status', '!=', 'paid')
            ->with('payments')
            ->get();

        return response()->json($outstanding);
    }
}
