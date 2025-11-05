<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'customer_type',
        'company_name',
        'gstin',
        'address',
        'city',
        'state',
        'pincode',
        'credit_limit',
        'discount_percentage',
        'payment_terms',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    const TYPES = ['retail', 'wholesale', 'doctor', 'pharmacy', 'clinic', 'distributor'];

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function getOutstandingBalanceAttribute()
    {
        $totalOrders = $this->salesOrders()->where('status', '!=', 'completed')->sum('total_amount');
        $totalPayments = $this->payments()->sum('amount');
        return $totalOrders - $totalPayments;
    }

    public function getAgingPayablesAttribute()
    {
        return $this->payments()
            ->where('status', 'pending')
            ->orderBy('due_date')
            ->get();
    }
}
