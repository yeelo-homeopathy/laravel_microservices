"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingDown, AlertTriangle, Clock, DollarSign, Package, Filter, Download, RefreshCw } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface StockAgingItem {
  id: string
  product_id: string
  batch_id: string
  product_name: string
  brand_name: string
  batch_number: string
  quantity: number
  days_in_stock: number
  aging_category: string
  value_at_cost: number
  value_at_selling_price: number
  holding_cost_percentage: number
  calculated_holding_cost: number
  is_dead_stock: boolean
  last_sale_date?: string
  purchase_date: string
  expiry_date?: string
  supplier_name: string
}

interface StockAgingAnalysisProps {
  stockAgingData: StockAgingItem[]
  onRefreshAnalysis: () => Promise<void>
  onCreateDiscountCampaign: (items: string[], discountPercentage: number) => Promise<void>
  onMarkAsDeadStock: (itemIds: string[]) => Promise<void>
}

export function StockAgingAnalysis({
  stockAgingData,
  onRefreshAnalysis,
  onCreateDiscountCampaign,
  onMarkAsDeadStock,
}: StockAgingAnalysisProps) {
  const [filteredData, setFilteredData] = useState<StockAgingItem[]>(stockAgingData)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [showDeadStock, setShowDeadStock] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    let filtered = stockAgingData

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.aging_category === selectedCategory)
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter((item) => item.brand_name === selectedBrand)
    }

    if (showDeadStock) {
      filtered = filtered.filter((item) => item.is_dead_stock)
    }

    setFilteredData(filtered)
  }, [stockAgingData, selectedCategory, selectedBrand, showDeadStock])

  const getAgingStats = () => {
    const categories = {
      "0-30": stockAgingData.filter((item) => item.aging_category === "0-30"),
      "31-60": stockAgingData.filter((item) => item.aging_category === "31-60"),
      "61-90": stockAgingData.filter((item) => item.aging_category === "61-90"),
      "91-180": stockAgingData.filter((item) => item.aging_category === "91-180"),
      "180+": stockAgingData.filter((item) => item.aging_category === "180+"),
    }

    const totalValue = stockAgingData.reduce((sum, item) => sum + item.value_at_cost, 0)
    const totalHoldingCost = stockAgingData.reduce((sum, item) => sum + item.calculated_holding_cost, 0)
    const deadStockValue = stockAgingData
      .filter((item) => item.is_dead_stock)
      .reduce((sum, item) => sum + item.value_at_cost, 0)

    return { categories, totalValue, totalHoldingCost, deadStockValue }
  }

  const stats = getAgingStats()

  const getAgingBadge = (category: string) => {
    const colors = {
      "0-30": "bg-green-100 text-green-800",
      "31-60": "bg-yellow-100 text-yellow-800",
      "61-90": "bg-orange-100 text-orange-800",
      "91-180": "bg-red-100 text-red-800",
      "180+": "bg-gray-100 text-gray-800",
    }

    return (
      <Badge className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{category} days</Badge>
    )
  }

  const getHoldingCostColor = (cost: number) => {
    if (cost > 1000) return "text-red-600"
    if (cost > 500) return "text-orange-600"
    if (cost > 100) return "text-yellow-600"
    return "text-green-600"
  }

  const chartData = Object.entries(stats.categories).map(([category, items]) => ({
    category,
    count: items.length,
    value: items.reduce((sum, item) => sum + item.value_at_cost, 0),
    holdingCost: items.reduce((sum, item) => sum + item.calculated_holding_cost, 0),
  }))

  const pieData = chartData.map((item) => ({
    name: item.category,
    value: item.value,
    count: item.count,
  }))

  const COLORS = ["#10B981", "#F59E0B", "#F97316", "#EF4444", "#6B7280"]

  const brands = [...new Set(stockAgingData.map((item) => item.brand_name))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Stock Aging Analysis</h2>
          <p className="text-muted-foreground">
            Monitor inventory aging and holding costs to optimize stock management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefreshAnalysis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          {selectedItems.length > 0 && (
            <Button onClick={() => onCreateDiscountCampaign(selectedItems, 20)}>Create 20% Discount Campaign</Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">{stockAgingData.length} items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holding Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalHoldingCost)}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalHoldingCost / stats.totalValue) * 100).toFixed(1)}% of stock value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dead Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.deadStockValue)}</div>
            <p className="text-xs text-muted-foreground">
              {stockAgingData.filter((item) => item.is_dead_stock).length} items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Moving (90+ days)</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.categories["91-180"].length + stats.categories["180+"].length}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(
                stats.categories["91-180"].reduce((sum, item) => sum + item.value_at_cost, 0) +
                  stats.categories["180+"].reduce((sum, item) => sum + item.value_at_cost, 0),
              )}{" "}
              value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fast Moving (0-30 days)</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.categories["0-30"].length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.categories["0-30"].reduce((sum, item) => sum + item.value_at_cost, 0))} value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Aging Distribution</CardTitle>
            <CardDescription>Inventory value by aging category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "value" ? formatCurrency(value as number) : value,
                    name === "value" ? "Value" : "Count",
                  ]}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aging Categories</CardTitle>
            <CardDescription>Distribution of stock by aging periods</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="0-30">0-30 days</SelectItem>
                <SelectItem value="31-60">31-60 days</SelectItem>
                <SelectItem value="61-90">61-90 days</SelectItem>
                <SelectItem value="91-180">91-180 days</SelectItem>
                <SelectItem value="180+">180+ days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showDeadStock ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeadStock(!showDeadStock)}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Dead Stock Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Aging Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Stock Aging Report</CardTitle>
          <CardDescription>Complete inventory aging analysis with holding costs and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredData.map((item) => item.id))
                        } else {
                          setSelectedItems([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Days in Stock</TableHead>
                  <TableHead>Aging Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost Value</TableHead>
                  <TableHead>Holding Cost</TableHead>
                  <TableHead>Last Sale</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id])
                          } else {
                            setSelectedItems(selectedItems.filter((id) => id !== item.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-muted-foreground">{item.brand_name}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{item.batch_number}</code>
                      <div className="text-xs text-muted-foreground">Purchased: {formatDate(item.purchase_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.days_in_stock} days</div>
                      <div className="text-xs text-muted-foreground">Since: {formatDate(item.purchase_date)}</div>
                    </TableCell>
                    <TableCell>{getAgingBadge(item.aging_category)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.quantity}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(item.value_at_cost)}</div>
                      <div className="text-xs text-muted-foreground">
                        Selling: {formatCurrency(item.value_at_selling_price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${getHoldingCostColor(item.calculated_holding_cost)}`}>
                        {formatCurrency(item.calculated_holding_cost)}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.holding_cost_percentage}% monthly</div>
                    </TableCell>
                    <TableCell>
                      {item.last_sale_date ? (
                        <div className="text-sm">{formatDate(item.last_sale_date)}</div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No sales</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.is_dead_stock ? (
                        <Badge variant="destructive">Dead Stock</Badge>
                      ) : item.days_in_stock > 180 ? (
                        <Badge variant="secondary">Slow Moving</Badge>
                      ) : item.days_in_stock > 90 ? (
                        <Badge variant="outline">Review Required</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      {filteredData.some((item) => item.days_in_stock > 90) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Action Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <div className="font-medium">Slow Moving Stock (90+ days)</div>
                  <div className="text-sm text-muted-foreground">
                    {filteredData.filter((item) => item.days_in_stock > 90).length} items worth{" "}
                    {formatCurrency(
                      filteredData
                        .filter((item) => item.days_in_stock > 90)
                        .reduce((sum, item) => sum + item.value_at_cost, 0),
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    onCreateDiscountCampaign(
                      filteredData.filter((item) => item.days_in_stock > 90).map((item) => item.id),
                      25,
                    )
                  }
                >
                  Create 25% Discount
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <div className="font-medium">Dead Stock (180+ days, no sales)</div>
                  <div className="text-sm text-muted-foreground">
                    {filteredData.filter((item) => item.is_dead_stock).length} items worth{" "}
                    {formatCurrency(
                      filteredData
                        .filter((item) => item.is_dead_stock)
                        .reduce((sum, item) => sum + item.value_at_cost, 0),
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    onMarkAsDeadStock(filteredData.filter((item) => item.is_dead_stock).map((item) => item.id))
                  }
                >
                  Mark for Disposal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
