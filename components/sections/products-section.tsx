import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/products/product-grid"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function ProductsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans text-foreground mb-4">Featured Products</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover our most popular tech products, carefully selected for quality and innovation
          </p>

          <div className="flex justify-center">
            <Link href="/products">
              <Button variant="outline" className="group bg-transparent">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <ProductGrid limit={8} />
      </div>
    </section>
  )
}
