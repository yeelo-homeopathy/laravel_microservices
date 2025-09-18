"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Brand Management
export async function getBrands() {
  const supabase = createClient()

  const { data, error } = await supabase.from("brands").select("*").eq("is_active", true).order("name")

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`)
  }

  return data || []
}

export async function createBrand(brandData: {
  name: string
  code: string
  description?: string
  logo_url?: string
  contact_info?: any
}) {
  const supabase = createClient()

  const { data, error } = await supabase.from("brands").insert(brandData).select().single()

  if (error) {
    throw new Error(`Failed to create brand: ${error.message}`)
  }

  revalidatePath("/admin/brands")
  return data
}

// Potency Management
export async function getPotencies() {
  const supabase = createClient()

  const { data, error } = await supabase.from("potencies").select("*").eq("is_active", true).order("sort_order")

  if (error) {
    throw new Error(`Failed to fetch potencies: ${error.message}`)
  }

  return data || []
}

// Customer Types
export async function getCustomerTypes() {
  const supabase = createClient()

  const { data, error } = await supabase.from("customer_types").select("*").eq("is_active", true).order("name")

  if (error) {
    throw new Error(`Failed to fetch customer types: ${error.message}`)
  }

  return data || []
}

// Suppliers
export async function getSuppliers() {
  const supabase = createClient()

  const { data, error } = await supabase.from("suppliers").select("*").eq("is_active", true).order("name")

  if (error) {
    throw new Error(`Failed to fetch suppliers: ${error.message}`)
  }

  return data || []
}

// Homeopathy Product Management
export async function createHomeopathyProduct(productData: any) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Generate SKU if not provided
  if (!productData.sku) {
    const brand = await supabase.from("brands").select("code").eq("id", productData.brand_id).single()
    const potency = await supabase.from("potencies").select("name").eq("id", productData.potency_id).single()

    if (brand.data && potency.data) {
      productData.sku = `${brand.data.code}-${productData.name.substring(0, 3).toUpperCase()}-${potency.data.name}-${productData.pack_size || "STD"}`
    }
  }

  const { data, error } = await supabase
    .from("homeopathy_products")
    .insert({
      ...productData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  revalidatePath("/admin/products")
  return data
}

export async function updateHomeopathyProduct(id: string, updates: any) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("homeopathy_products")
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

  revalidatePath("/admin/products")
  return data
}

export async function getHomeopathyProduct(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("homeopathy_products")
    .select(`
      *,
      brands (
        id,
        name,
        code
      ),
      potencies (
        id,
        name,
        scale
      ),
      categories (
        id,
        name
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return data
}

export async function getHomeopathyProducts(filters?: {
  brand_id?: string
  potency_id?: string
  category_id?: string
  form?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("homeopathy_products").select(`
      *,
      brands (
        id,
        name,
        code
      ),
      potencies (
        id,
        name,
        scale
      ),
      categories (
        id,
        name
      )
    `)

  // Apply filters
  if (filters?.brand_id) {
    query = query.eq("brand_id", filters.brand_id)
  }

  if (filters?.potency_id) {
    query = query.eq("potency_id", filters.potency_id)
  }

  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id)
  }

  if (filters?.form) {
    query = query.eq("form", filters.form)
  }

  if (filters?.status !== undefined) {
    query = query.eq("is_active", filters.status === "active")
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,generic_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,therapeutic_use.ilike.%${filters.search}%`,
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

// Categories (reuse existing)
export async function getCategories() {
  const supabase = createClient()

  const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data || []
}
