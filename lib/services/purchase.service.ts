import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const purchaseService = {
  async getAllPurchaseOrders() {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        suppliers(name),
        purchase_order_items(
          *,
          products(name, brand_id),
          brands(name)
        )
      `)
      .order("order_date", { ascending: false })

    if (error) throw error

    return data.map((po) => ({
      ...po,
      supplier_name: po.suppliers?.name || "Unknown Supplier",
      items: po.purchase_order_items || [],
    }))
  },

  async createPurchaseOrder(orderData: any) {
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert([
        {
          po_number: orderData.po_number,
          supplier_id: orderData.supplier_id,
          order_date: orderData.order_date,
          expected_delivery: orderData.expected_delivery,
          status: "draft",
          total_amount: orderData.total_amount,
          tax_amount: orderData.tax_amount,
          grand_total: orderData.grand_total,
          notes: orderData.notes,
        },
      ])
      .select()
      .single()

    if (poError) throw poError

    // Insert purchase order items
    const items = orderData.items.map((item: any) => ({
      ...item,
      purchase_order_id: po.id,
    }))

    const { error: itemsError } = await supabase.from("purchase_order_items").insert(items)

    if (itemsError) throw itemsError

    return po
  },

  async updatePurchaseOrderStatus(id: string, status: string) {
    const { data, error } = await supabase.from("purchase_orders").update({ status }).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async receivePurchaseOrder(id: string, receivedItems: any[]) {
    // Update received quantities
    for (const item of receivedItems) {
      await supabase
        .from("purchase_order_items")
        .update({
          received_quantity: item.received_quantity,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
        })
        .eq("id", item.id)

      // Update inventory
      await supabase.from("inventory_batches").insert([
        {
          product_id: item.product_id,
          batch_number: item.batch_number,
          quantity: item.received_quantity,
          purchase_price: item.unit_price,
          expiry_date: item.expiry_date,
          supplier_id: item.supplier_id,
          purchase_order_id: id,
        },
      ])
    }

    // Check if all items are fully received
    const { data: poItems } = await supabase
      .from("purchase_order_items")
      .select("quantity, received_quantity")
      .eq("purchase_order_id", id)

    const allReceived = poItems?.every((item) => item.received_quantity >= item.quantity)
    const partialReceived = poItems?.some((item) => item.received_quantity > 0)

    const newStatus = allReceived ? "received" : partialReceived ? "partial" : "confirmed"

    return this.updatePurchaseOrderStatus(id, newStatus)
  },

  async getPurchaseOrderById(id: string) {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        suppliers(*),
        purchase_order_items(
          *,
          products(*, brands(*))
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async generatePONumber() {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("po_number")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw error

    const lastPO = data[0]
    if (!lastPO) return "PO-001"

    const lastNumber = Number.parseInt(lastPO.po_number.split("-")[1])
    return `PO-${String(lastNumber + 1).padStart(3, "0")}`
  },
}
