"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "./product-card"
import { ProductCardSkeleton } from "./product-card-skeleton"
import { apiClient } from "@/lib/api"
import type { Product } from "@/types/product"

interface ProductGridProps {
  limit?: number
  categoryId?: string
  searchQuery?: string
}

export function ProductGrid({ limit = 12, categoryId, searchQuery }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        let response
        if (searchQuery) {
          response = await apiClient.searchProducts(searchQuery, { limit, category_id: categoryId })
        } else {
          response = await apiClient.getProducts({ limit, category_id: categoryId })
        }

        setProducts(response.data || mockProducts.slice(0, limit))
      } catch (error) {
        console.error("Failed to fetch products:", error)
        setError("Failed to load products")
        // Fallback to mock data
        setProducts(mockProducts.slice(0, limit))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [limit, categoryId, searchQuery])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(limit)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Mock data for demo purposes
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones Pro",
    description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
    price: 19999,
    compare_at_price: 24999,
    images: ["/premium-wireless-headphones.png"],
    rating: 4.8,
    reviews_count: 342,
    in_stock: true,
    category_id: "electronics",
    brand: "AudioTech",
    sku: "AT-WH-001",
  },
  {
    id: "2",
    name: "Smart Fitness Watch Ultra",
    description: "Advanced fitness tracking with GPS, heart rate monitor, and 7-day battery",
    price: 29999,
    compare_at_price: 34999,
    images: ["/placeholder-8mgwv.png"],
    rating: 4.6,
    reviews_count: 189,
    in_stock: true,
    category_id: "wearables",
    brand: "FitTech",
    sku: "FT-SW-002",
  },
  {
    id: "3",
    name: "Ergonomic Laptop Stand Pro",
    description: "Adjustable aluminum laptop stand for better posture and cooling",
    price: 7999,
    compare_at_price: 9999,
    images: ["/placeholder-rxk0z.png"],
    rating: 4.9,
    reviews_count: 567,
    in_stock: true,
    category_id: "accessories",
    brand: "ErgoDesk",
    sku: "ED-LS-003",
  },
  {
    id: "4",
    name: "Fast Wireless Charging Pad",
    description: "15W fast wireless charging with LED indicator and foreign object detection",
    price: 3999,
    compare_at_price: 4999,
    images: ["/placeholder-e4085.png"],
    rating: 4.4,
    reviews_count: 234,
    in_stock: false,
    category_id: "accessories",
    brand: "ChargeTech",
    sku: "CT-WC-004",
  },
  {
    id: "5",
    name: "USB-C Hub 7-in-1",
    description: "Multi-port hub with HDMI 4K, USB 3.0, SD card reader, and PD charging",
    price: 5999,
    compare_at_price: 7999,
    images: ["/placeholder-4q62s.png"],
    rating: 4.7,
    reviews_count: 423,
    in_stock: true,
    category_id: "accessories",
    brand: "ConnectPro",
    sku: "CP-HUB-005",
  },
  {
    id: "6",
    name: "Portable Bluetooth Speaker",
    description: "Waterproof speaker with 360° sound, 20-hour battery, and voice assistant",
    price: 12999,
    compare_at_price: 15999,
    images: ["/portable-waterproof-speaker.png"],
    rating: 4.5,
    reviews_count: 298,
    in_stock: true,
    category_id: "audio",
    brand: "SoundWave",
    sku: "SW-BS-006",
  },
  {
    id: "7",
    name: "Smartphone Camera Lens Kit",
    description: "Professional 3-lens kit: wide-angle, macro, and fisheye for mobile photography",
    price: 8999,
    compare_at_price: 11999,
    images: ["/placeholder-qez3j.png"],
    rating: 4.3,
    reviews_count: 156,
    in_stock: true,
    category_id: "photography",
    brand: "LensCraft",
    sku: "LC-CL-007",
  },
  {
    id: "8",
    name: "Mechanical Gaming Keyboard RGB",
    description: "Cherry MX switches, customizable RGB lighting, and programmable keys",
    price: 16999,
    compare_at_price: 19999,
    images: ["/mechanical-gaming-keyboard-rgb.png"],
    rating: 4.8,
    reviews_count: 789,
    in_stock: true,
    category_id: "gaming",
    brand: "GameTech",
    sku: "GT-KB-008",
  },
]
