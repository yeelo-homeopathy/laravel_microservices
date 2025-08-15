"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ApplicationSetting {
  id: string
  key: string
  value: string | null
  description: string | null
  category: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

export async function getSettings(category?: string) {
  const supabase = createClient()

  let query = supabase
    .from("application_settings")
    .select("*")
    .order("category", { ascending: true })
    .order("key", { ascending: true })

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching settings:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function updateSetting(key: string, value: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("application_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single()

  if (error) {
    console.error("Error updating setting:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true, data }
}

export async function createSetting(key: string, value: string, description?: string, category = "general") {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("application_settings")
    .insert({
      key,
      value,
      description,
      category,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating setting:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true, data }
}

export async function deleteSetting(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("application_settings").delete().eq("id", id)

  if (error) {
    console.error("Error deleting setting:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

// Helper function to get Kafka configuration as environment variables format
export async function getKafkaEnvironmentConfig() {
  const { data: settings } = await getSettings("kafka")

  const envConfig: Record<string, string> = {}
  settings.forEach((setting) => {
    envConfig[setting.key] = setting.value || ""
  })

  return envConfig
}
