"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/services/payment.service"
import { DollarSign, TrendingUp, CheckCircle, XCircle } from "lucide-react"

interface PaymentStatsProps {
  analytics: {
    totalRevenue: number
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    successRate: number
    gatewayStats: Record<string, { count: number; revenue: number }>
    dailyRevenue: Record<string, number>
  }
}

export function PaymentStats({ analytics }: PaymentStatsProps) {
  const { totalRevenue, totalTransactions, successfulTransactions, failedTransactions, successRate, gatewayStats } =
    analytics

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">From {totalTransactions} transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">{successfulTransactions} successful payments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{successfulTransactions}</div>
          <p className="text-xs text-muted-foreground">Completed transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{failedTransactions}</div>
          <p className="text-xs text-muted-foreground">Requires attention</p>
        </CardContent>
      </Card>

      {/* Gateway Performance */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Gateway Performance</CardTitle>
          <CardDescription>Revenue and transaction count by payment gateway</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(gatewayStats).map(([gateway, stats]) => (
              <div key={gateway} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium capitalize">{gateway}</div>
                  <div className="text-sm text-muted-foreground">{stats.count} transactions</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(stats.revenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {((stats.revenue / totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
