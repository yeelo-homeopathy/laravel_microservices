"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getStockAgingData() {
  const supabase = createClient()

  // First, refresh the stock aging analysis
  await supabase.rpc("calculate_stock_aging")

  const { data, error } = await supabase
    .from("stock_aging")
    .select(`
      *,
      homeopathy_products (
        name,
        brands (
          name
        )
      ),
      product_batches (
        batch_number,
        created_at,
        expiry_date,
        suppliers (
          name
        )
      )
    `)
    .eq("analysis_date", new Date().toISOString().split("T")[0])
    .order("days_in_stock", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch stock aging data: ${error.message}`)
  }

  // Process and enhance the data
  const processedData = (data || []).map((item) => ({
    ...item,
    product_name: item.homeopathy_products?.name || "Unknown Product",
    brand_name: item.homeopathy_products?.brands?.name || "Unknown Brand",
    batch_number: item.product_batches?.batch_number || "Unknown Batch",
    purchase_date: item.product_batches?.created_at || item.created_at,
    expiry_date: item.product_batches?.expiry_date,
    supplier_name: item.product_batches?.suppliers?.name || "Unknown Supplier",
  }))

  return processedData
}

export async function refreshStockAging() {
  const supabase = createClient()

  // Call the stored procedure to recalculate stock aging
  const { error } = await supabase.rpc("calculate_stock_aging")

  if (error) {
    throw new Error(`Failed to refresh stock aging: ${error.message}`)
  }

  revalidatePath("/admin/inventory/aging")
}

export async function createDiscountCampaign(itemIds: string[], discountPercentage: number) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get the stock aging items to find their batch IDs
  const { data: stockItems } = await supabase.from("stock_aging").select("batch_id").in("id", itemIds)

  if (!stockItems || stockItems.length === 0) {
    throw new Error("No items found for discount campaign")
  }

  const batchIds = stockItems.map((item) => item.batch_id)

  // Update the selling prices for these batches
  const { data: batches } = await supabase.from("product_batches").select("*").in("id", batchIds)

  if (batches) {
    for (const batch of batches) {
      const discountedPrice = batch.selling_price * (1 - discountPercentage / 100)

      await supabase
        .from("product_batches")
        .update({
          selling_price: discountedPrice,
          notes: `${discountPercentage}% discount applied for stock aging (was ${batch.selling_price})`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", batch.id)
    }
  }

  // Log the discount campaign
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "discount_campaign_created",
    resource_type: "stock_aging",
    resource_id: itemIds[0], // Use first item as reference
    new_values: {
      discount_percentage: discountPercentage,
      items_count: itemIds.length,
      batch_ids: batchIds,
    },
  })

  revalidatePath("/admin/inventory/aging")
  revalidatePath("/admin/inventory/batches")
}

export async function markAsDeadStock(itemIds: string[]) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Update stock aging items to mark as dead stock
  const { error } = await supabase
    .from("stock_aging")
    .update({
      is_dead_stock: true,
      updated_at: new Date().toISOString(),
    })
    .in("id", itemIds)

  if (error) {
    throw new Error(`Failed to mark items as dead stock: ${error.message}`)
  }

  // Log the action
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "marked_as_dead_stock",
    resource_type: "stock_aging",
    resource_id: itemIds[0],
    new_values: {
      items_count: itemIds.length,
      item_ids: itemIds,
    },
  })

  revalidatePath("/admin/inventory/aging")
}

export async function getInventoryTurnoverReport() {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_inventory_turnover_report")

  if (error) {
    throw new Error(`Failed to fetch inventory turnover report: ${error.message}`)
  }

  return data || []
}

export async function getSlowMovingItemsReport(daysThreshold = 90) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("stock_aging")
    .select(`
      *,
      homeopathy_products (
        name,
        brands (
          name
        )
      ),
      product_batches (
        batch_number,
        selling_price,
        purchase_price
      )
    `)
    .gte("days_in_stock", daysThreshold)
    .eq("analysis_date", new Date().toISOString().split("T")[0])
    .order("days_in_stock", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch slow moving items: ${error.message}`)
  }

  return data || []
}

export async function getHighValueStockReport(valueThreshold = 10000) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("stock_aging")
    .select(`
      *,
      homeopathy_products (
        name,
        brands (
          name
        ),
        is_high_value
      ),
      product_batches (
        batch_number,
        selling_price,
        purchase_price
      )
    `)
    .gte("value_at_cost", valueThreshold)
    .eq("analysis_date", new Date().toISOString().split("T")[0])
    .order("value_at_cost", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch high value stock: ${error.message}`)
  }

  return data || []
}
