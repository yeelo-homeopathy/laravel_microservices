<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Batch;
use App\Models\InventoryMovement;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function createSalesOrder(array $data): SalesOrder
    {
        $customer = Customer::findOrFail($data['customer_id']);
        
        // Validate credit limit
        $outstandingAmount = $customer->salesOrders()
            ->where('payment_status', '!=', 'paid')
            ->sum('grand_total');

        $orderTotal = 0;
        foreach ($data['items'] as $item) {
            $orderTotal += $item['quantity'] * $item['unit_price'];
        }

        if ($outstandingAmount + $orderTotal > $customer->credit_limit) {
            throw new \Exception('Customer credit limit exceeded');
        }

        $order = new SalesOrder();
        $order->order_number = 'SO-' . now()->format('YmdHis');
        $order->customer_id = $data['customer_id'];
        $order->order_date = $data['order_date'];
        $order->delivery_date = $data['delivery_date'] ?? null;

        $subtotal = 0;
        $totalTax = 0;
        $items = [];

        foreach ($data['items'] as $item) {
            $batch = Batch::findOrFail($item['batch_id'] ?? Batch::where('product_id', $item['product_id'])->first()->id);
            
            // Apply customer-type specific discount
            $discountPercent = $this->getCustomerTypeDiscount($customer->customer_type);
            $unitPrice = $item['unit_price'];
            $discount = ($unitPrice * $item['quantity'] * $discountPercent) / 100;
            $discountedPrice = ($unitPrice * $item['quantity']) - $discount;
            
            // Apply GST (18% for homeopathy)
            $tax = $discountedPrice * 0.18;
            $itemTotal = $discountedPrice + $tax;
            
            $subtotal += $itemTotal;
            $totalTax += $tax;

            $items[] = [
                'product_id' => $item['product_id'],
                'batch_id' => $batch->id,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'discount_percent' => $discountPercent,
                'tax_amount' => $tax,
                'total_price' => $itemTotal,
            ];

            // Check batch availability
            if ($batch->available_quantity < $item['quantity']) {
                throw new \Exception("Insufficient stock for batch: {$batch->batch_number}");
            }
        }

        $order->subtotal = $subtotal;
        $order->tax_amount = $totalTax;
        $order->grand_total = $subtotal + $totalTax;
        $order->notes = $data['notes'] ?? null;
        $order->save();

        // Attach items and update inventory
        foreach ($items as $item) {
            $order->items()->create($item);

            // Deduct from batch inventory
            $batch = Batch::find($item['batch_id']);
            $batch->available_quantity -= $item['quantity'];
            $batch->save();

            InventoryMovement::create([
                'batch_id' => $batch->id,
                'product_id' => $item['product_id'],
                'movement_type' => 'out',
                'quantity' => $item['quantity'],
                'reference_id' => $order->id,
                'reference_type' => 'sales_order',
            ]);
        }

        return $order;
    }

    public function updateSalesOrder(SalesOrder $order, array $data): SalesOrder
    {
        $order->update($data);
        return $order->refresh();
    }

    public function updateOrderStatus(SalesOrder $order, string $status): void
    {
        $order->update(['status' => $status]);
    }

    private function getCustomerTypeDiscount(string $customerType): float
    {
        $discounts = [
            'retail' => 5,
            'wholesale' => 15,
            'doctor' => 20,
            'pharmacy' => 18,
            'clinic' => 15,
            'distributor' => 25,
        ];

        return $discounts[$customerType] ?? 0;
    }

    public function getSalesOrdersByCustomer($customerId)
    {
        return SalesOrder::where('customer_id', $customerId)
            ->with('items.batch.product')
            ->paginate();
    }
}
