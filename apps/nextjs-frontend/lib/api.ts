import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"

/**
 * API Client for E-commerce Platform
 *
 * This client handles all communication with the Laravel API Gateway
 * which routes requests to appropriate microservices.
 */
class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await this.refreshToken()
            const token = this.getAuthToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            this.clearAuthToken()
            window.location.href = "/auth/login"
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  private setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  private clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await this.client.post("/auth/refresh", {
      refresh_token: refreshToken,
    })

    const { access_token, refresh_token: newRefreshToken } = response.data
    this.setAuthToken(access_token)

    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", newRefreshToken)
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.client.post("/auth/login", { email, password })
    const { access_token, refresh_token, user } = response.data

    this.setAuthToken(access_token)
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", refresh_token)
      localStorage.setItem("user", JSON.stringify(user))
    }

    return response.data
  }

  async register(userData: any) {
    const response = await this.client.post("/auth/register", userData)
    return response.data
  }

  async logout() {
    try {
      await this.client.post("/auth/logout")
    } finally {
      this.clearAuthToken()
      if (typeof window !== "undefined") {
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
      }
    }
  }

  // Product methods
  async getProducts(params?: any) {
    const response = await this.client.get("/catalog/products", { params })
    return response.data
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/catalog/products/${id}`)
    return response.data
  }

  async searchProducts(query: string, filters?: any) {
    const response = await this.client.get("/search/products", {
      params: { q: query, ...filters },
    })
    return response.data
  }

  // Category methods
  async getCategories() {
    const response = await this.client.get("/catalog/categories")
    return response.data
  }

  async getCategory(id: string) {
    const response = await this.client.get(`/catalog/categories/${id}`)
    return response.data
  }

  // Cart methods
  async getCart() {
    const response = await this.client.get("/orders/cart")
    return response.data
  }

  async addToCart(productId: string, quantity: number, variantId?: string) {
    const response = await this.client.post("/orders/cart/items", {
      product_id: productId,
      quantity,
      variant_id: variantId,
    })
    return response.data
  }

  async updateCartItem(itemId: string, quantity: number) {
    const response = await this.client.put(`/orders/cart/items/${itemId}`, {
      quantity,
    })
    return response.data
  }

  async removeFromCart(itemId: string) {
    const response = await this.client.delete(`/orders/cart/items/${itemId}`)
    return response.data
  }

  async clearCart() {
    const response = await this.client.delete("/orders/cart")
    return response.data
  }

  // Order methods
  async createOrder(orderData: any) {
    const response = await this.client.post("/orders", orderData)
    return response.data
  }

  async getOrders(params?: any) {
    const response = await this.client.get("/orders", { params })
    return response.data
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`)
    return response.data
  }

  // Payment methods
  async processPayment(orderId: string, paymentData: any) {
    const response = await this.client.post(`/payments/process`, {
      order_id: orderId,
      ...paymentData,
    })
    return response.data
  }

  // User profile methods
  async getProfile() {
    const response = await this.client.get("/auth/user")
    return response.data
  }

  async updateProfile(profileData: any) {
    const response = await this.client.put("/auth/profile", profileData)
    return response.data
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request(config)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
