"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/auth/login?error=callback_error")
          return
        }

        if (data.session) {
          // Check user role and redirect accordingly
          const { data: userData } = await supabase.from("users").select("role").eq("id", data.session.user.id).single()

          if (userData?.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/")
          }
        } else {
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error)
        router.push("/auth/login?error=unexpected_error")
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-white mb-4" />
        <p className="text-white text-lg">Completing authentication...</p>
        <p className="text-gray-300 text-sm mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
