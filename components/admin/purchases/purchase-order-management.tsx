"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Eye, Truck, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { purchaseService } from "@/lib/services/purchase.service"

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  order_date: string
  expected_delivery: string
  status: "draft" | "sent" | "confirmed" | "partial" | "received" | "cancelled"
  total_amount: number
  tax_amount: number
  grand_total: number
  items: PurchaseOrderItem[]
  notes?: string
}

interface PurchaseOrderItem {
  id: string
  product_id: string
  product_name: string
  brand_name: string
  potency?: string
  quantity: number
  unit_price: number
  total_price: number
  received_quantity: number
  batch_number?: string
  expiry_date?: string
}

export default function PurchaseOrderManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  const loadPurchaseOrders = async () => {
    try {
      const data = await purchaseService.getAllPurchaseOrders()
      setPurchaseOrders(data)
    } catch (error) {
      console.error("Error loading purchase orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      confirmed: "bg-yellow-100 text-yellow-800",
      partial: "bg-orange-100 text-orange-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="h-4 w-4" />
      case "sent":
        return <Truck className="h-4 w-4" />
      case "confirmed":
        return <Clock className="h-4 w-4" />
      case "partial":
        return <AlertTriangle className="h-4 w-4" />
      case "received":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || po.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const updatePOStatus = async (poId: string, newStatus: string) => {
    try {
      await purchaseService.updatePurchaseOrderStatus(poId, newStatus)
      await loadPurchaseOrders()
    } catch (error) {
      console.error("Error updating PO status:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading purchase orders...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders and supplier deliveries</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {purchaseOrders.filter((po) => ["sent", "confirmed", "partial"].includes(po.status)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received</p>
                <p className="text-2xl font-bold text-green-600">
                  {purchaseOrders.filter((po) => po.status === "received").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ₹{purchaseOrders.reduce((sum, po) => sum + po.grand_total, 0).toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by PO number or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
          <CardDescription>Track and manage all purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <div className="font-medium">{po.po_number}</div>
                  </TableCell>
                  <TableCell>{po.supplier_name}</TableCell>
                  <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div
                      className={`${new Date(po.expected_delivery) < new Date() && po.status !== "received" ? "text-red-600" : ""}`}
                    >
                      {new Date(po.expected_delivery).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(po.status)}
                      {getStatusBadge(po.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">₹{po.grand_total.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{po.items.length} items</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {po.status === "confirmed" && (
                        <Button variant="ghost" size="sm" onClick={() => updatePOStatus(po.id, "received")}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
