"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { UserMenu } from "@/components/auth/user-menu"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { ShoppingCart, Search, Menu, Heart, User } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { items, totalItems } = useCart()
  const { user, isAuthenticated } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm font-sans">T</span>
              </div>
              <span className="font-bold text-xl text-foreground font-sans">TechMart Pro</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                Products
              </Link>
              <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                Categories
              </Link>
              <Link href="/deals" className="text-muted-foreground hover:text-foreground transition-colors">
                Deals
              </Link>
              <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 bg-muted border-border focus:ring-ring"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>
            </form>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <UserMenu user={user} />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link href="/wishlist">
                  <Heart className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="ghost" size="sm" className="relative" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-accent text-accent-foreground"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onCartOpen={() => setIsCartOpen(true)} />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
