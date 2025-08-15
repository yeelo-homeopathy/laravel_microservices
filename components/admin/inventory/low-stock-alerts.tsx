"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, Plus } from "lucide-react"
import Link from "next/link"
import type { LowStockAlert } from "@/lib/services/inventory.service"

interface LowStockAlertsProps {
  alerts: LowStockAlert[]
}

export function LowStockAlerts({ alerts }: LowStockAlertsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "low":
        return "bg-orange-100 text-orange-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "low":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Package className="h-4 w-4 text-yellow-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Low Stock Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.slice(0, 10).map((alert) => (
            <div key={alert.product_id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                {getStatusIcon(alert.status)}
                <div>
                  <div className="font-medium">{alert.product_name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {alert.sku}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {alert.current_stock} / {alert.reorder_point}
                  </div>
                  <div className="text-xs text-muted-foreground">Current / Reorder Point</div>
                </div>

                <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>

                <Link href={`/admin/inventory/adjustment?product=${alert.product_id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Restock
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {alerts.length > 10 && (
            <div className="text-center pt-4">
              <Link href="/admin/inventory/alerts">
                <Button variant="outline">View All {alerts.length} Alerts</Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
