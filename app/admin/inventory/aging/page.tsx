import { StockAgingAnalysis } from "@/components/admin/inventory/stock-aging-analysis"
import {
  getStockAgingData,
  refreshStockAging,
  createDiscountCampaign,
  markAsDeadStock,
} from "@/lib/services/inventory-aging.service"

export default async function StockAgingPage() {
  const stockAgingData = await getStockAgingData()

  return (
    <div className="container mx-auto py-6">
      <StockAgingAnalysis
        stockAgingData={stockAgingData}
        onRefreshAnalysis={refreshStockAging}
        onCreateDiscountCampaign={createDiscountCampaign}
        onMarkAsDeadStock={markAsDeadStock}
      />
    </div>
  )
}
