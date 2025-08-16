import { createClient } from "@/lib/supabase/client"

// Payment gateway interfaces for extensibility
interface PaymentGateway {
  processPayment(paymentData: PaymentRequest): Promise<PaymentResult>
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
}

interface PaymentRequest {
  amount: number
  currency: string
  paymentMethodId: string
  orderId: string
  customerId: string
  description?: string
  metadata?: Record<string, any>
}

interface PaymentResult {
  success: boolean
  paymentId: string
  transactionId?: string
  status: "pending" | "completed" | "failed"
  message?: string
  gatewayResponse?: any
}

interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  status: "pending" | "completed" | "failed"
  message?: string
}

interface PaymentStatus {
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded"
  amount: number
  currency: string
  createdAt: string
  updatedAt: string
}

// Mock Stripe Gateway Implementation
class StripeGateway implements PaymentGateway {
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    // In production, integrate with actual Stripe API
    // This is a mock implementation for demonstration
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock success/failure based on amount (for testing)
      const success = paymentData.amount < 999999 // Fail for very large amounts

      return {
        success,
        paymentId: `pi_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        status: success ? "completed" : "failed",
        message: success ? "Payment processed successfully" : "Payment failed - insufficient funds",
      }
    } catch (error) {
      return {
        success: false,
        paymentId: "",
        status: "failed",
        message: "Payment gateway error",
      }
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      return {
        success: true,
        refundId: `re_${Date.now()}`,
        amount: amount || 0,
        status: "completed",
        message: "Refund processed successfully",
      }
    } catch (error) {
      return {
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        message: "Refund failed",
      }
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Mock implementation
    return {
      status: "completed",
      amount: 0,
      currency: "USD",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

// Payment Service Class
export class PaymentService {
  private gateways: Map<string, PaymentGateway> = new Map()

  constructor() {
    // Initialize payment gateways
    this.gateways.set("stripe", new StripeGateway())
    // Add more gateways as needed: PayPal, Square, etc.
  }

  // Process payment through specified gateway
  async processPayment(paymentData: PaymentRequest, gateway = "stripe"): Promise<PaymentResult> {
    const supabase = createClient()

    try {
      const paymentGateway = this.gateways.get(gateway)
      if (!paymentGateway) {
        throw new Error(`Payment gateway ${gateway} not supported`)
      }

      // Create payment record in database
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: paymentData.orderId,
          user_id: paymentData.customerId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_method: paymentData.paymentMethodId,
          gateway: gateway,
          status: "pending",
          description: paymentData.description,
          metadata: paymentData.metadata,
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Process payment through gateway
      const result = await paymentGateway.processPayment(paymentData)

      // Update payment record with result
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          gateway_payment_id: result.paymentId,
          gateway_transaction_id: result.transactionId,
          status: result.status,
          gateway_response: result.gatewayResponse,
          processed_at: result.status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", payment.id)

      if (updateError) throw updateError

      // Log payment activity
      await this.logPaymentActivity(payment.id, "payment_processed", {
        gateway,
        status: result.status,
        amount: paymentData.amount,
      })

      return result
    } catch (error) {
      console.error("Payment processing error:", error)
      return {
        success: false,
        paymentId: "",
        status: "failed",
        message: error instanceof Error ? error.message : "Payment processing failed",
      }
    }
  }

  // Process refund
  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<RefundResult> {
    const supabase = createClient()

    try {
      // Get original payment
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single()

      if (paymentError || !payment) {
        throw new Error("Payment not found")
      }

      if (payment.status !== "completed") {
        throw new Error("Cannot refund non-completed payment")
      }

      const refundAmount = amount || payment.amount
      if (refundAmount > payment.amount) {
        throw new Error("Refund amount cannot exceed original payment amount")
      }

      // Get payment gateway
      const paymentGateway = this.gateways.get(payment.gateway)
      if (!paymentGateway) {
        throw new Error(`Payment gateway ${payment.gateway} not supported`)
      }

      // Process refund through gateway
      const result = await paymentGateway.refundPayment(payment.gateway_payment_id, refundAmount)

      // Create refund record
      const { data: refund, error: refundError } = await supabase
        .from("payment_refunds")
        .insert({
          payment_id: paymentId,
          amount: refundAmount,
          reason: reason || "Customer request",
          status: result.status,
          gateway_refund_id: result.refundId,
          processed_at: result.status === "completed" ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (refundError) throw refundError

      // Update payment status if fully refunded
      if (refundAmount === payment.amount) {
        await supabase.from("payments").update({ status: "refunded" }).eq("id", paymentId)
      }

      // Log refund activity
      await this.logPaymentActivity(paymentId, "refund_processed", {
        refundId: result.refundId,
        amount: refundAmount,
        reason,
      })

      return result
    } catch (error) {
      console.error("Refund processing error:", error)
      return {
        success: false,
        refundId: "",
        amount: 0,
        status: "failed",
        message: error instanceof Error ? error.message : "Refund processing failed",
      }
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(dateRange: { from: string; to: string }) {
    const supabase = createClient()

    try {
      // Get payment statistics
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, currency, status, gateway, created_at")
        .gte("created_at", dateRange.from)
        .lte("created_at", dateRange.to)

      if (error) throw error

      // Calculate analytics
      const totalRevenue = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)

      const totalTransactions = payments.length
      const successfulTransactions = payments.filter((p) => p.status === "completed").length
      const failedTransactions = payments.filter((p) => p.status === "failed").length
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

      // Gateway breakdown
      const gatewayStats = payments.reduce(
        (acc, payment) => {
          if (!acc[payment.gateway]) {
            acc[payment.gateway] = { count: 0, revenue: 0 }
          }
          acc[payment.gateway].count++
          if (payment.status === "completed") {
            acc[payment.gateway].revenue += payment.amount
          }
          return acc
        },
        {} as Record<string, { count: number; revenue: number }>,
      )

      // Daily revenue trend
      const dailyRevenue = payments
        .filter((p) => p.status === "completed")
        .reduce(
          (acc, payment) => {
            const date = payment.created_at.split("T")[0]
            if (!acc[date]) acc[date] = 0
            acc[date] += payment.amount
            return acc
          },
          {} as Record<string, number>,
        )

      return {
        totalRevenue,
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        successRate,
        gatewayStats,
        dailyRevenue,
      }
    } catch (error) {
      console.error("Payment analytics error:", error)
      throw error
    }
  }

  // Get payment methods for user
  async getPaymentMethods(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_payment_methods")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })

    if (error) throw error
    return data
  }

  // Add payment method
  async addPaymentMethod(userId: string, paymentMethodData: any) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_payment_methods")
      .insert({
        user_id: userId,
        type: paymentMethodData.type,
        last_four: paymentMethodData.lastFour,
        brand: paymentMethodData.brand,
        expires_at: paymentMethodData.expiresAt,
        gateway_method_id: paymentMethodData.gatewayMethodId,
        is_default: paymentMethodData.isDefault || false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Private helper methods
  private async logPaymentActivity(paymentId: string, action: string, details: Record<string, any>) {
    const supabase = createClient()

    await supabase.from("activity_logs").insert({
      entity_type: "payment",
      entity_id: paymentId,
      action,
      details,
      created_at: new Date().toISOString(),
    })
  }
}

// Export singleton instance
export const paymentService = new PaymentService()

// Utility functions for formatting
export const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100) // Assuming amounts are stored in cents
}

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50"
    case "pending":
      return "text-yellow-600 bg-yellow-50"
    case "failed":
      return "text-red-600 bg-red-50"
    case "refunded":
      return "text-gray-600 bg-gray-50"
    case "cancelled":
      return "text-gray-600 bg-gray-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}
