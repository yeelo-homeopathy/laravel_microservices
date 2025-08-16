"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ShoppingBag, Zap, Shield, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, redirect to admin after a short delay to show the landing
      const timer = setTimeout(() => {
        router.push("/admin")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="mb-4">
            <ShoppingBag className="h-16 w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
            <p className="text-white/80">Redirecting to admin dashboard...</p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-white mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <ShoppingBag className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">E-commerce Platform</h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Advanced microservices-based e-commerce platform with real-time analytics, inventory management, and
            comprehensive admin tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/auth/login")}
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              Admin Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth/sign-up")}
              className="border-white text-white hover:bg-white hover:text-slate-900"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-400 mb-2" />
              <CardTitle className="text-white">Real-time Analytics</CardTitle>
              <CardDescription className="text-white/70">
                Live metrics, order tracking, and inventory alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• Live order feed</li>
                <li>• Real-time inventory tracking</li>
                <li>• Performance metrics</li>
                <li>• Automated alerts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Secure & Scalable</CardTitle>
              <CardDescription className="text-white/70">
                Enterprise-grade security with microservices architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• JWT authentication</li>
                <li>• Role-based access control</li>
                <li>• Event-driven architecture</li>
                <li>• Horizontal scaling</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardHeader>
              <Globe className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Modern Tech Stack</CardTitle>
              <CardDescription className="text-white/70">
                Built with cutting-edge technologies and best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• Next.js & React</li>
                <li>• Laravel & NestJS</li>
                <li>• PostgreSQL & MongoDB</li>
                <li>• Docker & Kafka</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="bg-white/10 border-white/20 backdrop-blur max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white text-center">System Status</CardTitle>
            <CardDescription className="text-white/70 text-center">All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-white font-medium">API Gateway</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-white font-medium">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-white font-medium">Real-time</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
