import { createClient } from "@/lib/supabase/client"

export interface DateRange {
  from: string
  to: string
}

export interface AnalyticsData {
  revenue: {
    total: number
    growth: number
    trend: Array<{ date: string; value: number }>
  }
  orders: {
    total: number
    growth: number
    averageValue: number
    trend: Array<{ date: string; count: number; value: number }>
  }
  customers: {
    total: number
    new: number
    returning: number
    growth: number
  }
  products: {
    totalSold: number
    topProducts: Array<{ id: string; name: string; sold: number; revenue: number }>
    lowStock: Array<{ id: string; name: string; stock: number; threshold: number }>
  }
  inventory: {
    totalValue: number
    turnoverRate: number
    stockAlerts: number
  }
  payments: {
    successRate: number
    totalProcessed: number
    failedCount: number
    refundRate: number
  }
}

export class AnalyticsService {
  private supabase = createClient()

  // Get comprehensive analytics data
  async getAnalytics(dateRange: DateRange): Promise<AnalyticsData> {
    try {
      const [revenue, orders, customers, products, inventory, payments] = await Promise.all([
        this.getRevenueAnalytics(dateRange),
        this.getOrderAnalytics(dateRange),
        this.getCustomerAnalytics(dateRange),
        this.getProductAnalytics(dateRange),
        this.getInventoryAnalytics(),
        this.getPaymentAnalytics(dateRange),
      ])

      return {
        revenue,
        orders,
        customers,
        products,
        inventory,
        payments,
      }
    } catch (error) {
      console.error("Analytics error:", error)
      throw error
    }
  }

  // Revenue analytics with growth calculation and trend data
  private async getRevenueAnalytics(dateRange: DateRange) {
    // Current period revenue
    const { data: currentRevenue } = await this.supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)

    const total = currentRevenue?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // Previous period for growth calculation
    const periodDays = Math.ceil(
      (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24),
    )
    const previousFrom = new Date(new Date(dateRange.from).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()
    const previousTo = dateRange.from

    const { data: previousRevenue } = await this.supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", previousFrom)
      .lt("created_at", previousTo)

    const previousTotal = previousRevenue?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0

    // Daily revenue trend
    const { data: dailyRevenue } = await this.supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("status", "completed")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)
      .order("created_at")

    const trend = this.groupByDate(dailyRevenue || [], "total_amount")

