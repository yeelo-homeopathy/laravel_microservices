"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { analyticsService, formatCurrency, formatNumber } from "@/lib/services/analytics.service"
import { Activity, DollarSign, ShoppingCart, Users, AlertTriangle } from "lucide-react"

interface RealTimeData {
  todayOrders: number
  todayRevenue: number
  onlineUsers: number
  lowStockCount: number
}

export function RealTimeMetrics() {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRealTimeData()

    // Update every 30 seconds
    const interval = setInterval(loadRealTimeData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadRealTimeData = async () => {
    try {
      const data = await analyticsService.getRealTimeMetrics()
      setRealTimeData(data)
    } catch (error) {
      console.error("Error loading real-time data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !realTimeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading real-time data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Metrics
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatNumber(realTimeData.todayOrders)}</div>
              <div className="text-sm text-muted-foreground">Orders Today</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(realTimeData.todayRevenue)}</div>
              <div className="text-sm text-muted-foreground">Revenue Today</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatNumber(realTimeData.onlineUsers)}</div>
              <div className="text-sm text-muted-foreground">Online Users</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${realTimeData.lowStockCount > 0 ? "bg-amber-100" : "bg-gray-100"}`}>
              <AlertTriangle
                className={`h-5 w-5 ${realTimeData.lowStockCount > 0 ? "text-amber-600" : "text-gray-600"}`}
              />
            </div>
            <div>
              <div className={`text-2xl font-bold ${realTimeData.lowStockCount > 0 ? "text-amber-600" : ""}`}>
                {formatNumber(realTimeData.lowStockCount)}
              </div>
              <div className="text-sm text-muted-foreground">Stock Alerts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
