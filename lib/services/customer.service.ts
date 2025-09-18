"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCustomers(filters?: {
  customer_type_id?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("profiles").select(`
      *,
      customer_types (
        id,
        name,
        code,
        default_discount_percentage,
        credit_days
      ),
      addresses (
        *
      )
    `)

  // Apply filters
  if (filters?.customer_type_id) {
    query = query.eq("customer_type_id", filters.customer_type_id)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,gst_number.ilike.%${filters.search}%`,
    )
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`)
  }

  // Enhance customer data with order statistics
  const customersWithStats = await Promise.all(
    (data || []).map(async (customer) => {
      // Get order statistics
      const { data: orderStats } = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("user_id", customer.id)

      const totalOrders = orderStats?.length || 0
      const totalSpent = orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const lastOrderDate = orderStats?.length > 0 ? orderStats[0].created_at : null

      return {
        ...customer,
        customer_type_name: customer.customer_types?.name || "Unknown",
        customer_type_code: customer.customer_types?.code || "UNKNOWN",
        total_orders: totalOrders,
        total_spent: totalSpent,
        last_order_date: lastOrderDate,
      }
    }),
  )

  return customersWithStats
}

export async function getCustomerTypes() {
  const supabase = createClient()

  const { data, error } = await supabase.from("customer_types").select("*").eq("is_active", true).order("name")

  if (error) {
    throw new Error(`Failed to fetch customer types: ${error.message}`)
  }

  return data || []
}

export async function createCustomer(customerData: any) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Extract address data
  const { address_line_1, address_line_2, city, state, postal_code, country, ...profileData } = customerData

  // Create customer profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      ...profileData,
      status: "active",
    })
    .select()
    .single()

  if (profileError) {
    throw new Error(`Failed to create customer: ${profileError.message}`)
  }

  // Create address if provided
  if (address_line_1) {
    await supabase.from("addresses").insert({
      user_id: profile.id,
      type: "billing",
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      is_default: true,
    })
  }

  revalidatePath("/admin/customers")
  return profile
}

export async function updateCustomer(id: string, updates: any) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update customer: ${error.message}`)
  }

  revalidatePath("/admin/customers")
  return data
}

export async function updateCreditLimit(id: string, creditLimit: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      credit_limit: creditLimit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update credit limit: ${error.message}`)
  }

  revalidatePath("/admin/customers")
  return data
}

export async function getCustomerOrderHistory(customerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        homeopathy_products (
          name,
          brands (
            name
          )
        )
      )
    `)
    .eq("user_id", customerId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch customer order history: ${error.message}`)
  }

  return data || []
}

export async function getCustomerPaymentHistory(customerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      orders (
        order_number,
        total_amount
      )
    `)
    .eq("orders.user_id", customerId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch customer payment history: ${error.message}`)
  }

  return data || []
}

export async function createCustomerType(typeData: {
  name: string
  code: string
  description?: string
  default_discount_percentage: number
  credit_days: number
}) {
  const supabase = createClient()

  const { data, error } = await supabase.from("customer_types").insert(typeData).select().single()

  if (error) {
    throw new Error(`Failed to create customer type: ${error.message}`)
  }

  revalidatePath("/admin/customers")
  return data
}
