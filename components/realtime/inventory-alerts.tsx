"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { realtimeService, formatRealtimeTimestamp } from "@/lib/services/realtime.service"
import { AlertTriangle, Package, TrendingDown, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

interface InventoryAlert {
  id: string
  productId: string
  productName: string
  currentStock: number
  threshold: number
  timestamp: string
  severity: "low" | "critical" | "out_of_stock"
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsConnected(true)

    // Subscribe to inventory updates
    const handleInventoryUpdate = (data: any) => {
      const { productId, newStock, product } = data.payload
      const threshold = product.low_stock_threshold || 10

      // Determine severity
      let severity: InventoryAlert["severity"] = "low"
      if (newStock === 0) severity = "out_of_stock"
      else if (newStock <= threshold / 2) severity = "critical"

      // Only add alert if stock is low
      if (newStock <= threshold) {
        const alert: InventoryAlert = {
          id: `${productId}-${Date.now()}`,
          productId,
          productName: product.name,
          currentStock: newStock,
          threshold,
          timestamp: data.timestamp,
          severity,
        }

        setAlerts((prev) => {
          // Remove existing alert for this product
          const filtered = prev.filter((a) => a.productId !== productId)
          return [alert, ...filtered].slice(0, 10) // Keep last 10 alerts
        })
      } else {
        // Remove alert if stock is back above threshold
        setAlerts((prev) => prev.filter((a) => a.productId !== productId))
      }
    }

    const handleLowStockAlert = (data: any) => {
      const product = data.payload
      const alert: InventoryAlert = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        currentStock: product.stock_quantity,
        threshold: product.low_stock_threshold || 10,
        timestamp: data.timestamp,
        severity:
          product.stock_quantity === 0
            ? "out_of_stock"
            : product.stock_quantity <= (product.low_stock_threshold || 10) / 2
              ? "critical"
              : "low",
      }

      setAlerts((prev) => [alert, ...prev.slice(0, 9)])
    }

    realtimeService.addEventListener("inventory_updated", handleInventoryUpdate)
    realtimeService.addEventListener("low_stock_alert", handleLowStockAlert)

    // Subscribe to real-time inventory changes
    realtimeService.subscribeToInventory((product, event) => {
      // This will trigger the event listeners above
    })

    return () => {
      realtimeService.removeEventListener("inventory_updated", handleInventoryUpdate)
      realtimeService.removeEventListener("low_stock_alert", handleLowStockAlert)
      setIsConnected(false)
    }
  }, [])

  const getSeverityColor = (severity: InventoryAlert["severity"]) => {
    switch (severity) {
      case "out_of_stock":
        return "bg-red-100 text-red-800 border-red-200"
      case "critical":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: InventoryAlert["severity"]) => {
    switch (severity) {
      case "out_of_stock":
        return <Package className="h-4 w-4 text-red-600" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "low":
        return <TrendingDown className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleViewProduct = (productId: string) => {
    router.push(`/admin/products/${productId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Inventory Alerts
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No inventory alerts</p>
              <p className="text-xs">All products are well stocked</p>
            </div>
          ) : (
            <div className="space-y-1">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 border-b hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.productName}</span>
                          <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {alert.currentStock === 0 ? (
                            "Out of stock"
                          ) : (
                            <>
                              {alert.currentStock} remaining (threshold: {alert.threshold})
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatRealtimeTimestamp(alert.timestamp)}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewProduct(alert.productId)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
