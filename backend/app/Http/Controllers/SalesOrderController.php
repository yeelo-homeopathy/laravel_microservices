<?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use App\Http\Requests\SalesOrderRequest;
use App\Services\OrderService;
use Illuminate\Http\Request;

class SalesOrderController extends Controller
{
    public function __construct(private OrderService $orderService)
    {
    }

    public function index(Request $request)
    {
        $query = SalesOrder::with(['customer', 'items.product', 'payments']);

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }

        $orders = $query->latest()->paginate(15);

        return response()->json($orders);
    }

    public function store(SalesOrderRequest $request)
    {
        $order = $this->orderService->createSalesOrder($request->validated());

        return response()->json($order, 201);
    }

    public function show(SalesOrder $salesOrder)
    {
        return response()->json($salesOrder->load(['customer', 'items.product', 'items.batch', 'payments']));
    }

    public function update(SalesOrderRequest $request, SalesOrder $salesOrder)
    {
        $order = $this->orderService->updateSalesOrder($salesOrder, $request->validated());

        return response()->json($order);
    }

    public function destroy(SalesOrder $salesOrder)
    {
        $salesOrder->delete();

        return response()->json(['message' => 'Order deleted']);
    }

    public function updateStatus(Request $request, SalesOrder $salesOrder)
    {
        $request->validate(['status' => 'required|in:draft,confirmed,shipped,delivered,cancelled']);

        $this->orderService->updateOrderStatus($salesOrder, $request->status);

        return response()->json(['message' => 'Status updated']);
    }
}
