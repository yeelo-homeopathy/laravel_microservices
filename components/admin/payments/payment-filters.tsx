"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface Payment {
  id: string
  status: string
  gateway: string
  currency: string
  created_at: string
}

interface PaymentFiltersProps {
  payments: Payment[]
  onFilter: (filtered: Payment[]) => void
}

export function PaymentFilters({ payments, onFilter }: PaymentFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [gatewayFilter, setGatewayFilter] = useState<string>("")
  const [currencyFilter, setCurrencyFilter] = useState<string>("")
  const [dateFilter, setDateFilter] = useState<string>("")

  // Get unique values for filter options
  const statuses = [...new Set(payments.map((p) => p.status))]
  const gateways = [...new Set(payments.map((p) => p.gateway))]
  const currencies = [...new Set(payments.map((p) => p.currency))]

  useEffect(() => {
    applyFilters()
  }, [statusFilter, gatewayFilter, currencyFilter, dateFilter, payments])

  const applyFilters = () => {
    let filtered = payments

    if (statusFilter) {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (gatewayFilter) {
      filtered = filtered.filter((payment) => payment.gateway === gatewayFilter)
    }

    if (currencyFilter) {
      filtered = filtered.filter((payment) => payment.currency === currencyFilter)
    }

    if (dateFilter) {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          break
      }

      if (dateFilter !== "") {
        filtered = filtered.filter((payment) => new Date(payment.created_at) >= filterDate)
      }
    }

    onFilter(filtered)
  }

  const clearFilters = () => {
    setStatusFilter("")
    setGatewayFilter("")
    setCurrencyFilter("")
    setDateFilter("")
  }

  const hasActiveFilters = statusFilter || gatewayFilter || currencyFilter || dateFilter

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-statuses">All Statuses</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Gateway" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-gateways">All Gateways</SelectItem>
          {gateways.map((gateway) => (
            <SelectItem key={gateway} value={gateway}>
              {gateway.charAt(0).toUpperCase() + gateway.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-currencies">All</SelectItem>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-time">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">Last Week</SelectItem>
          <SelectItem value="month">Last Month</SelectItem>
          <SelectItem value="quarter">Last Quarter</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      {hasActiveFilters && (
        <div className="flex gap-1">
          {statusFilter && <Badge variant="secondary">Status: {statusFilter}</Badge>}
          {gatewayFilter && <Badge variant="secondary">Gateway: {gatewayFilter}</Badge>}
          {currencyFilter && <Badge variant="secondary">Currency: {currencyFilter}</Badge>}
          {dateFilter && <Badge variant="secondary">Date: {dateFilter}</Badge>}
        </div>
      )}
    </div>
  )
}
</merged_code>
