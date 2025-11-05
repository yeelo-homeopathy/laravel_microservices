<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\SalesOrder;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getDashboardMetrics()
    {
        return [
            'total_sales' => SalesOrder::sum('grand_total'),
            'total_orders' => SalesOrder::count(),
            'pending_payments' => SalesOrder::where('payment_status', '!=', 'paid')->sum('grand_total'),
            'total_inventory_value' => $this->getTotalInventoryValue(),
            'dead_stock_count' => $this->getDeadStockCount(),
            'expiring_soon_count' => $this->getExpiringProductCount(),
        ];
    }

    public function getStockAgingAnalysis()
    {
        $batches = Batch::with('product', 'product.brand')
            ->select('*')
            ->get()
            ->map(function ($batch) {
                $agingDays = Carbon::parse($batch->purchase_date)->diffInDays(now());
                $monthlyInterest = ($batch->quantity * $batch->cost_price * 0.10) / 12;

                return [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'product_name' => $batch->product->name,
                    'quantity' => $batch->quantity,
                    'cost_price' => $batch->cost_price,
                    'inventory_value' => $batch->quantity * $batch->cost_price,
                    'aging_days' => $agingDays,
                    'aging_category' => $this->getAgingCategory($agingDays),
                    'monthly_interest_8_10_percent' => $monthlyInterest,
                    'expiry_date' => $batch->expiry_date,
                    'days_until_expiry' => Carbon::parse($batch->expiry_date)->diffInDays(now()),
                ];
            });

        return $batches;
    }

    public function getProfitabilityAnalysis()
    {
        $products = Product::with('batches')
            ->get()
            ->map(function ($product) {
                $totalSold = $product->salesOrderItems()->sum('quantity');
                $totalRevenue = $product->salesOrderItems()->sum('total_price');
                $totalCost = $product->batches()->sum(DB::raw('quantity * cost_price'));

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'total_sold' => $totalSold,
                    'total_revenue' => $totalRevenue,
                    'total_cost' => $totalCost,
                    'profit' => $totalRevenue - $totalCost,
                    'margin_percent' => $totalRevenue > 0 ? (($totalRevenue - $totalCost) / $totalRevenue) * 100 : 0,
                ];
            });

        return $products;
    }

    private function getTotalInventoryValue()
    {
        return Batch::selectRaw('SUM(quantity * cost_price) as total')->value('total') ?? 0;
    }

    private function getDeadStockCount()
    {
        $ninetyDaysAgo = now()->subDays(90);

        return Batch::where('available_quantity', '>', 0)
            ->where('purchase_date', '<', $ninetyDaysAgo)
            ->count();
    }

    private function getExpiringProductCount()
    {
        return Batch::where('available_quantity', '>', 0)
            ->where('expiry_date', '<=', now()->addDays(30))
            ->where('expiry_date', '>', now())
            ->count();
    }

    private function getAgingCategory($days)
    {
        if ($days <= 30) return '0-30 days';
        if ($days <= 60) return '30-60 days';
        if ($days <= 90) return '60-90 days';
        return '90+ days';
    }
}
