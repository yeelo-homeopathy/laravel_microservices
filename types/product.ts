export interface Product {
  id: string
  name: string
  description: string
  price: number
  compare_at_price?: number
  images: string[]
  rating: number
  reviews_count: number
  in_stock: boolean
  category_id: string
  brand?: string
  sku: string
  inventory_quantity?: number
  low_stock_threshold?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags?: string[]
  variants?: ProductVariant[]
  created_at?: string
  updated_at?: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  price: number
  compare_at_price?: number
  sku: string
  inventory_quantity: number
  attributes: Record<string, string>
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent_id?: string
  children?: Category[]
}

export interface ProductFilters {
  category_id?: string
  brand?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  rating?: number
  search?: string
  sort?: "name" | "price" | "rating" | "created_at"
  order?: "asc" | "desc"
  page?: number
  limit?: number
}
