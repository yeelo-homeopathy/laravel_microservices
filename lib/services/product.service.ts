"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  sku: string
  price: number
  compare_price?: number
  cost_price?: number
  brand?: string
  status: "active" | "draft" | "archived"
  category_id?: string
  inventory_quantity: number
  track_inventory: boolean
  low_stock_threshold: number
  weight?: number
  dimensions?: any
  images?: any
  variants?: any
  attributes?: any
  tags?: string[]
  requires_shipping: boolean
  is_digital: boolean
  tax_class?: string
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  metadata?: any
}

export async function createProduct(productData: Omit<Product, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  // Get current user for created_by field
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Generate slug from name if not provided
  const slug =
    productData.slug ||
    productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  // Validate required fields
  if (!productData.name || !productData.price) {
    throw new Error("Name and price are required")
  }

  // Check for duplicate SKU
  if (productData.sku) {
    const { data: existingSku } = await supabase.from("products").select("id").eq("sku", productData.sku).single()

    if (existingSku) {
      throw new Error("SKU already exists")
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...productData,
      slug,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  // Create inventory movement record for initial stock
  if (productData.track_inventory && productData.inventory_quantity > 0) {
    await supabase.from("inventory_movements").insert({
      product_id: data.id,
      movement_type: "in",
      quantity: productData.inventory_quantity,
      reason: "Initial stock",
      created_by: user.id,
      cost_per_unit: productData.cost_price || 0,
    })
  }

  revalidatePath("/admin/products")
  return data
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get current product for comparison
  const { data: currentProduct } = await supabase.from("products").select("*").eq("id", id).single()

  if (!currentProduct) {
    throw new Error("Product not found")
  }

  // Generate new slug if name changed
  if (updates.name && updates.name !== currentProduct.name) {
    updates.slug = updates.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }

  // Handle inventory changes
  if (updates.inventory_quantity !== undefined && updates.inventory_quantity !== currentProduct.inventory_quantity) {
    const difference = updates.inventory_quantity - currentProduct.inventory_quantity

    await supabase.from("inventory_movements").insert({
      product_id: id,
      movement_type: difference > 0 ? "in" : "out",
      quantity: Math.abs(difference),
      reason: "Manual adjustment",
      created_by: user.id,
      cost_per_unit: updates.cost_price || currentProduct.cost_price || 0,
    })
  }

  revalidatePath("/admin/products")
  return data
}

export async function deleteProduct(id: string) {
  const supabase = createClient()

  // Check if product has orders
  const { data: orderItems } = await supabase.from("order_items").select("id").eq("product_id", id).limit(1)

  if (orderItems && orderItems.length > 0) {
    throw new Error("Cannot delete product with existing orders. Archive instead.")
  }

  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`)
  }

  revalidatePath("/admin/products")
}

export async function getProducts(filters?: {
  category_id?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("products").select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)

  // Apply filters
  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`,
    )
  }

  // Pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to).order("created_at", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return {
    products: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getProduct(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return data
}

export async function createCategory(categoryData: Omit<Category, "id">) {
  const supabase = createClient()

  const slug =
    categoryData.slug ||
    categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...categoryData,
      slug,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`)
  }

  revalidatePath("/admin/categories")
  return data
}

export async function getCategories() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data || []
}

export async function adjustInventory(productId: string, quantity: number, reason: string) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get current product
  const { data: product } = await supabase
    .from("products")
    .select("inventory_quantity, track_inventory")
    .eq("id", productId)
    .single()

  if (!product) {
    throw new Error("Product not found")
  }

  if (!product.track_inventory) {
    throw new Error("Inventory tracking is disabled for this product")
  }

  const newQuantity = product.inventory_quantity + quantity

  if (newQuantity < 0) {
    throw new Error("Insufficient inventory")
  }

  // Update product inventory
  const { error: updateError } = await supabase
    .from("products")
    .update({ inventory_quantity: newQuantity })
    .eq("id", productId)

  if (updateError) {
    throw new Error(`Failed to update inventory: ${updateError.message}`)
  }

  // Record inventory movement
  const { error: movementError } = await supabase.from("inventory_movements").insert({
    product_id: productId,
    movement_type: quantity > 0 ? "in" : "out",
    quantity: Math.abs(quantity),
    reason,
    created_by: user.id,
  })

  if (movementError) {
    throw new Error(`Failed to record inventory movement: ${movementError.message}`)
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin/inventory")
}

export async function getInventoryMovements(productId?: string) {
  const supabase = createClient()

  let query = supabase
    .from("inventory_movements")
    .select(`
      *,
      products (
        name,
        sku
      ),
      profiles!inventory_movements_created_by_fkey (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch inventory movements: ${error.message}`)
  }

  return data || []
}
