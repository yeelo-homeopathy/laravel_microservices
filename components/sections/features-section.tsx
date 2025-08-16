import { Card, CardContent } from "@/components/ui/card"
import { Shield, Truck, Headphones, Award, RefreshCw, CreditCard } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Your data and payments are protected with enterprise-grade security",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free 2-day shipping on orders over $50, with tracking included",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert customer service available around the clock via chat, email, or phone",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: Award,
    title: "Quality Guarantee",
    description: "All products are tested and come with manufacturer warranty",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day hassle-free returns with free return shipping",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Multiple payment options including buy now, pay later",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans text-foreground mb-4">Why Choose TechMart Pro</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We provide exceptional service and quality products to ensure the best shopping experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                  >
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold font-sans text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
