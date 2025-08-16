"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import type { Category } from "@/lib/services/product.service"

interface ProductFiltersProps {
  categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset to first page when filtering
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/admin/products")
  }

  const hasFilters = searchParams.toString() !== ""

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const value = e.target.value
              const timeoutId = setTimeout(() => {
                handleFilterChange("search", value)
              }, 300)
              return () => clearTimeout(timeoutId)
            }}
          />
        </div>
      </div>

      <Select
        value={searchParams.get("category") || "all"}
        onValueChange={(value) => handleFilterChange("category", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}
