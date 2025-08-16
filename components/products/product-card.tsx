"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Heart, Star, Eye } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/types/product"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.in_stock) return

    setIsLoading(true)
    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const discountPercentage = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  return (
    <Card className="group product-hover border-border hover:border-primary/20 transition-all duration-300">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <Image
            src={product.images[0] || "/placeholder.svg?height=400&width=400"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discountPercentage > 0 && (
              <Badge variant="destructive" className="bg-accent text-accent-foreground">
                -{discountPercentage}%
              </Badge>
            )}
            {!product.in_stock && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-current text-red-500" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
              asChild
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Quick add to cart overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="sm" className="w-full" onClick={handleAddToCart} disabled={!product.in_stock || isLoading}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isLoading ? "Adding..." : product.in_stock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Brand */}
          {product.brand && <p className="text-sm text-muted-foreground font-medium">{product.brand}</p>}

          {/* Product name */}
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews_count})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{formatCurrency(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.compare_at_price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
