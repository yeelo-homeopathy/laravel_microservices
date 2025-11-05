<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Batch;
use App\Models\InventoryMovement;

class PurchaseOrderService
{
    public function createPurchaseOrder(array $data): PurchaseOrder
    {
        $order = new PurchaseOrder();
        $order->po_number = 'PO-' . now()->format('YmdHis');
        $order->supplier_id = $data['supplier_id'];
        $order->order_date = $data['order_date'];
        $order->delivery_date = $data['delivery_date'] ?? null;

        $totalAmount = 0;
        $items = [];

        foreach ($data['items'] as $item) {
            $itemTotal = $item['quantity'] * $item['unit_price'];
            $totalAmount += $itemTotal;

            $items[] = [
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $itemTotal,
            ];
        }

        $taxAmount = $totalAmount * 0.18; // 18% GST
        $order->total_amount = $totalAmount;
        $order->tax_amount = $taxAmount;
        $order->grand_total = $totalAmount + $taxAmount;
        $order->notes = $data['notes'] ?? null;
        $order->save();

        foreach ($items as $item) {
            $order->items()->create($item);
        }

        return $order;
    }

    public function updatePurchaseOrder(PurchaseOrder $order, array $data): PurchaseOrder
    {
        $order->update($data);
        return $order->refresh();
    }

    public function receivePurchaseGoods(PurchaseOrder $purchaseOrder, array $items): void
    {
        foreach ($items as $item) {
            $poItem = $purchaseOrder->items()->find($item['item_id']);

            if ($poItem) {
                $poItem->received_quantity = $item['received_quantity'];
                $poItem->batch_number = $item['batch_number'];
                $poItem->expiry_date = $item['expiry_date'];
                $poItem->save();

                // Create batch record
                $batch = Batch::create([
                    'product_id' => $poItem->product_id,
                    'batch_number' => $item['batch_number'],
                    'quantity' => $item['received_quantity'],
                    'available_quantity' => $item['received_quantity'],
                    'purchase_date' => now(),
                    'expiry_date' => $item['expiry_date'],
                    'cost_price' => $poItem->unit_price,
                ]);

                InventoryMovement::create([
                    'batch_id' => $batch->id,
                    'product_id' => $poItem->product_id,
                    'movement_type' => 'in',
                    'quantity' => $item['received_quantity'],
                    'reference_id' => $purchaseOrder->id,
                    'reference_type' => 'purchase_order',
                ]);
            }
        }

        $purchaseOrder->update(['status' => 'received']);
    }
}
