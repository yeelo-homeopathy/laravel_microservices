<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\InventoryMovement;
use Carbon\Carbon;

class InventoryService
{
    public function getStockAgingReport()
    {
        $batches = Batch::with('product', 'product.brand')
            ->where('available_quantity', '>', 0)
            ->get();

        $agingData = [];
        foreach ($batches as $batch) {
            $agingDays = now()->diffInDays($batch->purchase_date);
            
            // Calculate 8-10% monthly interest on holding cost
            $inventoryValue = $batch->quantity * $batch->cost_price;
            $monthlyInterest = ($inventoryValue * 0.10) / 12; // 10% annual = monthly rate
            $totalMonths = $agingDays / 30;
            $accumulatedCost = $monthlyInterest * $totalMonths;

            $agingData[] = [
                'batch_id' => $batch->id,
                'product_name' => $batch->product->name,
                'brand' => $batch->product->brand->name,
                'batch_number' => $batch->batch_number,
                'quantity' => $batch->quantity,
                'available_quantity' => $batch->available_quantity,
                'cost_price' => $batch->cost_price,
                'inventory_value' => $inventoryValue,
                'aging_days' => $agingDays,
                'aging_category' => $this->getAgingCategory($agingDays),
                'monthly_interest_10_percent' => $monthlyInterest,
                'accumulated_cost' => $accumulatedCost,
                'expiry_date' => $batch->expiry_date,
                'days_until_expiry' => now()->diffInDays($batch->expiry_date),
                'is_expired' => now()->isAfter($batch->expiry_date),
            ];
        }

        return collect($agingData)->sortByDesc('aging_days');
    }

    private function getAgingCategory($days): string
    {
        if ($days <= 30) return '0-30 days (Fresh)';
        if ($days <= 60) return '30-60 days (Young)';
        if ($days <= 90) return '60-90 days (Aging)';
        if ($days <= 180) return '90-180 days (Old)';
        return '180+ days (Dead Stock)';
    }

    public function logMovement($batchId, $type, $quantity, $reference)
    {
        return InventoryMovement::create([
            'batch_id' => $batchId,
            'movement_type' => $type,
            'quantity' => $quantity,
            'reference_id' => $reference,
            'reference_type' => 'order',
        ]);
    }

    public function getExpiryAlerts()
    {
        $today = now();
        $oneMonthLater = $today->copy()->addMonth();

        return Batch::where('available_quantity', '>', 0)
            ->where(function ($query) use ($today, $oneMonthLater) {
                $query->whereBetween('expiry_date', [$today, $oneMonthLater])
                      ->orWhere('expiry_date', '<', $today);
            })
            ->with('product', 'product.brand')
            ->get()
            ->map(function ($batch) {
                $batch->alert_type = now()->isAfter($batch->expiry_date) ? 'expired' : 'expiring_soon';
                $batch->days_until_expiry = now()->diffInDays($batch->expiry_date);
                return $batch;
            });
    }

    public function getDeadStock()
    {
        return Batch::where('available_quantity', '>', 0)
            ->where('purchase_date', '<', now()->subMonths(6))
            ->with('product', 'product.brand')
            ->get()
            ->map(function ($batch) {
                $batch->aging_days = now()->diffInDays($batch->purchase_date);
                $batch->holding_cost = ($batch->quantity * $batch->cost_price * 0.10) / 12 * ($batch->aging_days / 30);
                return $batch;
            });
    }
}
