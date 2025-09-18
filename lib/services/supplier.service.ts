import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const supplierService = {
  async getAllSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select(`
        *,
        purchase_orders(count),
        purchase_order_items(
          total_price.sum()
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },

  async createSupplier(supplierData: any) {
    const { data, error } = await supabase.from("suppliers").insert([supplierData]).select().single()

    if (error) throw error
    return data
  },

  async updateSupplier(id: string, supplierData: any) {
    const { data, error } = await supabase.from("suppliers").update(supplierData).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async deleteSupplier(id: string) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) throw error
  },

  async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from("suppliers")
      .select(`
        *,
        purchase_orders(
          *,
          purchase_order_items(*)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  async updateSupplierRating(id: string, rating: number) {
    const { data, error } = await supabase.from("suppliers").update({ rating }).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async getSupplierPerformance(id: string) {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        purchase_order_items(*)
      `)
      .eq("supplier_id", id)
      .order("order_date", { ascending: false })

    if (error) throw error
    return data
  },
}
