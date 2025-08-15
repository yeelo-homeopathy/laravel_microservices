"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  role: "super_admin" | "admin" | "seller" | "support" | "customer"
  status: "active" | "inactive" | "suspended" | "pending"
  preferences?: any
  metadata?: any
  last_login_at?: string
  email_verified_at?: string
  created_at: string
  updated_at: string
}

export interface UserAddress {
  id: string
  user_id: string
  type: "billing" | "shipping" | "both"
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  display_name: string
  description?: string
  permissions: any
  is_system: boolean
  created_at: string
  updated_at: string
}

export async function getUsers(filters?: {
  role?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()

  let query = supabase.from("profiles").select(`
      *,
      user_roles (
        role_id,
        assigned_at,
        expires_at,
        roles (
          name,
          display_name
        )
      )
    `)

  // Apply filters
  if (filters?.role) {
    query = query.eq("role", filters.role)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
    )
  }

  // Pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to).order("created_at", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return {
    users: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getUser(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      user_roles (
        role_id,
        assigned_at,
        expires_at,
        assigned_by,
        roles (
          name,
          display_name,
          permissions
        )
      ),
      addresses (
        *
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return data
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Get current user profile
  const { data: currentProfile } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (!currentProfile) {
    throw new Error("User not found")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "user_updated",
    resource_type: "profile",
    resource_id: id,
    old_values: currentProfile,
    new_values: updates,
  })

  revalidatePath("/admin/users")
  return data
}

export async function updateUserStatus(id: string, status: UserProfile["status"], reason?: string) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      status,
      updated_at: new Date().toISOString(),
      metadata: {
        status_change_reason: reason,
        status_changed_by: user.id,
        status_changed_at: new Date().toISOString(),
      },
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user status: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "user_status_changed",
    resource_type: "profile",
    resource_id: id,
    new_values: { status, reason },
  })

  revalidatePath("/admin/users")
  return data
}

export async function assignUserRole(userId: string, roleId: string, expiresAt?: string) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // Check if role assignment already exists
  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .single()

  if (existingRole) {
    throw new Error("User already has this role")
  }

  const { data, error } = await supabase
    .from("user_roles")
    .insert({
      user_id: userId,
      role_id: roleId,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to assign role: ${error.message}`)
  }

  // Update user's primary role in profiles table
  const { data: role } = await supabase.from("roles").select("name").eq("id", roleId).single()

  if (role) {
    await supabase.from("profiles").update({ role: role.name }).eq("id", userId)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "role_assigned",
    resource_type: "user_role",
    resource_id: data.id,
    new_values: { user_id: userId, role_id: roleId, expires_at: expiresAt },
  })

  revalidatePath("/admin/users")
  return data
}

export async function removeUserRole(userId: string, roleId: string) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId)

  if (error) {
    throw new Error(`Failed to remove role: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "role_removed",
    resource_type: "user_role",
    new_values: { user_id: userId, role_id: roleId },
  })

  revalidatePath("/admin/users")
}

export async function getUserAddresses(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch addresses: ${error.message}`)
  }

  return data || []
}

export async function createUserAddress(addressData: Omit<UserAddress, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // If this is set as default, unset other default addresses
  if (addressData.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", addressData.user_id)
  }

  const { data, error } = await supabase.from("addresses").insert(addressData).select().single()

  if (error) {
    throw new Error(`Failed to create address: ${error.message}`)
  }

  revalidatePath("/admin/users")
  return data
}

export async function updateUserAddress(id: string, updates: Partial<UserAddress>) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  // If this is set as default, unset other default addresses
  if (updates.is_default) {
    const { data: address } = await supabase.from("addresses").select("user_id").eq("id", id).single()

    if (address) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", address.user_id)
    }
  }

  const { data, error } = await supabase
    .from("addresses")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update address: ${error.message}`)
  }

  revalidatePath("/admin/users")
  return data
}

export async function deleteUserAddress(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("addresses").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete address: ${error.message}`)
  }

  revalidatePath("/admin/users")
}

export async function getRoles() {
  const supabase = createClient()

  const { data, error } = await supabase.from("roles").select("*").order("name", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch roles: ${error.message}`)
  }

  return data || []
}

export async function createRole(roleData: Omit<Role, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  const { data, error } = await supabase.from("roles").insert(roleData).select().single()

  if (error) {
    throw new Error(`Failed to create role: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "role_created",
    resource_type: "role",
    resource_id: data.id,
    new_values: roleData,
  })

  revalidatePath("/admin/roles")
  return data
}

export async function updateRole(id: string, updates: Partial<Role>) {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Authentication required")
  }

  const { data, error } = await supabase
    .from("roles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`)
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "role_updated",
    resource_type: "role",
    resource_id: id,
    new_values: updates,
  })

  revalidatePath("/admin/roles")
  return data
}

export async function getUserAnalytics() {
  const supabase = createClient()

  // Get user counts by role
  const { data: usersByRole, error: roleError } = await supabase.from("profiles").select("role").eq("status", "active")

  if (roleError) {
    throw new Error(`Failed to fetch user analytics: ${roleError.message}`)
  }

  // Get user counts by status
  const { data: usersByStatus, error: statusError } = await supabase.from("profiles").select("status")

  if (statusError) {
    throw new Error(`Failed to fetch user analytics: ${statusError.message}`)
  }

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentUsers, error: recentError } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())

  if (recentError) {
    throw new Error(`Failed to fetch recent users: ${recentError.message}`)
  }

  const analytics = {
    totalUsers: usersByStatus?.length || 0,
    activeUsers: usersByStatus?.filter((u) => u.status === "active").length || 0,
    recentRegistrations: recentUsers?.length || 0,
    usersByRole: {} as Record<string, number>,
    usersByStatus: {} as Record<string, number>,
  }

  // Group by role
  usersByRole?.forEach((user) => {
    analytics.usersByRole[user.role] = (analytics.usersByRole[user.role] || 0) + 1
  })

  // Group by status
  usersByStatus?.forEach((user) => {
    analytics.usersByStatus[user.status] = (analytics.usersByStatus[user.status] || 0) + 1
  })

  return analytics
}

export async function getUserActivity(userId: string, limit = 50) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch user activity: ${error.message}`)
  }

  return data || []
}