    return { total, growth, trend }
  }

  // Order analytics with metrics and trends
  private async getOrderAnalytics(dateRange: DateRange) {
    // Current period orders
    const { data: currentOrders } = await this.supabase
      .from("orders")
      .select("total_amount, created_at")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)

    const total = currentOrders?.length || 0
    const totalValue = currentOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    const averageValue = total > 0 ? totalValue / total : 0

    // Previous period for growth
    const periodDays = Math.ceil(
      (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24),
    )
    const previousFrom = new Date(new Date(dateRange.from).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: previousOrders } = await this.supabase
      .from("orders")
      .select("id")
      .gte("created_at", previousFrom)
      .lt("created_at", dateRange.from)

    const previousTotal = previousOrders?.length || 0
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0

    // Daily order trend
    const trend = currentOrders ? this.groupOrdersByDate(currentOrders) : []

    return { total, growth, averageValue, trend }
  }

  // Customer analytics
  private async getCustomerAnalytics(dateRange: DateRange) {
    // Total customers
    const { data: allCustomers } = await this.supabase
      .from("user_profiles")
      .select("id, created_at")
      .eq("role", "customer")

    const total = allCustomers?.length || 0

    // New customers in period
    const newCustomers =
      allCustomers?.filter((customer) => customer.created_at >= dateRange.from && customer.created_at <= dateRange.to)
        .length || 0

    // Returning customers (customers who made orders in this period but registered before)
    const { data: orderCustomers } = await this.supabase
      .from("orders")
      .select("user_id")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)

    const uniqueOrderCustomers = new Set(orderCustomers?.map((o) => o.user_id) || [])
    const returningCustomers = Array.from(uniqueOrderCustomers).filter((userId) => {
      const customer = allCustomers?.find((c) => c.id === userId)
      return customer && customer.created_at < dateRange.from
    }).length

    // Growth calculation
    const periodDays = Math.ceil(
      (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24),
    )
    const previousFrom = new Date(new Date(dateRange.from).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()

    const previousNewCustomers =
      allCustomers?.filter((customer) => customer.created_at >= previousFrom && customer.created_at < dateRange.from)
        .length || 0

    const growth = previousNewCustomers > 0 ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 : 0

    return {
      total,
      new: newCustomers,
      returning: returningCustomers,
      growth,
    }
  }

  // Product analytics
  private async getProductAnalytics(dateRange: DateRange) {
    // Top selling products
    const { data: orderItems } = await this.supabase
      .from("order_items")
      .select(`
        quantity,
        unit_price,
        products!inner(id, name),
        orders!inner(created_at, status)
      `)
      .gte("orders.created_at", dateRange.from)
      .lte("orders.created_at", dateRange.to)
      .eq("orders.status", "completed")

    // Aggregate product sales
    const productSales = (orderItems || []).reduce(
      (acc, item) => {
        const productId = item.products.id
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: item.products.name,
            sold: 0,
            revenue: 0,
          }
        }
        acc[productId].sold += item.quantity
        acc[productId].revenue += item.quantity * item.unit_price
        return acc
      },
      {} as Record<string, { id: string; name: string; sold: number; revenue: number }>,
    )

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const totalSold = Object.values(productSales).reduce((sum, product) => sum + product.sold, 0)

    // Low stock products
    const { data: lowStockProducts } = await this.supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold")
      .lt("stock_quantity", 10) // Products with less than 10 in stock
      .limit(10)

    const lowStock = (lowStockProducts || []).map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock_quantity,
      threshold: product.low_stock_threshold || 5,
    }))

    return {
      totalSold,
      topProducts,
      lowStock,
    }
  }

  // Inventory analytics
  private async getInventoryAnalytics() {
    // Total inventory value
    const { data: products } = await this.supabase.from("products").select("stock_quantity, cost_price")

    const totalValue = (products || []).reduce((sum, product) => sum + product.stock_quantity * product.cost_price, 0)

    // Stock alerts count
    const stockAlerts = (products || []).filter((product) => product.stock_quantity < 10).length

    // Mock turnover rate calculation (would need historical data)
    const turnoverRate = 4.2 // Average inventory turns per year

    return {
      totalValue,
      turnoverRate,
      stockAlerts,
    }
  }

  // Payment analytics
  private async getPaymentAnalytics(dateRange: DateRange) {
    const { data: payments } = await this.supabase
      .from("payments")
      .select("status, amount")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)

    const totalProcessed = payments?.length || 0
    const successfulPayments = payments?.filter((p) => p.status === "completed").length || 0
    const failedPayments = payments?.filter((p) => p.status === "failed").length || 0

    const successRate = totalProcessed > 0 ? (successfulPayments / totalProcessed) * 100 : 0

    // Refund rate calculation
    const { data: refunds } = await this.supabase
      .from("payment_refunds")
      .select("id")
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to)

    const refundCount = refunds?.length || 0
    const refundRate = successfulPayments > 0 ? (refundCount / successfulPayments) * 100 : 0

    return {
      successRate,
      totalProcessed,
      failedCount: failedPayments,
      refundRate,
    }
  }

  // Helper method to group data by date
  private groupByDate(data: any[], valueField: string) {
    const grouped = data.reduce(
      (acc, item) => {
        const date = item.created_at.split("T")[0]
        if (!acc[date]) acc[date] = 0
        acc[date] += item[valueField]
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(grouped).map(([date, value]) => ({ date, value }))
  }

  // Helper method to group orders by date
  private groupOrdersByDate(orders: any[]) {
    const grouped = orders.reduce(
      (acc, order) => {
        const date = order.created_at.split("T")[0]
        if (!acc[date]) acc[date] = { count: 0, value: 0 }
        acc[date].count += 1
        acc[date].value += order.total_amount
        return acc
      },
      {} as Record<string, { count: number; value: number }>,
    )

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }))
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    const today = new Date().toISOString().split("T")[0]

    const [todayOrders, todayRevenue, onlineUsers, lowStockCount] = await Promise.all([
      // Today's orders
      this.supabase
        .from("orders")
        .select("id")
        .gte("created_at", `${today}T00:00:00`)
        .then(({ data }) => data?.length || 0),

      // Today's revenue
      this.supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("created_at", `${today}T00:00:00`)
        .then(({ data }) => data?.reduce((sum, order) => sum + order.total_amount, 0) || 0),

      // Mock online users (would integrate with real-time tracking)
      Promise.resolve(Math.floor(Math.random() * 50) + 10),

      // Low stock alerts
      this.supabase
        .from("products")
        .select("id")
        .lt("stock_quantity", 10)
        .then(({ data }) => data?.length || 0),
    ])

    return {
      todayOrders,
      todayRevenue,
      onlineUsers,
      lowStockCount,
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()

// Utility functions
export const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export const formatPercentage = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value)
}
