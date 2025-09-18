"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Percent, TrendingUp } from "lucide-react"
import { pricingService } from "@/lib/services/pricing.service"

interface PricingRule {
  id: string
  name: string
  customer_type: string
  product_category?: string
  brand_id?: string
  min_quantity: number
  max_quantity?: number
  discount_type: "percentage" | "fixed"
  discount_value: number
  is_active: boolean
  valid_from: string
  valid_to?: string
  created_at: string
}

interface CustomerPricing {
  customer_type: string
  base_discount: number
  volume_discounts: VolumeDiscount[]
  special_rates: SpecialRate[]
}

interface VolumeDiscount {
  min_quantity: number
  discount_percentage: number
}

interface SpecialRate {
  product_id: string
  special_price: number
  margin_percentage: number
}

export default function DynamicPricingManagement() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [customerPricing, setCustomerPricing] = useState<CustomerPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("rules")

  const [formData, setFormData] = useState({
    name: "",
    customer_type: "retail",
    product_category: "",
    brand_id: "",
    min_quantity: 1,
    max_quantity: "",
    discount_type: "percentage",
    discount_value: 0,
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
  })

  useEffect(() => {
    loadPricingData()
  }, [])

  const loadPricingData = async () => {
    try {
      const [rules, pricing] = await Promise.all([
        pricingService.getAllPricingRules(),
        pricingService.getCustomerPricing(),
      ])
      setPricingRules(rules)
      setCustomerPricing(pricing)
    } catch (error) {
      console.error("Error loading pricing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const ruleData = {
        ...formData,
        max_quantity: formData.max_quantity ? Number.parseInt(formData.max_quantity) : null,
        valid_to: formData.valid_to || null,
      }

      if (selectedRule) {
        await pricingService.updatePricingRule(selectedRule.id, ruleData)
      } else {
        await pricingService.createPricingRule(ruleData)
      }

      await loadPricingData()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving pricing rule:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      customer_type: "retail",
      product_category: "",
      brand_id: "",
      min_quantity: 1,
      max_quantity: "",
      discount_type: "percentage",
      discount_value: 0,
      valid_from: new Date().toISOString().split("T")[0],
      valid_to: "",
    })
    setSelectedRule(null)
  }

  const editRule = (rule: PricingRule) => {
    setSelectedRule(rule)
    setFormData({
      name: rule.name,
      customer_type: rule.customer_type,
      product_category: rule.product_category || "",
      brand_id: rule.brand_id || "",
      min_quantity: rule.min_quantity,
      max_quantity: rule.max_quantity?.toString() || "",
      discount_type: rule.discount_type,
      discount_value: rule.discount_value,
      valid_from: rule.valid_from.split("T")[0],
      valid_to: rule.valid_to?.split("T")[0] || "",
    })
    setIsDialogOpen(true)
  }

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      await pricingService.updatePricingRule(ruleId, { is_active: !isActive })
      await loadPricingData()
    } catch (error) {
      console.error("Error updating rule status:", error)
    }
  }

  const getCustomerTypeBadge = (type: string) => {
    const variants = {
      retail: "bg-blue-100 text-blue-800",
      wholesale: "bg-green-100 text-green-800",
      doctor: "bg-purple-100 text-purple-800",
      pharmacy: "bg-orange-100 text-orange-800",
      clinic: "bg-teal-100 text-teal-800",
      distributor: "bg-red-100 text-red-800",
    }
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading pricing data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Pricing Management</h1>
          <p className="text-muted-foreground">Configure pricing rules and customer-specific rates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRule ? "Edit Pricing Rule" : "Add New Pricing Rule"}</DialogTitle>
              <DialogDescription>
                Configure pricing rules for different customer types and product categories
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Wholesale Volume Discount"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_type">Customer Type</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_quantity">Minimum Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: Number.parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="max_quantity">Maximum Quantity (Optional)</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    placeholder="Leave empty for no limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number.parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_to">Valid To (Optional)</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedRule ? "Update Rule" : "Create Rule"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="customer-rates">Customer Rates</TabsTrigger>
          <TabsTrigger value="gst-settings">GST Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Pricing Rules ({pricingRules.filter((r) => r.is_active).length})</CardTitle>
              <CardDescription>Manage dynamic pricing rules for different customer segments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Customer Type</TableHead>
                    <TableHead>Quantity Range</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{getCustomerTypeBadge(rule.customer_type)}</TableCell>
                      <TableCell>
                        {rule.min_quantity}
                        {rule.max_quantity ? ` - ${rule.max_quantity}` : "+"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {rule.discount_type === "percentage" ? (
                            <Percent className="h-4 w-4 mr-1" />
                          ) : (
                            <span className="mr-1">₹</span>
                          )}
                          {rule.discount_value}
                          {rule.discount_type === "percentage" && "%"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(rule.valid_from).toLocaleDateString()}</div>
                          {rule.valid_to && (
                            <div className="text-muted-foreground">
                              to {new Date(rule.valid_to).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={rule.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                          style={{ cursor: "pointer" }}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => editRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer-rates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerPricing.map((pricing) => (
              <Card key={pricing.customer_type}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {getCustomerTypeBadge(pricing.customer_type)}
                    <TrendingUp className="h-5 w-5" />
                  </CardTitle>
                  <CardDescription>Base discount: {pricing.base_discount}%</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Volume Discounts</h4>
                      {pricing.volume_discounts.map((discount, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{discount.min_quantity}+ units</span>
                          <span>{discount.discount_percentage}%</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Special Rates</h4>
                      <div className="text-sm text-muted-foreground">
                        {pricing.special_rates.length} products with special pricing
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gst-settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Configuration</CardTitle>
              <CardDescription>Configure GST rates and compliance settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Standard GST Rates</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Homeopathy Medicines</span>
                      <Badge>12% GST</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Books & Literature</span>
                      <Badge>5% GST</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Consultation Services</span>
                      <Badge>18% GST</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Compliance Settings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Auto GST Calculation</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>GSTR-1 Auto Filing</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>E-Invoice Generation</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
