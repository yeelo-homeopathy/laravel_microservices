"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import Link from "next/link"

// Mock cart data - in real app, this would come from cart context/state
const mockCartItems = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 29999, // $299.99 in cents
    quantity: 1,
    image: "/wireless-headphones.png",
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    price: 19999, // $199.99 in cents
    quantity: 2,
    image: "/fitness-watch.png",
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState(mockCartItems)

  const handleOrderComplete = (orderId: string) => {
    // Redirect to order confirmation page
    router.push(`/order-confirmation/${orderId}`)
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some items to your cart to proceed with checkout.</p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/cart">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">Complete your purchase securely</p>
      </div>

      {/* Checkout Form */}
      <CheckoutForm cartItems={cartItems} onOrderComplete={handleOrderComplete} />
    </div>
  )
}
