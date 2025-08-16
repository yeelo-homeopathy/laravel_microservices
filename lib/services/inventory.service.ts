"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface InventoryItem {
  id: string
  product_id: string
  sku: string
  name: string
  description?: string
  category?: string
  brand?: string
  weight?: number
  dimensions?: any
  storage_type: "standard" | "refrigerated" | "frozen" | "hazmat"
  storage_conditions?: any
  lot_tracking: boolean
  serial_tracking: boolean
  expiry_tracking: boolean
  unit_cost?: number
  average_cost?: number
  last_cost?: number
  is_active: boolean
  is_sellable: boolean
  created_at: string
  updated_at: string
}

export interface StockLevel {
  id: string
  product_id: string
  warehouse_id?: string
  on_hand: number
  available: number
  reserved: number
  allocated: number
  in_transit: number
  damaged: number
  reorder_point: number
  reorder_quantity: number
  max_stock_level?: number
  bin_location?: string
  zone?: string
  aisle?: string
  shelf?: string
  last_movement_at?: string
  last_count_at?: string
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  warehouse_id?: string
  movement_type: "inbound" | "outbound" | "transfer" | "adjustment" | "return" | "damage" | "loss" | "found"
  movement_reason?: string
  quantity: number
  unit_cost?: number
  total_cost?: number
  quantity_before: number
  quantity_after: number
  reference_type?: string
  reference_id?: string
  reference_number?: string
  batch_number?: string
  lot_number?: string
  serial_number?: string
  expiry_date?: string
  from_location?: string
  to_location?: string
  user_id?: string
  user_name?: string
  notes?: string
  metadata?: any
  movement_date: string
  created_at: string
}

export interface LowStockAlert {
  product_id: string
  product_name: string
  sku: string
  current_stock: number
  reorder_point: number
  reorder_quantity: number
  warehouse_id?: string
  warehouse_name?: string
  days_of_stock?: number
  status: "critical" | "low" | "warning"
}

