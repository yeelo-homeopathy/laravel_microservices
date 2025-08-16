"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type AnalyticsData, formatCurrency, formatPercentage, formatNumber } from "@/lib/services/analytics.service"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react"

interface AnalyticsOverviewProps {
  data: AnalyticsData
}

export function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  const { revenue, orders, customers, products, inventory, payments } = data

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(revenue.total),
      change: formatPercentage(revenue.growth),
      trend: revenue.growth >= 0 ? "up" : "down",
      icon: DollarSign,
      description: "Revenue from completed orders",
    },
    {
      title: "Total Orders",
      value: formatNumber(orders.total),
      change: formatPercentage(orders.growth),
      trend: orders.growth >= 0 ? "up" : "down",
      icon: ShoppingCart,
      description: `Avg. order value: ${formatCurrency(orders.averageValue)}`,
    },
    {
      title: "Total Customers",
      value: formatNumber(customers.total),
      change: formatPercentage(customers.growth),
      trend: customers.growth >= 0 ? "up" : "down",
      icon: Users,
      description: `${customers.new} new, ${customers.returning} returning`,
    },
    {
      title: "Products Sold",
      value: formatNumber(products.totalSold),
      change: "+12.3%", // Mock data
      trend: "up",
      icon: Package,
      description: `${products.lowStock.length} low stock alerts`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
          const trendColor = metric.trend === "up" ? "text-green-600" : "text-red-600"

          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`flex items-center ${trendColor}`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {metric.change}
                  </div>
                  <span className="text-muted-foreground">vs last period</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Payment Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Performance</CardTitle>
            <CardDescription>Payment processing metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Success Rate:</span>
              <span className="font-medium">{payments.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Processed:</span>
              <span className="font-medium">{formatNumber(payments.totalProcessed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Failed Payments:</span>
              <span className="font-medium text-red-600">{payments.failedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Refund Rate:</span>
              <span className="font-medium">{payments.refundRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Status</CardTitle>
            <CardDescription>Current inventory metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Value:</span>
              <span className="font-medium">{formatCurrency(inventory.totalValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Turnover Rate:</span>
              <span className="font-medium">{inventory.turnoverRate.toFixed(1)}x/year</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock Alerts:</span>
              <span className={`font-medium ${inventory.stockAlerts > 0 ? "text-amber-600" : "text-green-600"}`}>
                {inventory.stockAlerts}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
            <CardDescription>Best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.topProducts.slice(0, 3).map((product, index) => (
                <div key={product.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm font-medium truncate">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(product.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{product.sold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
