<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService)
    {
    }

    public function agingReport()
    {
        $report = $this->inventoryService->getStockAgingReport();
        return response()->json($report);
    }

    public function expiryAlerts()
    {
        $alerts = $this->inventoryService->getExpiryAlerts();
        return response()->json($alerts);
    }

    public function deadStock()
    {
        $stock = $this->inventoryService->getDeadStock();
        return response()->json($stock);
    }
}
