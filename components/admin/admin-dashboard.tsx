"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveMetrics } from "@/components/realtime/live-metrics"
import { LiveOrderFeed } from "@/components/realtime/live-order-feed"
import { InventoryAlerts } from "@/components/realtime/inventory-alerts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  Menu,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Plus,
  Download,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/services/database.service"
import { formatCurrency } from "@/lib/utils"

interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  lowStockProducts: number
  totalCustomers: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    status: "success" | "warning" | "error"
  }>
}

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const navigationItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, current: true },
    { name: "Products", href: "/admin/products", icon: Package, badge: stats?.lowStockProducts },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: stats?.pendingOrders },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Inventory", href: "/admin/inventory", icon: Package },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  useEffect(() => {
    loadDashboardStats()

    // Refresh stats every 5 minutes
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardStats = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      // Get today's analytics
      const analytics = await db.getAnalytics({
        start: startOfDay.toISOString(),
        end: today.toISOString(),
      })

      // Get pending orders
      const pendingOrders = await db.getOrders({ status: "pending", limit: 1 })

      // Get low stock products
      const products = await db.getProducts({ limit: 1000 })
      const lowStockCount = products.filter((p) => p.inventory_quantity <= (p.low_stock_threshold || 10)).length

      // Get total customers
      const customers = await db.getProfiles({ role: "customer", limit: 1 })

      // Mock recent activity (in real app, this would come from activity logs)
      const recentActivity = [
        {
          id: "1",
          type: "order",
          message: "New order #ORD-2024-001 received",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: "success" as const,
        },
        {
          id: "2",
          type: "inventory",
          message: "Low stock alert: iPhone 15 Pro Max",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: "warning" as const,
        },
        {
          id: "3",
          type: "payment",
          message: "Payment processed successfully",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "success" as const,
        },
      ]

      const todayRevenue = analytics.orders.reduce((sum, order) => sum + order.total_amount, 0)

      setStats({
        todayRevenue,
        todayOrders: analytics.orders.length,
        pendingOrders: pendingOrders.length,
        lowStockProducts: lowStockCount,
        totalCustomers: customers.length,
        recentActivity,
      })
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">TechMart Pro Admin</h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {/* Navigation items for larger screens */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant={item.current ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className="flex items-center gap-2 relative"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-background border-r p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant={item.current ? "default" : "ghost"}
                    className="w-full justify-start gap-2 relative"
                    onClick={() => {
                      router.push(item.href)
                      setSidebarOpen(false)
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="p-6 space-y-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600">+12.5%</span>
                    <span className="text-muted-foreground ml-1">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
                      <p className="text-2xl font-bold">{stats.todayOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600">+8.2%</span>
                    <span className="text-muted-foreground ml-1">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                      <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => router.push("/admin/orders?status=pending")}>
                      <Eye className="h-4 w-4 mr-1" />
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Stock Alerts</p>
                      <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
                    </div>
                    <AlertTriangle
                      className={`h-8 w-8 ${stats.lowStockProducts > 0 ? "text-red-600" : "text-green-600"}`}
                    />
                  </div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => router.push("/admin/inventory")}>
                      <Eye className="h-4 w-4 mr-1" />
                      Manage Stock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Metrics */}
            <LiveMetrics />

            {/* Dashboard Content */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Live Order Feed */}
              <LiveOrderFeed />

              {/* Inventory Alerts */}
              <InventoryAlerts />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge
                      variant={
                        activity.status === "success"
                          ? "default"
                          : activity.status === "warning"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Current system metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Database Performance</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>API Response Time</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cache Hit Rate</span>
                      <span>96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm font-bold text-green-600">3.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Order Value</span>
                    <span className="text-sm font-bold">{formatCurrency(89.5)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-green-600">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Return Rate</span>
                    <span className="text-sm font-bold text-green-600">2.1%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-transparent hover:bg-muted/50"
                onClick={() => router.push("/admin/products/new")}
              >
                <Plus className="h-6 w-6" />
                Add Product
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-transparent hover:bg-muted/50"
                onClick={() => router.push("/admin/orders")}
              >
                <ShoppingCart className="h-6 w-6" />
                Process Orders
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-transparent hover:bg-muted/50"
                onClick={() => router.push("/admin/users/invite")}
              >
                <Users className="h-6 w-6" />
                Invite User
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-transparent hover:bg-muted/50"
                onClick={() => router.push("/admin/analytics")}
              >
                <Download className="h-6 w-6" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health and service availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Real-time</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Payment Gateway</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Email Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">CDN</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
