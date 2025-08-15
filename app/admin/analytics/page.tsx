"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { AnalyticsOverview } from "@/components/admin/analytics/analytics-overview"
import { RevenueChart } from "@/components/admin/analytics/revenue-chart"
import { OrdersChart } from "@/components/admin/analytics/orders-chart"
import { TopProductsTable } from "@/components/admin/analytics/top-products-table"
import { CustomerAnalytics } from "@/components/admin/analytics/customer-analytics"
import { RealTimeMetrics } from "@/components/admin/analytics/real-time-metrics"
import { analyticsService, type AnalyticsData, type DateRange } from "@/lib/services/analytics.service"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Download } from "lucide-react"
import type { DateRange as DateRangeType } from "react-day-picker"

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  })
  const { toast } = useToast()

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadAnalytics()
    }
  }, [dateRange])

  const loadAnalytics = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setLoading(true)
    try {
      const range: DateRange = {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      }

      const data = await analyticsService.getAnalytics(range)
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!analyticsData) return

    const reportData = {
      dateRange: {
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString(),
      },
      summary: {
        totalRevenue: analyticsData.revenue.total,
        totalOrders: analyticsData.orders.total,
        totalCustomers: analyticsData.customers.total,
        newCustomers: analyticsData.customers.new,
      },
      topProducts: analyticsData.products.topProducts,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button variant="outline" onClick={exportReport} disabled={!analyticsData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealTimeMetrics />

      {/* Main Analytics */}
      {analyticsData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <AnalyticsOverview data={analyticsData} />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <RevenueChart data={analyticsData.revenue} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrdersChart data={analyticsData.orders} />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <CustomerAnalytics data={analyticsData.customers} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <TopProductsTable data={analyticsData.products} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
