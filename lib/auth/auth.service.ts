import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "customer" | "manager"
  avatar?: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferences?: {
    notifications: boolean
    newsletter: boolean
    theme: "light" | "dark"
  }
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User | null
  error: string | null
  token?: string
}

class AuthService {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Client-side authentication
  async signUp(email: string, password: string, userData: Partial<User>): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            name: userData.name,
            role: userData.role || "customer",
          },
        },
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        // Create user profile in our database
        const userProfile = await this.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          name: userData.name || "",
          role: userData.role || "customer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        return { user: userProfile, error: null }
      }

      return { user: null, error: "Failed to create user" }
    } catch (error) {
      return { user: null, error: (error as Error).message }
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        const userProfile = await this.getUserProfile(data.user.id)
        return { user: userProfile, error: null, token: data.session?.access_token }
      }

      return { user: null, error: "Failed to sign in" }
    } catch (error) {
      return { user: null, error: (error as Error).message }
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { error: (error as Error).message }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (user) {
        return await this.getUserProfile(user.id)
      }
      return null
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      return { user: this.mapDatabaseUser(data), error: null }
    } catch (error) {
      return { user: null, error: (error as Error).message }
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error: error?.message || null }
    } catch (error) {
      return { error: (error as Error).message }
    }
  }

  private async createUserProfile(user: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return this.mapDatabaseUser(data)
  }

  private async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      throw new Error(error.message)
    }

    return this.mapDatabaseUser(data)
  }

  private mapDatabaseUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      phone: data.phone,
      address: data.address,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}

// Server-side authentication utilities
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export async function getServerUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (error) return null

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      phone: data.phone,
      address: data.address,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    return null
  }
}

export const authService = new AuthService()
