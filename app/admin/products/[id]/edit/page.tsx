"use client"

import { HomeopathyProductForm } from "@/components/admin/products/homeopathy-product-form"
import {
  getHomeopathyProduct,
  updateHomeopathyProduct,
  getBrands,
  getPotencies,
  getCategories,
  getSuppliers,
} from "@/lib/services/homeopathy.service"

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, brands, potencies, categories, suppliers] = await Promise.all([
    getHomeopathyProduct(params.id),
    getBrands(),
    getPotencies(),
    getCategories(),
    getSuppliers(),
  ])

  return (
    <div className="container mx-auto py-6">
      <HomeopathyProductForm
        product={product}
        brands={brands}
        potencies={potencies}
        categories={categories}
        suppliers={suppliers}
        onSubmit={(data) => updateHomeopathyProduct(params.id, data)}
      />
    </div>
  )
}
