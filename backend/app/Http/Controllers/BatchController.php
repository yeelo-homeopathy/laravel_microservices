<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use Illuminate\Http\Request;

class BatchController extends Controller
{
    public function index(Request $request)
    {
        $query = Batch::with(['product', 'product.brand']);

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->expiry_status) {
            $today = now()->toDateString();
            switch ($request->expiry_status) {
                case 'expired':
                    $query->where('expiry_date', '<', $today);
                    break;
                case 'expiring_soon':
                    $query->whereRaw('expiry_date BETWEEN ? AND ?', [$today, now()->addDays(30)->toDateString()]);
                    break;
                case 'active':
                    $query->where('expiry_date', '>=', $today);
                    break;
            }
        }

        $batches = $query->latest()->paginate(15);

        return response()->json($batches);
    }

    public function show(Batch $batch)
    {
        $batch->load(['product', 'movements']);

        // Calculate aging days
        $batch->aging_days = now()->diffInDays($batch->purchase_date);
        $batch->days_until_expiry = now()->diffInDays($batch->expiry_date);

        return response()->json($batch);
    }

    public function getAgingAnalysis()
    {
        $batches = Batch::with('product')
            ->selectRaw('*, DATEDIFF(NOW(), purchase_date) as aging_days')
            ->orderBy('aging_days', 'DESC')
            ->get();

        return response()->json($batches);
    }

    public function getExpiryAlerts()
    {
        $today = now()->toDateString();

        $alerts = [
            'expired' => Batch::where('expiry_date', '<', $today)->with('product')->count(),
            'expiring_this_month' => Batch::whereRaw('expiry_date BETWEEN ? AND ?', [$today, now()->endOfMonth()->toDateString()])->with('product')->count(),
            'expiring_within_30_days' => Batch::whereRaw('expiry_date BETWEEN ? AND ?', [$today, now()->addDays(30)->toDateString()])->with('product')->count(),
        ];

        return response()->json($alerts);
    }
}
