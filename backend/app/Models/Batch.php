<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Batch extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'brand_id',
        'batch_number',
        'manufacturing_date',
        'expiry_date',
        'quantity_in_stock',
        'cost_price',
        'purchase_price',
        'supplier_id',
        'purchase_order_id',
    ];

    protected $casts = [
        'manufacturing_date' => 'date',
        'expiry_date' => 'date',
        'cost_price' => 'decimal:2',
        'purchase_price' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function getStockAgingDaysAttribute()
    {
        return now()->diffInDays($this->created_at);
    }

    public function getIsExpiredAttribute()
    {
        return now()->isAfter($this->expiry_date);
    }

    public function getExpiresInDaysAttribute()
    {
        return now()->diffInDays($this->expiry_date);
    }

    public function getHoldingCostAttribute()
    {
        $monthlyRate = 0.08; // 8% monthly
        $months = $this->stock_aging_days / 30;
        return $this->cost_price * $this->quantity_in_stock * $monthlyRate * $months;
    }
}
