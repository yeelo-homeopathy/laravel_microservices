"use client"

import { useState } from "react"
import type { Product } from "@/lib/services/product.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface ProductsTableProps {
  products: Product[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
}

export function ProductsTable({ products, pagination }: ProductsTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStockStatus = (product: Product) => {
    if (!product.track_inventory) {
      return <Badge variant="outline">Not tracked</Badge>
    }

    if (product.inventory_quantity <= 0) {
      return <Badge variant="destructive">Out of stock</Badge>
    }

    if (product.inventory_quantity <= product.low_stock_threshold) {
      return <Badge variant="secondary">Low stock</Badge>
    }

    return <Badge variant="default">In stock</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url || "/placeholder.svg"}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.short_description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm">{product.sku || "N/A"}</code>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCurrency(product.price)}</div>
                    {product.compare_price && product.compare_price > product.price && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.compare_price)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {product.track_inventory ? product.inventory_quantity : "∞"}
                    </div>
                    {getStockStatus(product)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                </TableCell>
                <TableCell>{(product as any).categories?.name || "Uncategorized"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {products.length} of {pagination.total} products
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} asChild>
            <Link href={`?page=${pagination.page - 1}`}>Previous</Link>
          </Button>
          <div className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} asChild>
            <Link href={`?page=${pagination.page + 1}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
