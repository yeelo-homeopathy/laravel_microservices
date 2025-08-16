import { getProducts, getCategories } from "@/lib/services/product.service"
import { ProductsTable } from "@/components/admin/products/products-table"
import { ProductFilters } from "@/components/admin/products/product-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  category?: string
  status?: string
  search?: string
  page?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filters = {
    category_id: searchParams.category,
    status: searchParams.status,
    search: searchParams.search,
    page: searchParams.page ? Number.parseInt(searchParams.page) : 1,
  }

  const [productsData, categories] = await Promise.all([getProducts(filters), getCategories()])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductFilters categories={categories} />

      <ProductsTable
        products={productsData.products}
        pagination={{
          page: productsData.page,
          totalPages: productsData.totalPages,
          total: productsData.total,
        }}
      />
    </div>
  )
}
