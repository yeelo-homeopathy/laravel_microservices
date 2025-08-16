"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Star } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  rating: number
  reviews_count: number
  in_stock: boolean
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.getProducts({ limit: 8 })
        setProducts(response.data || [])
      } catch (error) {
        console.error("Failed to fetch products:", error)
        // Fallback to mock data for demo
        setProducts(mockProducts)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleAddToCart = async (productId: string) => {
    try {
      await apiClient.addToCart(productId, 1)
      // Show success message
    } catch (error) {
      console.error("Failed to add to cart:", error)
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="relative aspect-square">
            <Image
              src={product.images[0] || "/placeholder.svg?height=300&width=300"}
              alt={product.name}
              fill
              className="object-cover rounded-t-lg"
            />
            <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
              <Heart className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">({product.reviews_count})</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">${(product.price / 100).toFixed(2)}</span>
              <Button
                size="sm"
                onClick={() => handleAddToCart(product.id)}
                disabled={!product.in_stock}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="h-4 w-4" />
                {product.in_stock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Mock data for demo purposes
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 9999,
    images: ["/diverse-people-listening-headphones.png"],
    rating: 4.5,
    reviews_count: 128,
    in_stock: true,
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    description: "Track your fitness goals with this advanced smartwatch",
    price: 19999,
    images: ["/modern-smartwatch.png"],
    rating: 4.3,
    reviews_count: 89,
    in_stock: true,
  },
  {
    id: "3",
    name: "Portable Laptop Stand",
    description: "Ergonomic laptop stand for better posture",
    price: 4999,
    images: ["/laptop-stand.png"],
    rating: 4.7,
    reviews_count: 203,
    in_stock: true,
  },
  {
    id: "4",
    name: "Wireless Charging Pad",
    description: "Fast wireless charging for compatible devices",
    price: 2999,
    images: ["/wireless-charger.png"],
    rating: 4.2,
    reviews_count: 156,
    in_stock: false,
  },
  {
    id: "5",
    name: "USB-C Hub",
    description: "Multi-port USB-C hub with HDMI and USB 3.0",
    price: 3999,
    images: ["/usb-hub.png"],
    rating: 4.4,
    reviews_count: 92,
    in_stock: true,
  },
  {
    id: "6",
    name: "Bluetooth Speaker",
    description: "Portable speaker with excellent sound quality",
    price: 7999,
    images: ["/bluetooth-speaker.png"],
    rating: 4.6,
    reviews_count: 174,
    in_stock: true,
  },
  {
    id: "7",
    name: "Phone Camera Lens Kit",
    description: "Professional camera lenses for smartphone photography",
    price: 5999,
    images: ["/camera-lens.png"],
    rating: 4.1,
    reviews_count: 67,
    in_stock: true,
  },
  {
    id: "8",
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard for gaming and productivity",
    price: 12999,
    images: ["/mechanical-keyboard.png"],
    rating: 4.8,
    reviews_count: 245,
    in_stock: true,
  },
]
