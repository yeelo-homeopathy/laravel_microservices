import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const pricingService = {
  async getAllPricingRules() {
    const { data, error } = await supabase
      .from("pricing_rules")
      .select(`
        *,
        brands(name),
        product_categories(name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },

  async createPricingRule(ruleData: any) {
    const { data, error } = await supabase
      .from("pricing_rules")
      .insert([
        {
          ...ruleData,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updatePricingRule(id: string, ruleData: any) {
    const { data, error } = await supabase.from("pricing_rules").update(ruleData).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async getCustomerPricing() {
    // Get base customer type pricing
    const customerTypes = ["retail", "wholesale", "doctor", "pharmacy", "clinic", "distributor"]

    const pricingData = await Promise.all(
      customerTypes.map(async (type) => {
        // Get base discount for customer type
        const { data: baseDiscount } = await supabase
          .from("customer_type_pricing")
          .select("base_discount")
          .eq("customer_type", type)
          .single()

        // Get volume discounts
        const { data: volumeDiscounts } = await supabase
          .from("volume_discounts")
          .select("min_quantity, discount_percentage")
          .eq("customer_type", type)
          .order("min_quantity")

        // Get special rates count
        const { data: specialRates } = await supabase
          .from("customer_special_rates")
          .select("product_id, special_price, margin_percentage")
          .eq("customer_type", type)

        return {
          customer_type: type,
          base_discount: baseDiscount?.base_discount || 0,
          volume_discounts: volumeDiscounts || [],
          special_rates: specialRates || [],
        }
      }),
    )

    return pricingData
  },

  async calculatePrice(productId: string, customerType: string, quantity: number) {
    // Get base product price
    const { data: product } = await supabase.from("products").select("mrp, cost_price").eq("id", productId).single()

    if (!product) throw new Error("Product not found")

    let finalPrice = product.mrp
    let appliedDiscount = 0

    // Check for special rates first
    const { data: specialRate } = await supabase
      .from("customer_special_rates")
      .select("special_price")
      .eq("product_id", productId)
      .eq("customer_type", customerType)
      .single()

    if (specialRate) {
      finalPrice = specialRate.special_price
    } else {
      // Apply pricing rules
      const { data: applicableRules } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("customer_type", customerType)
        .eq("is_active", true)
        .lte("min_quantity", quantity)
        .or(`max_quantity.is.null,max_quantity.gte.${quantity}`)
        .order("discount_value", { ascending: false })
        .limit(1)

      if (applicableRules && applicableRules.length > 0) {
        const rule = applicableRules[0]
        if (rule.discount_type === "percentage") {
          appliedDiscount = (finalPrice * rule.discount_value) / 100
        } else {
          appliedDiscount = rule.discount_value
        }
        finalPrice = finalPrice - appliedDiscount
      }
    }

    // Calculate GST
    const { data: gstRate } = await supabase.from("products").select("gst_rate").eq("id", productId).single()

    const gstAmount = (finalPrice * (gstRate?.gst_rate || 12)) / 100
    const totalPrice = finalPrice + gstAmount

    return {
      base_price: product.mrp,
      discounted_price: finalPrice,
      discount_amount: appliedDiscount,
      gst_rate: gstRate?.gst_rate || 12,
      gst_amount: gstAmount,
      total_price: totalPrice,
      quantity: quantity,
      line_total: totalPrice * quantity,
    }
  },

  async getGSTRates() {
    const { data, error } = await supabase.from("gst_rates").select("*").order("rate")

    if (error) throw error
    return data
  },

  async updateGSTRate(productId: string, gstRate: number) {
    const { data, error } = await supabase
      .from("products")
      .update({ gst_rate: gstRate })
      .eq("id", productId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
