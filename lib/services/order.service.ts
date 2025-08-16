"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { adjustInventory } from "./product.service"

export interface Order {
  id: string
  user_id: string
  order_number: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  payment_status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded"
  fulfillment_status: "unfulfilled" | "partial" | "fulfilled"
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
  tags?: string[]
  metadata?: any
  created_at: string
  updated_at: string
  processed_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot: any
  created_at: string
}

export interface CartItem {
  product_id: string
  variant_id?: string
  quantity: number
  unit_price: number
  product_name: string
  product_image?: string
  product_sku?: string
}

export interface CreateOrderData {
  items: CartItem[]
  billing_address: any
  shipping_address: any
  customer_email: string
  customer_phone?: string
  notes?: string
  shipping_method?: string
  payment_method?: string
}

export async function generateOrderNumber(): Promise<string> {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `ORD-${timestamp}-${random}`
}

export async function calculateOrderTotals(items: CartItem[], shippingMethod?: string) {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  // Calculate tax (example: 10% tax rate)
  const taxRate = 0.1
  const taxAmount = subtotal * taxRate

  // Calculate shipping (example: flat rate or free over $100)
  let shippingAmount = 0
  if (subtotal < 100) {
    shippingAmount = shippingMethod === "express" ? 15 : 10
  }

  const totalAmount = subtotal + taxAmount + shippingAmount

  return {
    subtotal,
    taxAmount,
    shippingAmount,
    totalAmount,
    discountAmount: 0, // Can be implemented later
  }
}

export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Validate items
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Order must contain at least one item")
  }

  // Check inventory availability
  for (const item of orderData.items) {
    const { data: product } = await supabase
      .from("products")
      .select("inventory_quantity, track_inventory, status")
      .eq("id", item.product_id)
      .single()

    if (!product) {
      throw new Error(`Product ${item.product_id} not found`)
    }

    if (product.status !== "active") {
      throw new Error(`Product ${item.product_name} is not available`)
    }

    if (product.track_inventory && product.inventory_quantity < item.quantity) {
      throw new Error(`Insufficient inventory for ${item.product_name}`)
    }
  }

  // Calculate totals
  const totals = await calculateOrderTotals(orderData.items, orderData.shipping_method)

  // Generate order number
  const orderNumber = await generateOrderNumber()

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "pending",
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      shipping_amount: totals.shippingAmount,
      discount_amount: totals.discountAmount,
      total_amount: totals.totalAmount,
      billing_address: orderData.billing_address,
      shipping_address: orderData.shipping_address,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      notes: orderData.notes,
      metadata: {
        shipping_method: orderData.shipping_method,
        payment_method: orderData.payment_method,
      },
    })
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`)
  }

  // Create order items
  const orderItems = orderData.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    product_snapshot: {
      name: item.product_name,
      sku: item.product_sku,
      image: item.product_image,
    },
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) {
    // Rollback order creation
    await supabase.from("orders").delete().eq("id", order.id)
    throw new Error(`Failed to create order items: ${itemsError.message}`)
  }

  // Reserve inventory
  for (const item of orderData.items) {
    try {
      await adjustInventory(item.product_id, -item.quantity, `Reserved for order ${orderNumber}`)
    } catch (error) {
      // Rollback order creation
      await supabase.from("orders").delete().eq("id", order.id)
      throw new Error(`Failed to reserve inventory: ${error}`)
    }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "order_created",
    resource_type: "order",
    resource_id: order.id,
    new_values: { order_number: orderNumber, total_amount: totals.totalAmount },
  })

  revalidatePath("/admin/orders")
  return order
}

export async function updateOrderStatus(orderId: string, status: Order["status"], notes?: string): Promise<Order> {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get current order
  const { data: currentOrder } = await supabase.from("orders").select("*").eq("id", orderId).single()

  if (!currentOrder) {
    throw new Error("Order not found")
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Set timestamp fields based on status
  switch (status) {
    case "confirmed":
      updateData.processed_at = new Date().toISOString()
      break
    case "shipped":
      updateData.shipped_at = new Date().toISOString()
      updateData.fulfillment_status = "fulfilled"
      break
    case "delivered":
      updateData.delivered_at = new Date().toISOString()
      break
    case "cancelled":
      updateData.cancelled_at = new Date().toISOString()
      // Restore inventory
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId)

      if (orderItems) {
        for (const item of orderItems) {
          await adjustInventory(
            item.product_id,
            item.quantity,
            `Restored from cancelled order ${currentOrder.order_number}`,
          )
        }
      }
      break
  }

  if (notes) {
    updateData.internal_notes = notes
  }

  const { data: order, error } = await supabase.from("orders").update(updateData).eq("id", orderId).select().single()

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "order_status_updated",
    resource_type: "order",
    resource_id: orderId,
    old_values: { status: currentOrder.status },
    new_values: { status, notes },
  })

  revalidatePath("/admin/orders")
  return order
}

export async function getOrders(filters?: {
  status?: string
  payment_status?: string
  search?: string
  user_id?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("orders").select(`
      *,
      profiles!orders_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `)

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.payment_status) {
    query = query.eq("payment_status", filters.payment_status)
  }

  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id)
  }

  if (filters?.search) {
    query = query.or(`order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
  }

  // Pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to).order("created_at", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return {
    orders: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getOrder(id: string) {
  const supabase = createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles!orders_user_id_fkey (
        first_name,
        last_name,
        email,
        phone
      ),
      order_items (
        *,
        products (
          name,
          sku,
          images
        )
      ),
      payments (
        *
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch order: ${error.message}`)
  }

  return order
}

export async function getOrdersByUser(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          name,
          images
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch user orders: ${error.message}`)
  }

  return data || []
}

export async function processPayment(orderId: string, paymentData: any) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get order
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single()

  if (!order) {
    throw new Error("Order not found")
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      amount: order.total_amount,
      currency: "USD",
      payment_method: paymentData.method,
      payment_gateway: paymentData.gateway,
      gateway_transaction_id: paymentData.transaction_id,
      status: paymentData.status,
      gateway_response: paymentData.response,
      processed_at: paymentData.status === "completed" ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (paymentError) {
    throw new Error(`Failed to create payment: ${paymentError.message}`)
  }

  // Update order payment status
  const paymentStatus = paymentData.status === "completed" ? "paid" : "failed"
  const orderStatus = paymentData.status === "completed" ? "confirmed" : "pending"

  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      status: orderStatus,
      processed_at: paymentData.status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", orderId)

  revalidatePath("/admin/orders")
  return payment
}

export async function getOrderAnalytics(dateRange?: { from: string; to: string }) {
  const supabase = createClient()

  let query = supabase.from("orders").select("status, total_amount, created_at, payment_status")

  if (dateRange) {
    query = query.gte("created_at", dateRange.from).lte("created_at", dateRange.to)
  }

  const { data: orders, error } = await query

  if (error) {
    throw new Error(`Failed to fetch order analytics: ${error.message}`)
  }

  const analytics = {
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    averageOrderValue: 0,
    ordersByStatus: {} as Record<string, number>,
    revenueByStatus: {} as Record<string, number>,
    paidOrders: orders?.filter((o) => o.payment_status === "paid").length || 0,
    pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
  }

  if (analytics.totalOrders > 0) {
    analytics.averageOrderValue = analytics.totalRevenue / analytics.totalOrders
  }

  // Group by status
  orders?.forEach((order) => {
    analytics.ordersByStatus[order.status] = (analytics.ordersByStatus[order.status] || 0) + 1
    analytics.revenueByStatus[order.status] = (analytics.revenueByStatus[order.status] || 0) + order.total_amount
  })

  return analytics
}
