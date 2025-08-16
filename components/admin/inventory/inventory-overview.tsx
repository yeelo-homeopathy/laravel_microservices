"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle } from "lucide-react"

interface InventoryOverviewProps {
  data: {
    totalProducts: number
    inStockProducts: number
    outOfStockProducts: number
    lowStockProducts: number
    totalInventoryValue: number
  }
}

export function InventoryOverview({ data }: InventoryOverviewProps) {
  const stockPercentage = data.totalProducts > 0 ? (data.inStockProducts / data.totalProducts) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalProducts}</div>
          <p className="text-xs text-muted-foreground">Tracked inventory items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.inStockProducts}</div>
          <p className="text-xs text-muted-foreground">{stockPercentage.toFixed(1)}% of total products</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{data.lowStockProducts}</div>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{data.outOfStockProducts}</div>
          <p className="text-xs text-muted-foreground">Immediate action required</p>
        </CardContent>
      </Card>
    </div>
  )
}
