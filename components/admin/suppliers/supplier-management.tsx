"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Phone, Mail, MapPin, Star, AlertTriangle } from "lucide-react"
import { supplierService } from "@/lib/services/supplier.service"

interface Supplier {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  gstin: string
  pan: string
  supplier_type: "manufacturer" | "distributor" | "wholesaler" | "importer"
  payment_terms: number
  credit_limit: number
  rating: number
  status: "active" | "inactive" | "blacklisted"
  created_at: string
  total_purchases: number
  outstanding_amount: number
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    supplier_type: "distributor",
    payment_terms: 30,
    credit_limit: 0,
    rating: 5,
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAllSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error("Error loading suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedSupplier) {
        await supplierService.updateSupplier(selectedSupplier.id, formData)
      } else {
        await supplierService.createSupplier(formData)
      }
      await loadSuppliers()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving supplier:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      pan: "",
      supplier_type: "distributor",
      payment_terms: 30,
      credit_limit: 0,
      rating: 5,
    })
    setSelectedSupplier(null)
  }

  const editSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      gstin: supplier.gstin,
      pan: supplier.pan,
      supplier_type: supplier.supplier_type,
      payment_terms: supplier.payment_terms,
      credit_limit: supplier.credit_limit,
      rating: supplier.rating,
    })
    setIsDialogOpen(true)
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || supplier.supplier_type === filterType
    return matchesSearch && matchesType
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-yellow-100 text-yellow-800",
      blacklisted: "bg-red-100 text-red-800",
    }
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      manufacturer: "bg-blue-100 text-blue-800",
      distributor: "bg-purple-100 text-purple-800",
      wholesaler: "bg-orange-100 text-orange-800",
      importer: "bg-teal-100 text-teal-800",
    }
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading suppliers...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendor relationships</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
              <DialogDescription>
                {selectedSupplier ? "Update supplier information" : "Enter supplier details to add them to your system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact Details</TabsTrigger>
                  <TabsTrigger value="business">Business Terms</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Supplier Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Contact Person *</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier_type">Supplier Type</Label>
                      <Select
                        value={formData.supplier_type}
                        onValueChange={(value) => setFormData({ ...formData, supplier_type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="wholesaler">Wholesaler</SelectItem>
                          <SelectItem value="importer">Importer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating (1-5)</Label>
                      <Select
                        value={formData.rating.toString()}
                        onValueChange={(value) => setFormData({ ...formData, rating: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Star</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gstin">GSTIN</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pan">PAN</Label>
                      <Input
                        id="pan"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                        placeholder="AAAAA0000A"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                      <Input
                        id="payment_terms"
                        type="number"
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: Number.parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedSupplier ? "Update Supplier" : "Add Supplier"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                <SelectItem value="importer">Importer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
          <CardDescription>Manage your supplier database and relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-muted-foreground">{supplier.contact_person}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(supplier.supplier_type)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {supplier.phone}
                      </div>
                      {supplier.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {supplier.city}, {supplier.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {supplier.rating}/5
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">₹{supplier.outstanding_amount?.toLocaleString() || "0"}</div>
                      {supplier.outstanding_amount > supplier.credit_limit && (
                        <div className="flex items-center text-red-600 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Over Limit
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => editSupplier(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
