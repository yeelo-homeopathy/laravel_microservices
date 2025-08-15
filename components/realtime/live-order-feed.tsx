"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { realtimeService, formatRealtimeTimestamp } from "@/lib/services/realtime.service"
import { ShoppingCart, Clock, CheckCircle, Truck, Package } from "lucide-react"

interface OrderUpdate {
  id: string
  orderNumber: string
  customerName: string
  status: string
  totalAmount: number
  timestamp: string
  type: "created" | "updated"
}

export function LiveOrderFeed() {
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    setIsConnected(true)

    // Subscribe to order updates
    const handleOrderUpdate = (data: any) => {
      const update: OrderUpdate = {
        id: data.payload.id,
        orderNumber: data.payload.order_number,
        customerName: data.payload.customer_name || "Unknown Customer",
        status: data.payload.status,
        totalAmount: data.payload.total_amount,
        timestamp: data.timestamp,
        type: data.type === "order_created" ? "created" : "updated",
      }

      setOrderUpdates((prev) => [update, ...prev.slice(0, 19)]) // Keep last 20 updates
    }

    realtimeService.addEventListener("order_created", handleOrderUpdate)
    realtimeService.addEventListener("order_updated", handleOrderUpdate)

    // Subscribe to real-time order changes
    realtimeService.subscribeToOrders((order, event) => {
      // This will trigger the event listeners above
    })

    return () => {
      realtimeService.removeEventListener("order_created", handleOrderUpdate)
      realtimeService.removeEventListener("order_updated", handleOrderUpdate)
      setIsConnected(false)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "processing":
        return <Package className="h-4 w-4 text-purple-600" />
      case "shipped":
        return <Truck className="h-4 w-4 text-orange-600" />
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-orange-100 text-orange-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
          <ShoppingCart className="h-5 w-5" />
          Live Order Feed
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {orderUpdates.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for order updates...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {orderUpdates.map((update, index) => (
                <div key={`${update.id}-${index}`} className="p-4 border-b hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(update.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{update.orderNumber}</span>
                          <Badge variant="secondary" className={`text-xs ${getStatusColor(update.status)}`}>
                            {update.status}
                          </Badge>
                          {update.type === "created" && (
                            <Badge variant="outline" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {update.customerName} • {formatCurrency(update.totalAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatRealtimeTimestamp(update.timestamp)}</div>
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
