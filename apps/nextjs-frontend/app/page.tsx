import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductGrid } from "@/components/products/product-grid"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Star, Truck, Shield, Headphones } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Discover Amazing Products</h1>
            <p className="text-xl mb-8 text-blue-100">
              Shop from thousands of products with fast delivery and excellent customer service. Experience the future
              of e-commerce with our modern platform.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the best shopping experience with quality products and exceptional service.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600 text-sm">Carefully curated products from trusted brands</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Quick and reliable shipping to your doorstep</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure Shopping</h3>
              <p className="text-gray-600 text-sm">Your data and payments are always protected</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Always here to help with any questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Discover our most popular items</p>
          </div>

          <ProductGrid />
        </div>
      </section>

      <Footer />
    </div>
  )
}
