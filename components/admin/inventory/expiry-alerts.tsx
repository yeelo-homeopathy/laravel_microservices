"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Calendar, Bell, X } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ExpiryAlert {
  id: string
  batch_id: string
  product_name: string
  brand_name: string
  batch_number: string
  expiry_date: string
  days_to_expiry: number
  quantity_available: number
  value_at_cost: number
  alert_type: "expired" | "expiring_soon" | "expiring_this_month"
  priority: "high" | "medium" | "low"
}

interface ExpiryAlertsProps {
  alerts: ExpiryAlert[]
  onDismissAlert: (alertId: string) => Promise<void>
  onCreateDiscountOffer: (batchId: string, discountPercentage: number) => Promise<void>
}

export function ExpiryAlerts({ alerts, onDismissAlert, onCreateDiscountOffer }: ExpiryAlertsProps) {
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])

  const getAlertBadge = (alert: ExpiryAlert) => {
    switch (alert.alert_type) {
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "expiring_soon":
        return <Badge variant="secondary">Expiring Soon</Badge>
      case "expiring_this_month":
        return <Badge variant="outline">This Month</Badge>
      default:
        return <Badge variant="default">Alert</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getAlertsByType = (type: string) => {
    return alerts.filter((alert) => alert.alert_type === type)
  }

  const expiredAlerts = getAlertsByType("expired")
  const expiringSoonAlerts = getAlertsByType("expiring_soon")
  const expiringThisMonthAlerts = getAlertsByType("expiring_this_month")

  const totalValue = alerts.reduce((sum, alert) => sum + alert.value_at_cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expiry Alerts</h2>
          <p className="text-muted-foreground">Monitor products approaching expiry dates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
          <Button>Create Discount Offers</Button>
        </div>
      </div>

      {/* Summary Alert */}
      {alerts.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Attention Required</AlertTitle>
          <AlertDescription className="text-yellow-700">
            You have {alerts.length} products requiring attention with a total value of {formatCurrency(totalValue)}.
            Consider creating discount offers or contacting suppliers for returns.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(expiredAlerts.reduce((sum, alert) => sum + alert.value_at_cost, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringSoonAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(expiringSoonAlerts.reduce((sum, alert) => sum + alert.value_at_cost, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{expiringThisMonthAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(expiringThisMonthAlerts.reduce((sum, alert) => sum + alert.value_at_cost, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredAlerts.length})</TabsTrigger>
          <TabsTrigger value="expiring_soon">Expiring Soon ({expiringSoonAlerts.length})</TabsTrigger>
          <TabsTrigger value="this_month">This Month ({expiringThisMonthAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AlertsTable alerts={alerts} onDismissAlert={onDismissAlert} onCreateDiscountOffer={onCreateDiscountOffer} />
        </TabsContent>

        <TabsContent value="expired">
          <AlertsTable
            alerts={expiredAlerts}
            onDismissAlert={onDismissAlert}
            onCreateDiscountOffer={onCreateDiscountOffer}
          />
        </TabsContent>

        <TabsContent value="expiring_soon">
          <AlertsTable
            alerts={expiringSoonAlerts}
            onDismissAlert={onDismissAlert}
            onCreateDiscountOffer={onCreateDiscountOffer}
          />
        </TabsContent>

        <TabsContent value="this_month">
          <AlertsTable
            alerts={expiringThisMonthAlerts}
            onDismissAlert={onDismissAlert}
            onCreateDiscountOffer={onCreateDiscountOffer}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AlertsTable({
  alerts,
  onDismissAlert,
  onCreateDiscountOffer,
}: {
  alerts: ExpiryAlert[]
  onDismissAlert: (alertId: string) => Promise<void>
  onCreateDiscountOffer: (batchId: string, discountPercentage: number) => Promise<void>
}) {
  const getAlertBadge = (alert: ExpiryAlert) => {
    switch (alert.alert_type) {
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "expiring_soon":
        return <Badge variant="secondary">Expiring Soon</Badge>
      case "expiring_this_month":
        return <Badge variant="outline">This Month</Badge>
      default:
        return <Badge variant="default">Alert</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiry Alerts</CardTitle>
        <CardDescription>Products requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div className={`font-medium ${getPriorityColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{alert.product_name}</div>
                    <div className="text-sm text-muted-foreground">{alert.brand_name}</div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{alert.batch_number}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(alert.expiry_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={alert.days_to_expiry <= 0 ? "text-red-600 font-medium" : ""}>
                      {alert.days_to_expiry <= 0 ? "Expired" : `${alert.days_to_expiry} days`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{alert.quantity_available}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(alert.value_at_cost)}</div>
                  </TableCell>
                  <TableCell>{getAlertBadge(alert)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onCreateDiscountOffer(alert.batch_id, 20)}>
                        20% Off
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDismissAlert(alert.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
