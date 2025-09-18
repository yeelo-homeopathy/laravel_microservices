"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Upload } from "lucide-react"

interface HomeopathyProductFormProps {
  product?: any
  brands: any[]
  potencies: any[]
  categories: any[]
  suppliers: any[]
  onSubmit: (data: any) => Promise<void>
}

export function HomeopathyProductForm({
  product,
  brands,
  potencies,
  categories,
  suppliers,
  onSubmit,
}: HomeopathyProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Information
    name: product?.name || "",
    generic_name: product?.generic_name || "",
    brand_id: product?.brand_id || "",
    potency_id: product?.potency_id || "",
    category_id: product?.category_id || "",
    form: product?.form || "",
    pack_size: product?.pack_size || "",
    unit_of_measure: product?.unit_of_measure || "ml",

    // Identification
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    hsn_code: product?.hsn_code || "30049099",

    // Descriptions
    description: product?.description || "",
    therapeutic_use: product?.therapeutic_use || "",
    composition: product?.composition || "",
    dosage_instructions: product?.dosage_instructions || "",
    contraindications: product?.contraindications || "",
    storage_conditions: product?.storage_conditions || "",

    // Manufacturer
    manufacturer_name: product?.manufacturer_name || "",
    manufacturer_license: product?.manufacturer_license || "",

    // Regulatory
    is_prescription_required: product?.is_prescription_required || false,
    is_schedule_drug: product?.is_schedule_drug || false,

    // Inventory
    minimum_stock_level: product?.minimum_stock_level || 10,
    maximum_stock_level: product?.maximum_stock_level || 1000,
    reorder_point: product?.reorder_point || 20,
    shelf_life_months: product?.shelf_life_months || 60,

    // Pricing & Value
    is_high_value: product?.is_high_value || false,
    high_value_threshold: product?.high_value_threshold || 1000,

    // Status
    is_active: product?.is_active !== false,

    // Images
    images: product?.images || [],
  })

  const [tags, setTags] = useState<string[]>(product?.tags || [])
  const [newTag, setNewTag] = useState("")

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        tags,
      })
      router.push("/admin/products")
    } catch (error) {
      console.error("Error saving product:", error)
    } finally {
      setLoading(false)
    }
  }

  const productForms = [
    "Dilution",
    "Globules",
    "Tablets",
    "Tincture",
    "Ointment",
    "Cream",
    "Gel",
    "Drops",
    "Syrup",
    "Powder",
    "Capsules",
  ]

  const unitOptions = ["ml", "gm", "pieces", "bottles", "tubes", "vials", "packets"]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{product ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-muted-foreground">
            {product ? "Update product information" : "Create a new homeopathy product"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential product details and classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Arnica Montana"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input
                    id="generic_name"
                    value={formData.generic_name}
                    onChange={(e) => handleInputChange("generic_name", e.target.value)}
                    placeholder="e.g., Mountain Arnica"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_id">Brand *</Label>
                  <Select value={formData.brand_id} onValueChange={(value) => handleInputChange("brand_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="potency_id">Potency *</Label>
                  <Select value={formData.potency_id} onValueChange={(value) => handleInputChange("potency_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select potency" />
                    </SelectTrigger>
                    <SelectContent>
                      {potencies.map((potency) => (
                        <SelectItem key={potency.id} value={potency.id}>
                          {potency.name} ({potency.scale})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange("category_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="form">Form</Label>
                  <Select value={formData.form} onValueChange={(value) => handleInputChange("form", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      {productForms.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pack_size">Pack Size</Label>
                  <Input
                    id="pack_size"
                    value={formData.pack_size}
                    onChange={(e) => handleInputChange("pack_size", e.target.value)}
                    placeholder="e.g., 30ml, 100 globules"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unit</Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => handleInputChange("unit_of_measure", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="e.g., SBL-ARN-30C-30ML"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange("barcode", e.target.value)}
                    placeholder="Product barcode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsn_code">HSN Code</Label>
                  <Input
                    id="hsn_code"
                    value={formData.hsn_code}
                    onChange={(e) => handleInputChange("hsn_code", e.target.value)}
                    placeholder="30049099"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Detailed product description..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>Therapeutic details and medical specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="therapeutic_use">Therapeutic Use</Label>
                <Textarea
                  id="therapeutic_use"
                  value={formData.therapeutic_use}
                  onChange={(e) => handleInputChange("therapeutic_use", e.target.value)}
                  placeholder="Conditions and symptoms this remedy addresses..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="composition">Composition</Label>
                <Textarea
                  id="composition"
                  value={formData.composition}
                  onChange={(e) => handleInputChange("composition", e.target.value)}
                  placeholder="Active ingredients and their concentrations..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage_instructions">Dosage Instructions</Label>
                <Textarea
                  id="dosage_instructions"
                  value={formData.dosage_instructions}
                  onChange={(e) => handleInputChange("dosage_instructions", e.target.value)}
                  placeholder="How to take this remedy..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraindications">Contraindications</Label>
                <Textarea
                  id="contraindications"
                  value={formData.contraindications}
                  onChange={(e) => handleInputChange("contraindications", e.target.value)}
                  placeholder="When not to use this remedy..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_conditions">Storage Conditions</Label>
                <Textarea
                  id="storage_conditions"
                  value={formData.storage_conditions}
                  onChange={(e) => handleInputChange("storage_conditions", e.target.value)}
                  placeholder="How to store this product..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Stock levels and inventory tracking settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock_level">Minimum Stock Level</Label>
                  <Input
                    id="minimum_stock_level"
                    type="number"
                    value={formData.minimum_stock_level}
                    onChange={(e) => handleInputChange("minimum_stock_level", Number.parseInt(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximum_stock_level">Maximum Stock Level</Label>
                  <Input
                    id="maximum_stock_level"
                    type="number"
                    value={formData.maximum_stock_level}
                    onChange={(e) => handleInputChange("maximum_stock_level", Number.parseInt(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_point">Reorder Point</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    value={formData.reorder_point}
                    onChange={(e) => handleInputChange("reorder_point", Number.parseInt(e.target.value))}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shelf_life_months">Shelf Life (Months)</Label>
                  <Input
                    id="shelf_life_months"
                    type="number"
                    value={formData.shelf_life_months}
                    onChange={(e) => handleInputChange("shelf_life_months", Number.parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="high_value_threshold">High Value Threshold (₹)</Label>
                  <Input
                    id="high_value_threshold"
                    type="number"
                    value={formData.high_value_threshold}
                    onChange={(e) => handleInputChange("high_value_threshold", Number.parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_high_value"
                  checked={formData.is_high_value}
                  onCheckedChange={(checked) => handleInputChange("is_high_value", checked)}
                />
                <Label htmlFor="is_high_value">Mark as High Value Item</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulatory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Information</CardTitle>
              <CardDescription>Manufacturer details and regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer_name">Manufacturer Name</Label>
                  <Input
                    id="manufacturer_name"
                    value={formData.manufacturer_name}
                    onChange={(e) => handleInputChange("manufacturer_name", e.target.value)}
                    placeholder="Manufacturing company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer_license">Manufacturer License</Label>
                  <Input
                    id="manufacturer_license"
                    value={formData.manufacturer_license}
                    onChange={(e) => handleInputChange("manufacturer_license", e.target.value)}
                    placeholder="License number"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_prescription_required"
                    checked={formData.is_prescription_required}
                    onCheckedChange={(checked) => handleInputChange("is_prescription_required", checked)}
                  />
                  <Label htmlFor="is_prescription_required">Prescription Required</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_schedule_drug"
                    checked={formData.is_schedule_drug}
                    onCheckedChange={(checked) => handleInputChange("is_schedule_drug", checked)}
                  />
                  <Label htmlFor="is_schedule_drug">Schedule Drug</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active">Product Active</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload and manage product images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Drag and drop images here, or click to browse</p>
                <Button type="button" variant="outline">
                  Choose Files
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {formData.images.map((image: any, index: number) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => {
                          const newImages = formData.images.filter((_: any, i: number) => i !== index)
                          handleInputChange("images", newImages)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
