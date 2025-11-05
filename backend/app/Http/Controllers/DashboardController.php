<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private AnalyticsService $analyticsService)
    {
    }

    public function metrics()
    {
        $metrics = $this->analyticsService->getDashboardMetrics();

        return response()->json($metrics);
    }

    public function salesSummary(Request $request)
    {
        $startDate = $request->start_date ?? now()->subDays(30);
        $endDate = $request->end_date ?? now();

        // You would implement detailed sales summary logic here
        return response()->json(['message' => 'Sales summary']);
    }

    public function agingAnalysis()
    {
        $analysis = $this->analyticsService->getStockAgingAnalysis();

        return response()->json($analysis);
    }

    public function profitabilityAnalysis()
    {
        $analysis = $this->analyticsService->getProfitabilityAnalysis();

        return response()->json($analysis);
    }
}
