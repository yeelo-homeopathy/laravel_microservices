"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { realtimeService, formatRealtimeTimestamp } from "@/lib/services/realtime.service"
import { Activity, DollarSign, ShoppingCart, Users, AlertTriangle } from "lucide-react"

interface LiveMetrics {
  todayOrders: number
  todayRevenue: number
  activeUsers: number
  lowStockAlerts: number
  lastUpdated: string
}

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    // Load initial metrics
    loadMetrics()

    // Update every 30 seconds
    const interval = setInterval(loadMetrics, 30000)

    // Subscribe to real-time events that affect metrics
    const handleOrderCreated = () => {
      loadMetrics() // Refresh metrics when new order is created
    }

    const handlePaymentCompleted = () => {
      loadMetrics() // Refresh metrics when payment is completed
    }

    const handleLowStockAlert = () => {
      loadMetrics() // Refresh metrics when stock alert is triggered
    }

    realtimeService.addEventListener("order_created", handleOrderCreated)
    realtimeService.addEventListener("payment_completed", handlePaymentCompleted)
    realtimeService.addEventListener("low_stock_alert", handleLowStockAlert)

    return () => {
      clearInterval(interval)
      realtimeService.removeEventListener("order_created", handleOrderCreated)
      realtimeService.removeEventListener("payment_completed", handlePaymentCompleted)
      realtimeService.removeEventListener("low_stock_alert", handleLowStockAlert)
    }
  }, [])

  const loadMetrics = async () => {
    try {
      setIsLive(false)
      const data = await realtimeService.getLiveMetrics()
      setMetrics(data)
      setIsLive(true)
    } catch (error) {
      console.error("Error loading live metrics:", error)
      setMetrics({
        todayOrders: 24,
        todayRevenue: 485600, // $4,856.00 in cents
        activeUsers: 18,
        lowStockAlerts: 3,
        lastUpdated: new Date().toISOString(),
      })
      setIsLive(false)
    }
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Metrics
          <Badge variant={isLive ? "default" : "secondary"} className="ml-auto">
            {isLive ? "Live" : "Demo Mode"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Orders */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrics.todayOrders}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Orders Today</div>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(metrics.todayRevenue)}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Revenue Today</div>
            </div>
          </div>

          {/* Active Users */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{metrics.activeUsers}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Active Users</div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div
            className={`flex items-center space-x-3 p-3 rounded-lg ${
              metrics.lowStockAlerts > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-gray-50 dark:bg-gray-950"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${metrics.lowStockAlerts > 0 ? "bg-amber-100 dark:bg-amber-900" : "bg-gray-100 dark:bg-gray-900"}`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${metrics.lowStockAlerts > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}`}
              />
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${metrics.lowStockAlerts > 0 ? "text-amber-900 dark:text-amber-100" : "text-gray-900 dark:text-gray-100"}`}
              >
                {metrics.lowStockAlerts}
              </div>
              <div
                className={`text-sm ${metrics.lowStockAlerts > 0 ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"}`}
              >
                Stock Alerts
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Last updated: {formatRealtimeTimestamp(metrics.lastUpdated)}
        </div>
      </CardContent>
    </Card>
  )
}
