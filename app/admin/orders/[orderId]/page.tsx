"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/services/payment.service"
import { updateOrderStatus } from "@/lib/services/order.service"
import { ArrowLeft, Package, User, MapPin, CreditCard, FileText, Save } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface AdminOrderDetails {
  id: string
  order_number: string
  status: string
  payment_status: string
  fulfillment_status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  billing_address: any
  shipping_address: any
  customer_email: string
  customer_phone?: string
  notes?: string
  internal_notes?: string
  created_at: string
  processed_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product_snapshot: {
      name: string
      image?: string
      sku?: string
    }
    products?: {
      name: string
      sku: string
      images: string[]
    }
  }>
  profiles?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  payments?: Array<{
    id: string
    amount: number
    status: string
    payment_method: string
    gateway: string
    created_at: string
  }>
}

export default function AdminOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<AdminOrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  const orderId = params.orderId as string
  const supabase = createClient()

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_snapshot,
            products (
              name,
              sku,
              images
            )
          ),
          profiles!orders_user_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          payments (
            id,
            amount,
            status,
            payment_method,
            gateway,
            created_at
          )
        `)
        .eq("id", orderId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          toast({
            title: "Order not found",
            description: "The order you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/admin/orders")
          return
        }
        throw error
      }

      setOrder(data)
      setNewStatus(data.status)
      setInternalNotes(data.internal_notes || "")
    } catch (error) {
      console.error("Error loading order details:", error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return

    setUpdating(true)
    try {
      await updateOrderStatus(order.id, newStatus as any, internalNotes)
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
      await loadOrderDetails() // Reload to get updated data
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error}`,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-orange-100 text-orange-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Loading order details...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
        <Link href="/admin/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
            <p className="text-muted-foreground">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <Badge className={getStatusColor(order.status)} variant="secondary">
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>{order.order_items.length} items in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={
                        item.products?.images?.[0] ||
                        item.product_snapshot.image ||
                        "/placeholder.svg?height=64&width=64" ||
                        "/placeholder.svg"
                      }
                      alt={item.product_snapshot.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_snapshot.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.products?.sku || item.product_snapshot.sku || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.total_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Contact Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {order.profiles?.first_name} {order.profiles?.last_name}
                  </p>
                  <p>{order.customer_email}</p>
                  {order.customer_phone && <p>{order.customer_phone}</p>}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Billing Address</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    {order.billing_address.first_name} {order.billing_address.last_name}
                  </p>
                  {order.billing_address.company && <p>{order.billing_address.company}</p>}
                  <p>{order.billing_address.address_line_1}</p>
                  {order.billing_address.address_line_2 && <p>{order.billing_address.address_line_2}</p>}
                  <p>
                    {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}
                  </p>
                  <p>{order.billing_address.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                {order.shipping_address.company && <p>{order.shipping_address.company}</p>}
                <p>{order.shipping_address.address_line_1}</p>
                {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.shipping_address.phone && <p>Phone: {order.shipping_address.phone}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Management */}
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="internal-notes">Internal Notes</Label>
                <Textarea
                  id="internal-notes"
                  placeholder="Add internal notes..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleStatusUpdate} disabled={updating || newStatus === order.status} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {updating ? "Updating..." : "Update Order"}
              </Button>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shipping_amount === 0 ? "Free" : formatCurrency(order.shipping_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.payments.map((payment) => (
                  <div key={payment.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span>Method</span>
                      <span className="capitalize">{payment.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway</span>
                      <span className="capitalize">{payment.gateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount</span>
                      <span>{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge variant="outline" className="capitalize">
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Customer Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Customer Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
