import { query, queryOne, transaction } from "@/lib/database/connection"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "staff" | "customer"
  customer_type?: "retail" | "wholesale" | "doctor" | "pharmacy" | "distributor"
  created_at: string
  updated_at: string
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  user: User
}

export class PostgresAuthService {
  // Register new user
  static async register(
    email: string,
    password: string,
    name: string,
    role = "customer",
    customerType?: string,
  ): Promise<User> {
    return transaction(async (client) => {
      // Check if user exists
      const existingUser = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = $1", [email])

      if (existingUser) {
        throw new Error("User already exists")
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const result = await queryOne<User>(
        `INSERT INTO users (email, password, name, role, customer_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, name, role, customer_type, created_at, updated_at`,
        [email, hashedPassword, name, role, customerType || null],
      )

      if (!result) {
        throw new Error("Failed to create user")
      }

      return result
    })
  }

  // Login user
  static async login(email: string, password: string): Promise<AuthToken> {
    const user = await queryOne<User & { password: string }>("SELECT * FROM users WHERE email = $1", [email])

    if (!user) {
      throw new Error("Invalid email or password")
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error("Invalid email or password")
    }

    const { password: _, ...userWithoutPassword } = user

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })

    const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as User,
    }
  }

  // Verify token
  static async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error("Invalid token")
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    return queryOne<User>(
      "SELECT id, email, name, role, customer_type, created_at, updated_at FROM users WHERE id = $1",
      [id],
    )
  }

  // Update user
  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { email, name, role, customer_type } = updates
    const result = await queryOne<User>(
      `UPDATE users SET 
        email = COALESCE($1, email),
        name = COALESCE($2, name),
        role = COALESCE($3, role),
        customer_type = COALESCE($4, customer_type),
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, name, role, customer_type, created_at, updated_at`,
      [email || null, name || null, role || null, customer_type || null, id],
    )

    if (!result) {
      throw new Error("User not found")
    }

    return result
  }

  // Change password
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    return transaction(async (client) => {
      const user = await queryOne<{ password: string }>("SELECT password FROM users WHERE id = $1", [userId])

      if (!user) {
        throw new Error("User not found")
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password)

      if (!isPasswordValid) {
        throw new Error("Old password is incorrect")
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [hashedPassword, userId])
    })
  }
}
