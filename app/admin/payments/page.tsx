"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentsTable } from "@/components/admin/payments/payments-table"
import { PaymentFilters } from "@/components/admin/payments/payment-filters"
import { PaymentStats } from "@/components/admin/payments/payment-stats"
import { RefundDialog } from "@/components/admin/payments/refund-dialog"
import { paymentService, formatCurrency } from "@/lib/services/payment.service"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Download, RefreshCw } from "lucide-react"

interface Payment {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  status: string
  gateway: string
  payment_method: string
  gateway_payment_id: string
  created_at: string
  processed_at: string
  user_profiles?: {
    full_name: string
    email: string
  }
  orders?: {
    order_number: string
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const { toast } = useToast()

  const supabase = createClient()

  useEffect(() => {
    loadPayments()
    loadAnalytics()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm])

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          user_profiles!inner(full_name, email),
          orders!inner(order_number)
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error("Error loading payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const dateRange = {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        to: new Date().toISOString(),
      }

      const analyticsData = await paymentService.getPaymentAnalytics(dateRange)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.gateway_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredPayments(filtered)
  }

  const handleRefund = async (paymentId: string, amount?: number, reason?: string) => {
    try {
      const result = await paymentService.processRefund(paymentId, amount, reason)

      if (result.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
        })
        loadPayments() // Reload to show updated status
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process refund",
        variant: "destructive",
      })
    }
  }

  const exportPayments = () => {
    const csvContent = [
      ["Payment ID", "Order Number", "Customer", "Amount", "Status", "Gateway", "Date"].join(","),
      ...filteredPayments.map((payment) =>
        [
          payment.gateway_payment_id,
          payment.orders?.order_number,
          payment.user_profiles?.full_name,
          formatCurrency(payment.amount, payment.currency),
          payment.status,
          payment.gateway,
          new Date(payment.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">Monitor and manage all payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPayments}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && <PaymentStats analytics={analytics} />}

      {/* Main Content */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search payments by ID, order, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <PaymentFilters payments={payments} onFilter={setFilteredPayments} />
          </div>

          {/* Payments Table */}
          <PaymentsTable
            payments={filteredPayments}
            onRefund={(payment) => {
              setSelectedPayment(payment)
              setRefundDialogOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Refund Management</CardTitle>
              <CardDescription>Process and track payment refunds</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Refund management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>Detailed payment performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
                        <div className="text-sm text-muted-foreground">Total Transactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.failedTransactions}</div>
                        <div className="text-sm text-muted-foreground">Failed Payments</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading analytics...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      {selectedPayment && (
        <RefundDialog
          payment={selectedPayment}
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          onRefund={handleRefund}
        />
      )}
    </div>
  )
}
