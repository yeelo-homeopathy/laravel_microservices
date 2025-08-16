import { getInventoryOverview, getLowStockAlerts } from "@/lib/services/inventory.service"
import { InventoryOverview } from "@/components/admin/inventory/inventory-overview"
import { LowStockAlerts } from "@/components/admin/inventory/low-stock-alerts"
import { InventoryMovements } from "@/components/admin/inventory/inventory-movements"
import { Button } from "@/components/ui/button"
import { Plus, FileDown, Settings } from "lucide-react"
import Link from "next/link"

export default async function InventoryPage() {
  const [overview, lowStockAlerts] = await Promise.all([getInventoryOverview(), getLowStockAlerts()])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor stock levels, movements, and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Link href="/admin/inventory/adjustment">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Stock Adjustment
            </Button>
          </Link>
        </div>
      </div>

      <InventoryOverview data={overview} />

      {lowStockAlerts.length > 0 && <LowStockAlerts alerts={lowStockAlerts} />}

      <InventoryMovements />
    </div>
  )
}
