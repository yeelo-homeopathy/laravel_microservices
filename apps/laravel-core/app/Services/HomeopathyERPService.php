<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\Inventory;
use App\Models\Batch;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HomeopathyERPService
{
    // Get products with batch and stock information
    public function getProductsWithBatches($brandId = null, $categoryId = null)
    {
        $query = Product::with(['brand', 'batches' => function($q) {
            $q->where('quantity_available', '>', 0)
              ->orderBy('expiry_date', 'asc');
        }]);

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return $query->get()->map(function($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'brand' => $product->brand->name,
                'potency' => $product->potency,
                'batches' => $product->batches->map(function($batch) {
                    $daysInStock = now()->diffInDays($batch->purchase_date);
                    $monthlyInterest = 8;
                    $interestValue = ($batch->purchase_cost * ($monthlyInterest / 100) * ($daysInStock / 30));

                    return [
                        'batch_id' => $batch->id,
                        'batch_number' => $batch->batch_number,
                        'sku' => $batch->sku,
                        'quantity' => $batch->quantity_available,
                        'purchase_price' => $batch->purchase_cost,
                        'manufacture_date' => $batch->manufacture_date,
                        'expiry_date' => $batch->expiry_date,
                        'purchase_date' => $batch->purchase_date,
                        'days_in_stock' => $daysInStock,
                        'interest_value' => round($interestValue, 2),
                        'status' => $this->getBatchStatus($batch->expiry_date, $daysInStock),
                    ];
                }),
            ];
        });
    }

    // Calculate dynamic pricing based on customer type
    public function calculatePrice($productId, $batchId, $quantity, $customerType, $customerTier = 'regular')
    {
        $batch = Batch::findOrFail($batchId);
        $product = Product::findOrFail($productId);

        $basePrice = $batch->selling_price;
        $discount = $this->getDiscountForCustomerType($customerType, $customerTier);
        $gstRate = config('erp.gst_rate', 0.18);

        $discountedPrice = $basePrice * (1 - ($discount / 100));
        $priceWithGST = $discountedPrice * (1 + $gstRate);
        $totalPrice = $priceWithGST * $quantity;

        return [
            'base_price' => $basePrice,
            'customer_type' => $customerType,
            'discount_percentage' => $discount,
            'discounted_price' => round($discountedPrice, 2),
            'gst_amount' => round($discountedPrice * $gstRate, 2),
            'final_price' => round($priceWithGST, 2),
            'quantity' => $quantity,
            'total_amount' => round($totalPrice, 2),
        ];
    }

    // Get discount for customer type
    private function getDiscountForCustomerType($customerType, $tier)
    {
        $discounts = [
            'retail' => ['regular' => 0, 'gold' => 5],
            'wholesale' => ['regular' => 10, 'gold' => 15],
            'doctor' => ['regular' => 15, 'gold' => 20],
            'pharmacy' => ['regular' => 12, 'gold' => 18],
            'distributor' => ['regular' => 20, 'gold' => 25],
        ];

        return $discounts[$customerType][$tier] ?? 0;
    }

    // Get batch status
    private function getBatchStatus($expiryDate, $daysInStock)
    {
        $daysUntilExpiry = now()->diffInDays($expiryDate);

        if ($daysUntilExpiry < 0) {
            return 'expired';
        } elseif ($daysUntilExpiry < 30) {
            return 'expiring_soon';
        } elseif ($daysInStock > 365) {
            return 'dead_stock';
        }

        return 'active';
    }

    // Get stock aging report
    public function getStockAgingReport()
    {
        $batches = Batch::where('quantity_available', '>', 0)->get();

        return $batches->groupBy(function($batch) {
            $daysInStock = now()->diffInDays($batch->purchase_date);

            if ($daysInStock < 30) return '0-30 days';
            if ($daysInStock < 90) return '30-90 days';
            if ($daysInStock < 180) return '90-180 days';
            if ($daysInStock < 365) return '180-365 days';
            return '365+ days';
        })->map(function($batches) {
            $totalValue = 0;
            $totalQuantity = 0;

            foreach ($batches as $batch) {
                $totalValue += $batch->purchase_cost * $batch->quantity_available;
                $totalQuantity += $batch->quantity_available;
            }

            return [
                'count' => $batches->count(),
                'quantity' => $totalQuantity,
                'value' => round($totalValue, 2),
                'average_value' => round($totalValue / $batches->count(), 2),
            ];
        });
    }

    // Create purchase order
    public function createPurchaseOrder($supplierId, $items, $totalAmount)
    {
        return DB::transaction(function() use ($supplierId, $items, $totalAmount) {
            $po = PurchaseOrder::create([
                'supplier_id' => $supplierId,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'order_date' => now(),
            ]);

            foreach ($items as $item) {
                $po->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $po;
        });
    }

    // Process stock receipt from purchase order
    public function receiveStock($poId, $receivedItems)
    {
        return DB::transaction(function() use ($poId, $receivedItems) {
            $po = PurchaseOrder::findOrFail($poId);

            foreach ($receivedItems as $item) {
                Batch::create([
                    'product_id' => $item['product_id'],
                    'batch_number' => $item['batch_number'],
                    'sku' => $this->generateSKU($item['product_id'], $item['batch_number']),
                    'quantity_available' => $item['quantity'],
                    'purchase_cost' => $item['unit_price'],
                    'selling_price' => $item['selling_price'],
                    'manufacture_date' => $item['manufacture_date'],
                    'expiry_date' => $item['expiry_date'],
                    'purchase_date' => now(),
                ]);
            }

            $po->update(['status' => 'received']);

            return $po;
        });
    }

    // Generate SKU
    private function generateSKU($productId, $batchNumber)
    {
        $product = Product::findOrFail($productId);
        $timestamp = now()->format('YmdHis');
        return "{$product->brand_id}-{$productId}-{$batchNumber}-{$timestamp}";
    }

    // Get pending payments report
    public function getPendingPaymentsReport()
    {
        return DB::table('sales_orders')
            ->join('customers', 'sales_orders.customer_id', '=', 'customers.id')
            ->where('sales_orders.payment_status', '!=', 'paid')
            ->select([
                'sales_orders.id',
                'sales_orders.order_number',
                'customers.name',
                'customers.type as customer_type',
                'sales_orders.total_amount',
                'sales_orders.paid_amount',
                DB::raw('sales_orders.total_amount - sales_orders.paid_amount as pending_amount'),
                'sales_orders.order_date',
                DB::raw('NOW()::date - sales_orders.order_date::date as days_outstanding'),
                'sales_orders.payment_status',
            ])
            ->orderBy('days_outstanding', 'desc')
            ->get();
    }

    // Get profitability analysis
    public function getProfitabilityAnalysis()
    {
        return DB::table('sales_orders')
            ->join('sales_order_items', 'sales_orders.id', '=', 'sales_order_items.sales_order_id')
            ->join('batches', 'sales_order_items.batch_id', '=', 'batches.id')
            ->select([
                'batches.sku',
                DB::raw('COUNT(*) as units_sold'),
                DB::raw('SUM(sales_order_items.quantity) as total_quantity'),
                DB::raw('AVG(batches.purchase_cost) as avg_cost'),
                DB::raw('AVG(sales_order_items.unit_price) as avg_selling_price'),
                DB::raw('SUM((sales_order_items.unit_price - batches.purchase_cost) * sales_order_items.quantity) as profit'),
                DB::raw('ROUND(SUM((sales_order_items.unit_price - batches.purchase_cost) * sales_order_items.quantity) / SUM(sales_order_items.unit_price * sales_order_items.quantity) * 100, 2) as profit_margin'),
            ])
            ->groupBy('batches.sku')
            ->orderBy('profit', 'desc')
            ->get();
    }
}
