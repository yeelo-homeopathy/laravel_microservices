import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

      <div className="container mx-auto px-4 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                <Star className="h-3 w-3 mr-1" />
                Trusted by 50K+ customers
              </Badge>

              <h1 className="text-4xl lg:text-6xl font-bold font-sans leading-tight">
                Premium Tech
                <span className="block text-accent">Products</span>
                Delivered Fast
              </h1>

              <p className="text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
                Discover cutting-edge technology with unbeatable prices, lightning-fast delivery, and world-class
                customer support. Your tech journey starts here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" variant="secondary" className="group">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/categories">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                >
                  Browse Categories
                </Button>
              </Link>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold font-sans">50K+</div>
                <div className="text-sm text-primary-foreground/70">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-sans">24/7</div>
                <div className="text-sm text-primary-foreground/70">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-sans">2-Day</div>
                <div className="text-sm text-primary-foreground/70">Delivery</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <Image
                src="/modern-tech-showcase.png"
                alt="Premium tech products showcase"
                width={500}
                height={600}
                className="rounded-2xl shadow-2xl"
                priority
              />
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground p-4 rounded-xl shadow-lg">
              <div className="text-sm font-medium">Free Shipping</div>
              <div className="text-xs opacity-80">On orders $50+</div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card text-card-foreground p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 bg-primary rounded-full border-2 border-card" />
                  ))}
                </div>
                <div>
                  <div className="text-sm font-medium">4.9/5 Rating</div>
                  <div className="text-xs text-muted-foreground">From 2,847 reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
