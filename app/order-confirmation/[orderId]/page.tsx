"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Package, Mail, Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/services/payment.service"

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    // Mock order details - in real app, fetch from API
    setOrderDetails({
      id: orderId,
      orderNumber: `ORD-${orderId.slice(-8).toUpperCase()}`,
      status: "confirmed",
      total: 72997, // $729.97 in cents
      items: [
        {
          id: "1",
          name: "Premium Wireless Headphones",
          price: 29999,
          quantity: 1,
          image: "/wireless-headphones.png",
        },
        {
          id: "2",
          name: "Smart Fitness Watch",
          price: 19999,
          quantity: 2,
          image: "/fitness-watch.png",
        },
      ],
      shippingAddress: {
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US",
      },
      estimatedDelivery: "3-5 business days",
      trackingNumber: null,
    })
  }, [orderId])

  if (!orderDetails) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Loading order details...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">Thank you for your purchase. Your order has been successfully placed.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Summary</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Order #{orderDetails.orderNumber} • Placed on {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Delivery Address</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>{orderDetails.shippingAddress.street}</p>
                    <p>
                      {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state}{" "}
                      {orderDetails.shippingAddress.zipCode}
                    </p>
                    <p>{orderDetails.shippingAddress.country}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-1">Estimated Delivery</h4>
                  <p className="text-sm text-muted-foreground">{orderDetails.estimatedDelivery}</p>
                </div>

                {orderDetails.trackingNumber && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-1">Tracking Number</h4>
                      <p className="text-sm font-mono">{orderDetails.trackingNumber}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-transparent" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email Receipt
              </Button>

              <Button className="w-full bg-transparent" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>

              <Link href="/orders" className="block">
                <Button className="w-full bg-transparent" variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Track Order
                </Button>
              </Link>

              <Separator />

              <Link href="/products" className="block">
                <Button className="w-full">
                  Continue Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Order Confirmed</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                    <p className="text-xs text-muted-foreground">1-2 business days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Shipped</p>
                    <p className="text-xs text-muted-foreground">2-3 business days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-xs text-muted-foreground">3-5 business days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
