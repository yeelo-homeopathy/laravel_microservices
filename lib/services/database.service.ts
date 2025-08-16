import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type Tables = Database["public"]["Tables"]
type Product = Tables["products"]["Row"]
type Order = Tables["orders"]["Row"]
type Profile = Tables["profiles"]["Row"]
type Category = Tables["categories"]["Row"]

export class DatabaseService {
  private supabase = createClient()

  // Product operations
  async getProducts(filters?: {
    category?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase.from("products").select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)

    if (filters?.category) {
      query = query.eq("category_id", filters.category)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  async getProduct(id: string) {
    const { data, error } = await this.supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          description
        ),
        inventory_movements (
          id,
          movement_type,
          quantity,
          reason,
          created_at
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  async createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase.from("products").insert(product).select().single()

    if (error) throw error
    return data
  }

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await this.supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Order operations
  async getOrders(filters?: {
    user_id?: string
    status?: string
    payment_status?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase.from("orders").select(`
        *,
        profiles (
          id,
          first_name,
          last_name,
          email
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          product_snapshot
        ),
        payments (
          id,
          amount,
          status,
          payment_method,
          payment_gateway
        )
      `)

    if (filters?.user_id) {
      query = query.eq("user_id", filters.user_id)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.payment_status) {
      query = query.eq("payment_status", filters.payment_status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  async getOrder(id: string) {
    const { data, error } = await this.supabase
      .from("orders")
      .select(`
        *,
        profiles (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price,
          product_snapshot
        ),
        payments (
          id,
          amount,
          currency,
          status,
          payment_method,
          payment_gateway,
          processed_at
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  async createOrder(order: Omit<Order, "id" | "created_at" | "updated_at" | "order_number">) {
    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const { data, error } = await this.supabase
      .from("orders")
      .insert({ ...order, order_number: orderNumber })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateOrder(id: string, updates: Partial<Order>) {
    const { data, error } = await this.supabase
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User/Profile operations
  async getProfiles(filters?: {
    role?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase.from("profiles").select(`
        *,
        user_roles (
          id,
          role_id,
          assigned_at,
          roles (
            id,
            name,
            display_name
          )
        )
      `)

    if (filters?.role) {
      query = query.eq("role", filters.role)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      )
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  async getProfile(id: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select(`
        *,
        user_roles (
          id,
          role_id,
          assigned_at,
          expires_at,
          roles (
            id,
            name,
            display_name,
            permissions
          )
        ),
        addresses (
          id,
          type,
          first_name,
          last_name,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          phone,
          is_default
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  // Category operations
  async getCategories(filters?: {
    parent_id?: string | null
    is_active?: boolean
  }) {
    let query = this.supabase.from("categories").select("*")

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is("parent_id", null)
      } else {
        query = query.eq("parent_id", filters.parent_id)
      }
    }

    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    const { data, error } = await query.order("sort_order", { ascending: true })

    if (error) throw error
    return data
  }

  // Analytics operations
  async getAnalytics(dateRange?: { start: string; end: string }) {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = dateRange?.end || new Date().toISOString()

    // Get order analytics
    const { data: orderStats, error: orderError } = await this.supabase
      .from("orders")
      .select("total_amount, status, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (orderError) throw orderError

    // Get product analytics
    const { data: productStats, error: productError } = await this.supabase
      .from("products")
      .select("id, name, inventory_quantity, status")

    if (productError) throw productError

    // Get user analytics
    const { data: userStats, error: userError } = await this.supabase
      .from("profiles")
      .select("id, role, status, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (userError) throw userError

    return {
      orders: orderStats,
      products: productStats,
      users: userStats,
    }
  }

  // Inventory operations
  async getInventoryMovements(productId?: string, limit = 50) {
    let query = this.supabase.from("inventory_movements").select(`
        *,
        products (
          id,
          name,
          sku
        )
      `)

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit)

    if (error) throw error
    return data
  }

  async createInventoryMovement(movement: {
    product_id: string
    movement_type: "in" | "out" | "adjustment"
    quantity: number
    reason: string
    reference_type?: string
    reference_id?: string
    cost_per_unit?: number
    created_by: string
  }) {
    const { data, error } = await this.supabase.from("inventory_movements").insert(movement).select().single()

    if (error) throw error

    // Update product inventory
    const { data: product } = await this.supabase
      .from("products")
      .select("inventory_quantity")
      .eq("id", movement.product_id)
      .single()

    if (product) {
      const newQuantity =
        movement.movement_type === "out"
          ? product.inventory_quantity - movement.quantity
          : product.inventory_quantity + movement.quantity

      await this.supabase
        .from("products")
        .update({
          inventory_quantity: Math.max(0, newQuantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", movement.product_id)
    }

    return data
  }

  // Application settings
  async getSettings(category?: string) {
    let query = this.supabase.from("application_settings").select("*")

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("key")

    if (error) throw error
    return data
  }

  async getSetting(key: string) {
    const { data, error } = await this.supabase.from("application_settings").select("*").eq("key", key).single()

    if (error) throw error
    return data
  }

  async updateSetting(key: string, value: string) {
    const { data, error } = await this.supabase
      .from("application_settings")
      .update({
        value,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const db = new DatabaseService()
