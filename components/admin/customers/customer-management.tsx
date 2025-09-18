"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  Building2,
  Stethoscope,
  Store,
  UserPlus,
  Search,
  Download,
  CreditCard,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  customer_type_id: string
  customer_type_name: string
  customer_type_code: string
  credit_limit: number
  outstanding_amount: number
  gst_number?: string
  pan_number?: string
  drug_license?: string
  status: string
  total_orders: number
  total_spent: number
  last_order_date?: string
  created_at: string
  addresses: any[]
}

interface CustomerType {
  id: string
  name: string
  code: string
  description: string
  default_discount_percentage: number
  credit_days: number
  is_active: boolean
}

interface CustomerManagementProps {
  customers: Customer[]
  customerTypes: CustomerType[]
  onCreateCustomer: (customerData: any) => Promise<void>
  onUpdateCustomer: (id: string, updates: any) => Promise<void>
  onUpdateCreditLimit: (id: string, creditLimit: number) => Promise<void>
}

export function CustomerManagement({
  customers,
  customerTypes,
  onCreateCustomer,
  onUpdateCustomer,
  onUpdateCreditLimit,
}: CustomerManagementProps) {
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    customer_type_id: "",
    credit_limit: 0,
    gst_number: "",
    pan_number: "",
    drug_license: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  })

  useEffect(() => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm) ||
          customer.gst_number?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((customer) => customer.customer_type_code === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((customer) => customer.status === statusFilter)
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, typeFilter, statusFilter])

  const getCustomerTypeIcon = (code: string) => {
    switch (code) {
      case "RETAIL":
        return <Users className="h-4 w-4" />
      case "WHOLESALE":
      case "DISTRIBUTOR":
      case "SUBDEALER":
        return <Building2 className="h-4 w-4" />
      case "DOCTOR":
      case "CLINIC":
        return <Stethoscope className="h-4 w-4" />
      case "PHARMACY":
        return <Store className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getCustomerTypeBadge = (customer: Customer) => {
    const colors = {
      RETAIL: "bg-blue-100 text-blue-800",
      WHOLESALE: "bg-green-100 text-green-800",
      DOCTOR: "bg-purple-100 text-purple-800",
      PHARMACY: "bg-orange-100 text-orange-800",
      CLINIC: "bg-pink-100 text-pink-800",
      DISTRIBUTOR: "bg-indigo-100 text-indigo-800",
      SUBDEALER: "bg-yellow-100 text-yellow-800",
    }

    return (
      <Badge className={colors[customer.customer_type_code as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {getCustomerTypeIcon(customer.customer_type_code)}
        <span className="ml-1">{customer.customer_type_name}</span>
      </Badge>
    )
  }

  const getCreditStatus = (customer: Customer) => {
    const utilizationPercentage =
      customer.credit_limit > 0 ? (customer.outstanding_amount / customer.credit_limit) * 100 : 0

    if (utilizationPercentage >= 90) {
      return <Badge variant="destructive">Credit Limit Exceeded</Badge>
    } else if (utilizationPercentage >= 75) {
      return <Badge variant="secondary">High Utilization</Badge>
    } else {
      return <Badge variant="default">Good Standing</Badge>
    }
  }

  const getCustomerStats = () => {
    const totalCustomers = customers.length
    const activeCustomers = customers.filter((c) => c.status === "active").length
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_amount, 0)
    const totalCreditLimit = customers.reduce((sum, c) => sum + c.credit_limit, 0)

    return { totalCustomers, activeCustomers, totalOutstanding, totalCreditLimit }
  }

  const stats = getCustomerStats()

  const handleCreateCustomer = async () => {
    try {
      await onCreateCustomer(newCustomer)
      setShowCreateDialog(false)
      setNewCustomer({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        customer_type_id: "",
        credit_limit: 0,
        gst_number: "",
        pan_number: "",
        drug_license: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
      })
    } catch (error) {
      console.error("Error creating customer:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Manage B2B and B2C customers with different pricing tiers</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
              <DialogDescription>Add a new customer with appropriate type and credit settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newCustomer.first_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={newCustomer.last_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_type_id">Customer Type *</Label>
                  <Select
                    value={newCustomer.customer_type_id}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, customer_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            {getCustomerTypeIcon(type.code)}
                            {type.name} ({type.default_discount_percentage}% discount)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={newCustomer.credit_limit}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, credit_limit: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={newCustomer.gst_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gst_number: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={newCustomer.pan_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, pan_number: e.target.value })}
                    placeholder="AAAAA0000A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drug_license">Drug License</Label>
                  <Input
                    id="drug_license"
                    value={newCustomer.drug_license}
                    onChange={(e) => setNewCustomer({ ...newCustomer, drug_license: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Address Line 1"
                    value={newCustomer.address_line_1}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address_line_1: e.target.value })}
                  />
                  <Input
                    placeholder="Address Line 2"
                    value={newCustomer.address_line_2}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address_line_2: e.target.value })}
                  />
                  <Input
                    placeholder="City"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  />
                  <Input
                    placeholder="State"
                    value={newCustomer.state}
                    onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                  />
                  <Input
                    placeholder="Postal Code"
                    value={newCustomer.postal_code}
                    onChange={(e) => setNewCustomer({ ...newCustomer, postal_code: e.target.value })}
                  />
                  <Input
                    placeholder="Country"
                    value={newCustomer.country}
                    onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer}>Create Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeCustomers} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Across all customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Limit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCreditLimit)}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalOutstanding / stats.totalCreditLimit) * 100).toFixed(1)}% utilized
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Types</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerTypes.length}</div>
            <p className="text-xs text-muted-foreground">Different pricing tiers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Customers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone, or GST number..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="type-filter">Customer Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {customerTypes.map((type) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Comprehensive customer information with credit management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit Status</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                      {customer.gst_number && (
                        <div className="text-xs text-muted-foreground">GST: {customer.gst_number}</div>
                      )}
                    </TableCell>
                    <TableCell>{getCustomerTypeBadge(customer)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getCreditStatus(customer)}
                        <div className="text-xs text-muted-foreground">
                          Limit: {formatCurrency(customer.credit_limit)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(customer.outstanding_amount)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{customer.total_orders}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(customer.total_spent)} spent</div>
                    </TableCell>
                    <TableCell>
                      {customer.last_order_date ? formatDate(customer.last_order_date) : "No orders"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowDetailsDialog(true)
                          }}
                        >
                          View
                        </Button>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer?.first_name} {selectedCustomer?.last_name}
            </DialogTitle>
            <DialogDescription>Complete customer information and transaction history</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="credit">Credit Management</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      {selectedCustomer.addresses.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            <div>{selectedCustomer.addresses[0].address_line_1}</div>
                            {selectedCustomer.addresses[0].address_line_2 && (
                              <div>{selectedCustomer.addresses[0].address_line_2}</div>
                            )}
                            <div>
                              {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state}{" "}
                              {selectedCustomer.addresses[0].postal_code}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Business Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Customer Type</Label>
                        <div className="mt-1">{getCustomerTypeBadge(selectedCustomer)}</div>
                      </div>
                      {selectedCustomer.gst_number && (
                        <div>
                          <Label className="text-sm font-medium">GST Number</Label>
                          <div className="mt-1 font-mono text-sm">{selectedCustomer.gst_number}</div>
                        </div>
                      )}
                      {selectedCustomer.pan_number && (
                        <div>
                          <Label className="text-sm font-medium">PAN Number</Label>
                          <div className="mt-1 font-mono text-sm">{selectedCustomer.pan_number}</div>
                        </div>
                      )}
                      {selectedCustomer.drug_license && (
                        <div>
                          <Label className="text-sm font-medium">Drug License</Label>
                          <div className="mt-1 font-mono text-sm">{selectedCustomer.drug_license}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">Order history will be displayed here</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">Payment history will be displayed here</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credit">
                <Card>
                  <CardHeader>
                    <CardTitle>Credit Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Credit Limit</Label>
                        <div className="text-2xl font-bold">{formatCurrency(selectedCustomer.credit_limit)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Outstanding Amount</Label>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(selectedCustomer.outstanding_amount)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Available Credit</Label>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedCustomer.credit_limit - selectedCustomer.outstanding_amount)}
                      </div>
                    </div>
                    <div className="pt-4">{getCreditStatus(selectedCustomer)}</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
