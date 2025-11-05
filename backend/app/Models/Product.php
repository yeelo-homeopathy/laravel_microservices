<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'brand_id',
        'name',
        'sku',
        'potency',
        'therapeutic_use',
        'description',
        'cost_price',
        'markup_percentage',
        'category',
        'hsn_code',
        'gst_rate',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'markup_percentage' => 'decimal:2',
        'gst_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }

    public function getSalesPriceAttribute()
    {
        $margin = $this->cost_price * ($this->markup_percentage / 100);
        return $this->cost_price + $margin;
    }

    public function getPriceWithGstAttribute()
    {
        $gstAmount = $this->sales_price * ($this->gst_rate / 100);
        return $this->sales_price + $gstAmount;
    }
}
