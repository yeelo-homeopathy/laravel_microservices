<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Http\Requests\PurchaseOrderRequest;
use App\Services\PurchaseOrderService;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    public function __construct(private PurchaseOrderService $purchaseService)
    {
    }

    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'items.product']);

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(15);

        return response()->json($orders);
    }

    public function store(PurchaseOrderRequest $request)
    {
        $order = $this->purchaseService->createPurchaseOrder($request->validated());

        return response()->json($order, 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder->load(['supplier', 'items.product']));
    }

    public function update(PurchaseOrderRequest $request, PurchaseOrder $purchaseOrder)
    {
        $order = $this->purchaseService->updatePurchaseOrder($purchaseOrder, $request->validated());

        return response()->json($order);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->delete();

        return response()->json(['message' => 'Purchase order deleted']);
    }

    public function receiveGoods(Request $request, PurchaseOrder $purchaseOrder)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.item_id' => 'required|exists:purchase_order_items,id',
            'items.*.received_quantity' => 'required|integer|min:1',
            'items.*.batch_number' => 'required|string',
            'items.*.expiry_date' => 'required|date',
        ]);

        $this->purchaseService->receivePurchaseGoods($purchaseOrder, $request->items);

        return response()->json(['message' => 'Goods received successfully']);
    }
}
