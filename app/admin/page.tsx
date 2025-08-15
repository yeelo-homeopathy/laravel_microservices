import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminLayout from "../../apps/laravel-core/resources/js/components/Layout/AdminLayout"

export default async function AdminPage() {
  // Check authentication on server side
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  return <AdminLayout />
}
