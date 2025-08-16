"use client"

import { useState } from "react"
import type { Order } from "@/lib/services/order.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Package, Truck, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { updateOrderStatus } from "@/lib/services/order.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface OrdersTableProps {
  orders: (Order & { profiles?: any })[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
}

export function OrdersTable({ orders, pagination }: OrdersTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    setLoading(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      toast.success(`Order status updated to ${newStatus}`)
      router.refresh()
    } catch (error) {
      toast.error(`Failed to update order status: ${error}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">{order.fulfillment_status}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.profiles?.first_name} {order.profiles?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(order.created_at)}</div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading === order.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>

                      {order.status === "pending" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "confirmed")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Order
                        </DropdownMenuItem>
                      )}

                      {order.status === "confirmed" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "processing")}>
                          <Package className="h-4 w-4 mr-2" />
                          Start Processing
                        </DropdownMenuItem>
                      )}

                      {order.status === "processing" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "shipped")}>
                          <Truck className="h-4 w-4 mr-2" />
                          Mark as Shipped
                        </DropdownMenuItem>
                      )}

                      {order.status === "shipped" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, "delivered")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Delivered
                        </DropdownMenuItem>
                      )}

                      {!["cancelled", "delivered", "refunded"].includes(order.status) && (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(order.id, "cancelled")}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Order
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {orders.length} of {pagination.total} orders
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} asChild>
            <Link href={`?page=${pagination.page - 1}`}>Previous</Link>
          </Button>
          <div className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} asChild>
            <Link href={`?page=${pagination.page + 1}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
