"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency, getPaymentStatusColor } from "@/lib/services/payment.service"
import { MoreHorizontal, Eye, RefreshCw, AlertCircle } from "lucide-react"

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

interface PaymentsTableProps {
  payments: Payment[]
  onRefund: (payment: Payment) => void
}

export function PaymentsTable({ payments, onRefund }: PaymentsTableProps) {
  const [sortField, setSortField] = useState<keyof Payment>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const sortedPayments = [...payments].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleSort = (field: keyof Payment) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("gateway_payment_id")}>
              Payment ID
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("created_at")}>
              Date
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("amount")}>
              Amount
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
              Status
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("gateway")}>
              Gateway
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-sm">
                {payment.gateway_payment_id || payment.id.slice(0, 8)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(payment.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{payment.user_profiles?.full_name || "Unknown"}</span>
                  <span className="text-sm text-muted-foreground">{payment.user_profiles?.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {payment.orders?.order_number || payment.order_id.slice(0, 8)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getPaymentStatusColor(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{payment.gateway.charAt(0).toUpperCase() + payment.gateway.slice(1)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {payment.status === "completed" && (
                      <DropdownMenuItem onClick={() => onRefund(payment)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Process Refund
                      </DropdownMenuItem>
                    )}
                    {payment.status === "failed" && (
                      <DropdownMenuItem>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Retry Payment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {payments.length === 0 && <div className="text-center py-8 text-muted-foreground">No payments found</div>}
    </div>
  )
}
