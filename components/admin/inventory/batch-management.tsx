"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Calendar, Package, Plus, Search, Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Batch {
  id: string
  product_id: string
  batch_number: string
  manufacturing_date: string
  expiry_date: string
  purchase_price: number
  selling_price: number
  mrp: number
  quantity_received: number
  quantity_available: number
  quantity_sold: number
  supplier_name: string
  product_name: string
  brand_name: string
  days_to_expiry: number
  expiry_status: "fresh" | "near_expiry" | "expired"
  value_at_cost: number
  value_at_selling: number
}

interface BatchManagementProps {
  batches: Batch[]
  onCreateBatch: (batchData: any) => Promise<void>
  onUpdateBatch: (id: string, updates: any) => Promise<void>
}

export function BatchManagement({ batches, onCreateBatch, onUpdateBatch }: BatchManagementProps) {
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>(batches)
  const [searchTerm, setSearchTerm] = useState("")
  const [expiryFilter, setExpiryFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newBatch, setNewBatch] = useState({
    product_id: "",
    batch_number: "",
    manufacturing_date: "",
    expiry_date: "",
    purchase_price: 0,
    selling_price: 0,
    mrp: 0,
    quantity_received: 0,
    supplier_id: "",
    notes: "",
  })

  useEffect(() => {
    let filtered = batches

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (batch) =>
          batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.brand_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Expiry filter
    if (expiryFilter !== "all") {
      filtered = filtered.filter((batch) => batch.expiry_status === expiryFilter)
    }

    setFilteredBatches(filtered)
  }, [batches, searchTerm, expiryFilter])

  const getExpiryBadge = (batch: Batch) => {
    switch (batch.expiry_status) {
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "near_expiry":
        return <Badge variant="secondary">Near Expiry</Badge>
      default:
        return <Badge variant="default">Fresh</Badge>
    }
  }

  const getExpiryStats = () => {
    const expired = batches.filter((b) => b.expiry_status === "expired").length
    const nearExpiry = batches.filter((b) => b.expiry_status === "near_expiry").length
    const fresh = batches.filter((b) => b.expiry_status === "fresh").length

    return { expired, nearExpiry, fresh }
  }

  const stats = getExpiryStats()

  const handleCreateBatch = async () => {
    try {
      await onCreateBatch(newBatch)
      setShowCreateDialog(false)
      setNewBatch({
        product_id: "",
        batch_number: "",
        manufacturing_date: "",
        expiry_date: "",
        purchase_price: 0,
        selling_price: 0,
        mrp: 0,
        quantity_received: 0,
        supplier_id: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error creating batch:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Batch Management</h2>
          <p className="text-muted-foreground">Track product batches with expiry dates and inventory levels</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>Add a new product batch with expiry tracking</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number *</Label>
                <Input
                  id="batch_number"
                  value={newBatch.batch_number}
                  onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                  placeholder="e.g., BT2024001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select
                  value={newBatch.product_id}
                  onValueChange={(value) => setNewBatch({ ...newBatch, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Products would be loaded here */}
                    <SelectItem value="1">Arnica Montana 30C</SelectItem>
                    <SelectItem value="2">Belladonna 200C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
                <Input
                  id="manufacturing_date"
                  type="date"
                  value={newBatch.manufacturing_date}
                  onChange={(e) => setNewBatch({ ...newBatch, manufacturing_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={newBatch.expiry_date}
                  onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={newBatch.purchase_price}
                  onChange={(e) => setNewBatch({ ...newBatch, purchase_price: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={newBatch.selling_price}
                  onChange={(e) => setNewBatch({ ...newBatch, selling_price: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  value={newBatch.mrp}
                  onChange={(e) => setNewBatch({ ...newBatch, mrp: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_received">Quantity Received *</Label>
                <Input
                  id="quantity_received"
                  type="number"
                  value={newBatch.quantity_received}
                  onChange={(e) => setNewBatch({ ...newBatch, quantity_received: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBatch}>Create Batch</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fresh Stock</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fresh}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Expiry</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.nearExpiry}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Batches</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by batch number, product, or brand..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="expiry-filter">Expiry Status</Label>
              <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="fresh">Fresh</SelectItem>
                  <SelectItem value="near_expiry">Near Expiry</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Inventory</CardTitle>
          <CardDescription>Detailed view of all product batches with expiry tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="font-medium">{batch.batch_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {batch.days_to_expiry > 0 ? `${batch.days_to_expiry} days left` : "Expired"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{batch.product_name}</div>
                    </TableCell>
                    <TableCell>{batch.brand_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(batch.expiry_date)}
                      </div>
                    </TableCell>
                    <TableCell>{getExpiryBadge(batch)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{batch.quantity_available}</div>
                      <div className="text-sm text-muted-foreground">of {batch.quantity_received}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(batch.purchase_price)}</TableCell>
                    <TableCell>{formatCurrency(batch.selling_price)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(batch.value_at_cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        Selling: {formatCurrency(batch.value_at_selling)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
