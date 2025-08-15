"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/services/payment.service"
import { AlertCircle } from "lucide-react"

interface Payment {
  id: string
  amount: number
  currency: string
  gateway_payment_id: string
  user_profiles?: {
    full_name: string
    email: string
  }
  orders?: {
    order_number: string
  }
}

interface RefundDialogProps {
  payment: Payment
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefund: (paymentId: string, amount?: number, reason?: string) => void
}

export function RefundDialog({ payment, open, onOpenChange, onRefund }: RefundDialogProps) {
  const [refundAmount, setRefundAmount] = useState(payment.amount)
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRefund = async () => {
    setIsProcessing(true)
    try {
      await onRefund(payment.id, refundAmount === payment.amount ? undefined : refundAmount, reason || undefined)
      onOpenChange(false)
      // Reset form
      setRefundAmount(payment.amount)
      setReason("")
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsProcessing(false)
    }
  }

  const isPartialRefund = refundAmount < payment.amount
  const refundAmountInCents = Math.round(refundAmount * 100)
  const maxRefundInCents = payment.amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>Refund payment for order {payment.orders?.order_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Customer:</span>
              <span className="text-sm font-medium">{payment.user_profiles?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Original Amount:</span>
              <span className="text-sm font-medium">{formatCurrency(payment.amount, payment.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment ID:</span>
              <span className="text-sm font-mono">{payment.gateway_payment_id}</span>
            </div>
          </div>

          {/* Refund Amount */}
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="refund-amount"
                type="number"
                min="0"
                max={payment.amount / 100}
                step="0.01"
                value={refundAmount / 100}
                onChange={(e) => setRefundAmount(Math.round(Number.parseFloat(e.target.value) * 100))}
                className="pl-8"
              />
            </div>
            {isPartialRefund && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                This is a partial refund
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason (Optional)</Label>
            <Textarea
              id="refund-reason"
              placeholder="Enter reason for refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Important:</p>
                <p>
                  This action cannot be undone. The refund will be processed through the original payment method and may
                  take 3-5 business days to appear on the customer's statement.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleRefund}
            disabled={isProcessing || refundAmount <= 0 || refundAmount > maxRefundInCents}
          >
            {isProcessing ? "Processing..." : `Refund ${formatCurrency(refundAmount, payment.currency)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