export async function getInventoryOverview() {
  const supabase = createClient()

  // Get total products with inventory tracking
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, sku, inventory_quantity, low_stock_threshold, track_inventory, status")
    .eq("track_inventory", true)
    .eq("status", "active")

  if (productsError) {
    throw new Error(`Failed to fetch inventory overview: ${productsError.message}`)
  }

  // Calculate inventory metrics
  const totalProducts = products?.length || 0
  const inStockProducts = products?.filter((p) => p.inventory_quantity > 0).length || 0
  const outOfStockProducts = products?.filter((p) => p.inventory_quantity <= 0).length || 0
  const lowStockProducts =
    products?.filter((p) => p.inventory_quantity > 0 && p.inventory_quantity <= p.low_stock_threshold).length || 0

  const totalInventoryValue = products?.reduce((sum, p) => sum + p.inventory_quantity, 0) || 0

  // Get recent movements
  const { data: recentMovements } = await supabase
    .from("inventory_movements")
    .select(`
      *,
      products (
        name,
        sku
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  return {
    totalProducts,
    inStockProducts,
    outOfStockProducts,
    lowStockProducts,
    totalInventoryValue,
    recentMovements: recentMovements || [],
  }
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const supabase = createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, inventory_quantity, low_stock_threshold")
    .eq("track_inventory", true)
    .eq("status", "active")
    .lte("inventory_quantity", supabase.rpc("low_stock_threshold"))

  if (error) {
    throw new Error(`Failed to fetch low stock alerts: ${error.message}`)
  }

  return (
    products?.map((product) => {
      const stockRatio = product.inventory_quantity / product.low_stock_threshold
      let status: LowStockAlert["status"] = "warning"

      if (product.inventory_quantity <= 0) {
        status = "critical"
      } else if (stockRatio <= 0.5) {
        status = "critical"
      } else if (stockRatio <= 1) {
        status = "low"
      }

      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        current_stock: product.inventory_quantity,
        reorder_point: product.low_stock_threshold,
        reorder_quantity: product.low_stock_threshold * 2, // Default reorder quantity
        status,
      }
    }) || []
  )
}

export async function getInventoryMovements(filters?: {
  product_id?: string
  movement_type?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("inventory_movements").select(`
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

  // Apply filters
  if (filters?.product_id) {
    query = query.eq("product_id", filters.product_id)
  }

  if (filters?.movement_type) {
    query = query.eq("movement_type", filters.movement_type)
  }

  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to)
  }

  // Pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to).order("created_at", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch inventory movements: ${error.message}`)
  }

  return {
    movements: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function createStockAdjustment(adjustmentData: {
  product_id: string
  quantity_change: number
  reason: string
  notes?: string
  unit_cost?: number
}) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get current product inventory
  const { data: product } = await supabase
    .from("products")
    .select("inventory_quantity, name, sku")
    .eq("id", adjustmentData.product_id)
    .single()

  if (!product) {
    throw new Error("Product not found")
  }

  const quantityBefore = product.inventory_quantity
  const quantityAfter = quantityBefore + adjustmentData.quantity_change

  if (quantityAfter < 0) {
    throw new Error("Adjustment would result in negative inventory")
  }

  // Create inventory movement record
  const { data: movement, error: movementError } = await supabase
    .from("inventory_movements")
    .insert({
      product_id: adjustmentData.product_id,
      movement_type: "adjustment",
      quantity: Math.abs(adjustmentData.quantity_change),
      reason: adjustmentData.reason,
      unit_cost: adjustmentData.unit_cost,
      total_cost: adjustmentData.unit_cost ? adjustmentData.unit_cost * Math.abs(adjustmentData.quantity_change) : null,
      created_by: user.id,
      reference_type: "manual_adjustment",
      notes: adjustmentData.notes,
    })
    .select()
    .single()

  if (movementError) {
    throw new Error(`Failed to create inventory movement: ${movementError.message}`)
  }

  // Update product inventory
  const { error: updateError } = await supabase
    .from("products")
    .update({ inventory_quantity: quantityAfter })
    .eq("id", adjustmentData.product_id)

  if (updateError) {
    throw new Error(`Failed to update product inventory: ${updateError.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "inventory_adjusted",
    resource_type: "product",
    resource_id: adjustmentData.product_id,
    old_values: { inventory_quantity: quantityBefore },
    new_values: { inventory_quantity: quantityAfter, reason: adjustmentData.reason },
  })

  revalidatePath("/admin/inventory")
  return movement
}

export async function bulkStockAdjustment(
  adjustments: Array<{
    product_id: string
    quantity_change: number
    reason: string
    notes?: string
    unit_cost?: number
  }>,
) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  const results = []
  const errors = []

  for (const adjustment of adjustments) {
    try {
      const result = await createStockAdjustment(adjustment)
      results.push(result)
    } catch (error) {
      errors.push({ product_id: adjustment.product_id, error: error.message })
    }
  }

  return { results, errors }
}

export async function getInventoryValuation() {
  const supabase = createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, inventory_quantity, cost_price, price")
    .eq("track_inventory", true)
    .eq("status", "active")
    .gt("inventory_quantity", 0)

  if (error) {
    throw new Error(`Failed to fetch inventory valuation: ${error.message}`)
  }

  const valuation = products?.map((product) => {
    const costValue = (product.cost_price || 0) * product.inventory_quantity
    const retailValue = product.price * product.inventory_quantity
    const margin = retailValue - costValue
    const marginPercent = costValue > 0 ? (margin / costValue) * 100 : 0

    return {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      quantity: product.inventory_quantity,
      unit_cost: product.cost_price || 0,
      unit_price: product.price,
      cost_value: costValue,
      retail_value: retailValue,
      margin,
      margin_percent: marginPercent,
    }
  })

  const totalCostValue = valuation?.reduce((sum, item) => sum + item.cost_value, 0) || 0
  const totalRetailValue = valuation?.reduce((sum, item) => sum + item.retail_value, 0) || 0
  const totalMargin = totalRetailValue - totalCostValue
  const totalMarginPercent = totalCostValue > 0 ? (totalMargin / totalCostValue) * 100 : 0

  return {
    items: valuation || [],
    summary: {
      total_cost_value: totalCostValue,
      total_retail_value: totalRetailValue,
      total_margin: totalMargin,
      total_margin_percent: totalMarginPercent,
      total_items: valuation?.length || 0,
    },
  }
}

export async function getInventoryTurnover(days = 90) {
  const supabase = createClient()

  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)

  // Get outbound movements (sales) for the period
  const { data: movements, error } = await supabase
    .from("inventory_movements")
    .select(`
      product_id,
      quantity,
      products (
        name,
        sku,
        inventory_quantity,
        cost_price
      )
    `)
    .eq("movement_type", "outbound")
    .gte("created_at", dateFrom.toISOString())

  if (error) {
    throw new Error(`Failed to fetch inventory turnover: ${error.message}`)
  }

  // Group by product and calculate turnover
  const productTurnover = new Map()

  movements?.forEach((movement) => {
    const productId = movement.product_id
    if (!productTurnover.has(productId)) {
      productTurnover.set(productId, {
        product_id: productId,
        product_name: movement.products.name,
        sku: movement.products.sku,
        current_stock: movement.products.inventory_quantity,
        cost_price: movement.products.cost_price || 0,
        total_sold: 0,
      })
    }

    const product = productTurnover.get(productId)
    product.total_sold += movement.quantity
  })

  // Calculate turnover metrics
  const turnoverData = Array.from(productTurnover.values()).map((product) => {
    const averageInventory = (product.current_stock + product.total_sold) / 2
    const turnoverRate = averageInventory > 0 ? product.total_sold / averageInventory : 0
    const daysOfInventory = turnoverRate > 0 ? days / turnoverRate : 0

    return {
      ...product,
      average_inventory: averageInventory,
      turnover_rate: turnoverRate,
      days_of_inventory: daysOfInventory,
      velocity: turnoverRate > 2 ? "fast" : turnoverRate > 1 ? "medium" : "slow",
    }
  })

  return turnoverData.sort((a, b) => b.turnover_rate - a.turnover_rate)
}

export async function setReorderPoint(productId: string, reorderPoint: number, reorderQuantity: number) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      low_stock_threshold: reorderPoint,
      // Note: reorder_quantity would need to be added to products table
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to set reorder point: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "reorder_point_updated",
    resource_type: "product",
    resource_id: productId,
    new_values: { reorder_point: reorderPoint, reorder_quantity: reorderQuantity },
  })

  revalidatePath("/admin/inventory")
  return data
}

export async function getInventoryForecast(productId: string, days = 30) {
  const supabase = createClient()

  // Get historical sales data
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days * 2) // Look back twice as far for better prediction

  const { data: movements, error } = await supabase
    .from("inventory_movements")
    .select("quantity, created_at")
    .eq("product_id", productId)
    .eq("movement_type", "outbound")
    .gte("created_at", dateFrom.toISOString())
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch inventory forecast: ${error.message}`)
  }

  // Get current stock
  const { data: product } = await supabase
    .from("products")
    .select("inventory_quantity, low_stock_threshold")
    .eq("id", productId)
    .single()

  if (!product) {
    throw new Error("Product not found")
  }

  // Calculate daily average sales
  const totalSold = movements?.reduce((sum, m) => sum + m.quantity, 0) || 0
  const dailyAverage = totalSold / (days * 2)

  // Forecast future stock levels
  const forecast = []
  let currentStock = product.inventory_quantity

  for (let day = 1; day <= days; day++) {
    currentStock -= dailyAverage
    const date = new Date()
    date.setDate(date.getDate() + day)

    forecast.push({
      date: date.toISOString().split("T")[0],
      projected_stock: Math.max(0, Math.round(currentStock)),
      daily_demand: Math.round(dailyAverage),
      status: currentStock <= 0 ? "stockout" : currentStock <= product.low_stock_threshold ? "low" : "normal",
    })
  }

  // Calculate when stock will run out
  const stockoutDay = forecast.find((f) => f.projected_stock <= 0)
  const daysUntilStockout = stockoutDay ? forecast.indexOf(stockoutDay) + 1 : null

  return {
    current_stock: product.inventory_quantity,
    daily_average_demand: Math.round(dailyAverage * 100) / 100,
    days_until_stockout: daysUntilStockout,
    reorder_point: product.low_stock_threshold,
    forecast,
  }
}
