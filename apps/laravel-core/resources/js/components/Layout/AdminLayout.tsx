"use client"

import type React from "react"
import { useState } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Shield,
  Activity,
  Database,
  Zap,
  MessageSquare,
  Star,
  Truck,
  DollarSign,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Admin Layout Component
 *
 * Main layout wrapper for the admin panel providing:
 * - Responsive sidebar navigation
 * - Header with user menu and notifications
 * - Breadcrumb navigation
 * - Role-based menu items
 * - Mobile-friendly collapsible sidebar
 *
 * Features advanced React patterns with TypeScript, context integration,
 * and responsive design for optimal user experience.
 */

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: string[]
  children?: NavigationItem[]
}

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Navigation items with role-based access control
  const navigation: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      roles: ["super-admin", "admin"],
      children: [
        { name: "All Users", href: "/admin/users", icon: Users },
        { name: "Roles & Permissions", href: "/admin/users/roles", icon: Shield },
      ],
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
      children: [
        { name: "All Products", href: "/admin/products", icon: Package },
        { name: "Categories", href: "/admin/products/categories", icon: Tag },
        { name: "Brands", href: "/admin/products/brands", icon: Star },
        { name: "Inventory", href: "/admin/products/inventory", icon: Database },
      ],
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      badge: "12",
      children: [
        { name: "All Orders", href: "/admin/orders", icon: ShoppingCart },
        { name: "Fulfillment", href: "/admin/orders/fulfillment", icon: Truck },
        { name: "Returns", href: "/admin/orders/returns", icon: Package },
      ],
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
      roles: ["super-admin", "admin"],
      children: [
        { name: "Transactions", href: "/admin/payments", icon: CreditCard },
        { name: "Refunds", href: "/admin/payments/refunds", icon: DollarSign },
        { name: "Reconciliation", href: "/admin/payments/reconciliation", icon: BarChart3 },
      ],
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      children: [
        { name: "Overview", href: "/admin/analytics", icon: BarChart3 },
        { name: "Sales Reports", href: "/admin/analytics/sales", icon: DollarSign },
        { name: "Customer Insights", href: "/admin/analytics/customers", icon: Users },
      ],
    },
    {
      name: "Reviews",
      href: "/admin/reviews",
      icon: MessageSquare,
      badge: "3",
    },
    {
      name: "Services",
      href: "/admin/services",
      icon: Zap,
      roles: ["super-admin", "admin"],
      children: [
        { name: "Service Health", href: "/admin/services", icon: Activity },
        { name: "API Gateway", href: "/admin/services/gateway", icon: Zap },
        { name: "Monitoring", href: "/admin/services/monitoring", icon: BarChart3 },
      ],
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      roles: ["super-admin", "admin"],
    },
  ]

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) => !item.roles || item.roles.includes(user?.role || ""))

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin"
    }
    return location.pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/admin" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">E-Commerce Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {filteredNavigation.map((item) => (
          <div key={item.name}>
            <Link
              to={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActiveRoute(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>

            {/* Sub-navigation */}
            {item.children && isActiveRoute(item.href) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.name}
                    to={child.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                      location.pathname === child.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <child.icon className="mr-3 h-3 w-3" />
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center border-b bg-background px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="w-64 rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
