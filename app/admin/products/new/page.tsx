"use client"

import { HomeopathyProductForm } from "@/components/admin/products/homeopathy-product-form"
import {
  createHomeopathyProduct,
  getBrands,
  getPotencies,
  getCategories,
  getSuppliers,
} from "@/lib/services/homeopathy.service"

export default async function NewProductPage() {
  const [brands, potencies, categories, suppliers] = await Promise.all([
    getBrands(),
    getPotencies(),
    getCategories(),
    getSuppliers(),
  ])

  return (
    <div className="container mx-auto py-6">
      <HomeopathyProductForm
        brands={brands}
        potencies={potencies}
        categories={categories}
        suppliers={suppliers}
        onSubmit={createHomeopathyProduct}
      />
    </div>
  )
}
