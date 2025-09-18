"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getBatches(filters?: {
  product_id?: string
  expiry_status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("product_batches").select(`
      *,
      homeopathy_products (
        name,
        brands (
          name
        )
      ),
      suppliers (
        name
      )
    `)

  // Apply filters
  if (filters?.product_id) {
    query = query.eq("product_id", filters.product_id)
  }

  if (filters?.search) {
    query = query.or(`batch_number.ilike.%${filters.search}%,homeopathy_products.name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order("expiry_date", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch batches: ${error.message}`)
  }

  // Calculate expiry status and days to expiry
  const batchesWithStatus = (data || []).map((batch) => {
    const today = new Date()
    const expiryDate = new Date(batch.expiry_date)
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let expiryStatus = "fresh"
    if (daysToExpiry <= 0) {
      expiryStatus = "expired"
    } else if (daysToExpiry <= 30) {
      expiryStatus = "near_expiry"
    }

    return {
      ...batch,
      product_name: batch.homeopathy_products?.name || "Unknown Product",
      brand_name: batch.homeopathy_products?.brands?.name || "Unknown Brand",
      supplier_name: batch.suppliers?.name || "Unknown Supplier",
      days_to_expiry: daysToExpiry,
      expiry_status: expiryStatus,
      value_at_cost: batch.quantity_available * batch.purchase_price,
      value_at_selling: batch.quantity_available * batch.selling_price,
    }
  })

  return batchesWithStatus
}

export async function createBatch(batchData: any) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Set initial available quantity to received quantity
  const { data, error } = await supabase
    .from("product_batches")
    .insert({
      ...batchData,
      quantity_available: batchData.quantity_received,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create batch: ${error.message}`)
  }

  // Create initial batch movement record
  await supabase.from("batch_movements").insert({
    batch_id: data.id,
    movement_type: "IN",
    quantity: batchData.quantity_received,
    reference_type: "PURCHASE",
    unit_cost: batchData.purchase_price,
    total_value: batchData.quantity_received * batchData.purchase_price,
    reason: "Initial stock receipt",
    performed_by: user.id,
  })

  revalidatePath("/admin/inventory/batches")
  return data
}

export async function updateBatch(id: string, updates: any) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("product_batches")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update batch: ${error.message}`)
  }

  revalidatePath("/admin/inventory/batches")
  return data
}

export async function getExpiryAlerts() {
  const supabase = createClient()

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from("product_batches")
    .select(`
      *,
      homeopathy_products (
        name,
        brands (
          name
        )
      )
    `)
    .lte("expiry_date", ninetyDaysFromNow.toISOString())
    .gt("quantity_available", 0)
    .eq("is_active", true)
    .order("expiry_date", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch expiry alerts: ${error.message}`)
  }

  // Process alerts and categorize them
  const alerts = (data || []).map((batch) => {
    const expiryDate = new Date(batch.expiry_date)
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let alertType = "expiring_this_month"
    let priority = "low"

    if (daysToExpiry <= 0) {
      alertType = "expired"
      priority = "high"
    } else if (daysToExpiry <= 30) {
      alertType = "expiring_soon"
      priority = "medium"
    }

    return {
      id: `alert_${batch.id}`,
      batch_id: batch.id,
      product_name: batch.homeopathy_products?.name || "Unknown Product",
      brand_name: batch.homeopathy_products?.brands?.name || "Unknown Brand",
      batch_number: batch.batch_number,
      expiry_date: batch.expiry_date,
      days_to_expiry: daysToExpiry,
      quantity_available: batch.quantity_available,
      value_at_cost: batch.quantity_available * batch.purchase_price,
      alert_type: alertType,
      priority,
    }
  })

  return alerts
}

export async function dismissAlert(alertId: string) {
  // In a real implementation, you might want to track dismissed alerts
  // For now, we'll just revalidate the path
  revalidatePath("/admin/inventory/expiry-alerts")
}

export async function createDiscountOffer(batchId: string, discountPercentage: number) {
  const supabase = createClient()

  // Get batch details
  const { data: batch } = await supabase.from("product_batches").select("*").eq("id", batchId).single()

  if (!batch) {
    throw new Error("Batch not found")
  }

  // Calculate discounted price
  const discountedPrice = batch.selling_price * (1 - discountPercentage / 100)

  // Update batch with discounted selling price
  const { error } = await supabase
    .from("product_batches")
    .update({
      selling_price: discountedPrice,
      notes: `${discountPercentage}% discount applied due to approaching expiry`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", batchId)

  if (error) {
    throw new Error(`Failed to create discount offer: ${error.message}`)
  }

  revalidatePath("/admin/inventory/expiry-alerts")
  revalidatePath("/admin/inventory/batches")
}

export async function getBatchMovements(batchId?: string) {
  const supabase = createClient()

  let query = supabase
    .from("batch_movements")
    .select(`
      *,
      product_batches (
        batch_number,
        homeopathy_products (
          name
        )
      ),
      profiles!batch_movements_performed_by_fkey (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  if (batchId) {
    query = query.eq("batch_id", batchId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch batch movements: ${error.message}`)
  }

  return data || []
}
