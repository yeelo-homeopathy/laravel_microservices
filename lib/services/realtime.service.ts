import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Real-time event types
export type RealtimeEvent =
  | "order_created"
  | "order_updated"
  | "payment_completed"
  | "inventory_updated"
  | "user_activity"
  | "low_stock_alert"
  | "new_message"

export interface RealtimeEventData {
  type: RealtimeEvent
  payload: any
  timestamp: string
  userId?: string
}

// Notification types
export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
  read: boolean
  actionUrl?: string
}

export class RealtimeService {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private eventListeners: Map<RealtimeEvent, Set<(data: any) => void>> = new Map()
  private notificationListeners: Set<(notification: Notification) => void> = new Set()

  // Subscribe to real-time updates for a specific table
  subscribeToTable(
    tableName: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filter?: string,
  ) {
    const channelName = `${tableName}_changes`

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
          filter: filter,
        },
        callback,
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to order updates
  subscribeToOrders(callback: (order: any, event: string) => void) {
    return this.subscribeToTable("orders", (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      // Emit specific events based on order changes
      if (eventType === "INSERT") {
        this.emitEvent("order_created", newRecord)
        this.createNotification({
          title: "New Order",
          message: `Order #${newRecord.order_number} has been placed`,
          type: "info",
          actionUrl: `/admin/orders/${newRecord.id}`,
        })
      } else if (eventType === "UPDATE") {
        this.emitEvent("order_updated", { old: oldRecord, new: newRecord })

        // Check for status changes
        if (oldRecord.status !== newRecord.status) {
          this.createNotification({
            title: "Order Status Updated",
            message: `Order #${newRecord.order_number} is now ${newRecord.status}`,
            type: "success",
            actionUrl: `/admin/orders/${newRecord.id}`,
          })
        }
      }

      callback(newRecord || oldRecord, eventType)
    })
  }

  // Subscribe to payment updates
  subscribeToPayments(callback: (payment: any, event: string) => void) {
    return this.subscribeToTable("payments", (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === "UPDATE" && newRecord.status === "completed" && oldRecord.status !== "completed") {
        this.emitEvent("payment_completed", newRecord)
        this.createNotification({
          title: "Payment Completed",
          message: `Payment of $${(newRecord.amount / 100).toFixed(2)} has been processed`,
          type: "success",
          actionUrl: `/admin/payments`,
        })
      }

      callback(newRecord || oldRecord, eventType)
    })
  }

  // Subscribe to inventory updates
  subscribeToInventory(callback: (product: any, event: string) => void) {
    return this.subscribeToTable("products", (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === "UPDATE") {
        const oldStock = oldRecord.stock_quantity
        const newStock = newRecord.stock_quantity

        if (oldStock !== newStock) {
          this.emitEvent("inventory_updated", {
            productId: newRecord.id,
            oldStock,
            newStock,
            product: newRecord,
          })

          // Check for low stock alerts
          const threshold = newRecord.low_stock_threshold || 10
          if (newStock <= threshold && oldStock > threshold) {
            this.emitEvent("low_stock_alert", newRecord)
            this.createNotification({
              title: "Low Stock Alert",
              message: `${newRecord.name} is running low (${newStock} remaining)`,
              type: "warning",
              actionUrl: `/admin/products/${newRecord.id}`,
            })
          }
        }
      }

      callback(newRecord || oldRecord, eventType)
    })
  }

  // Subscribe to user activity
  subscribeToUserActivity(userId: string, callback: (activity: any) => void) {
    return this.subscribeToTable(
      "activity_logs",
      (payload) => {
        const { eventType, new: newRecord } = payload

        if (eventType === "INSERT" && newRecord.user_id === userId) {
          this.emitEvent("user_activity", newRecord)
          callback(newRecord)
        }
      },
      `user_id=eq.${userId}`,
    )
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    return this.subscribeToTable(
      "notifications",
      (payload) => {
        const { eventType, new: newRecord } = payload

        if (eventType === "INSERT" && (newRecord.user_id === userId || !newRecord.user_id)) {
          callback(newRecord)
        }
      },
      `user_id=eq.${userId}`,
    )
  }

  // Real-time messaging/chat
  subscribeToMessages(channelId: string, callback: (message: any) => void) {
    const channel = this.supabase
      .channel(`messages_${channelId}`)
      .on("broadcast", { event: "new_message" }, (payload) => {
        this.emitEvent("new_message", payload)
        callback(payload)
      })
      .subscribe()

    this.channels.set(`messages_${channelId}`, channel)
    return channel
  }

  // Send real-time message
  async sendMessage(channelId: string, message: any) {
    const channel = this.channels.get(`messages_${channelId}`)
    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "new_message",
        payload: message,
      })
    }
  }

  // Event system for custom real-time events
  addEventListener(event: RealtimeEvent, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  removeEventListener(event: RealtimeEvent, callback: (data: any) => void) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emitEvent(event: RealtimeEvent, data: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const eventData: RealtimeEventData = {
        type: event,
        payload: data,
        timestamp: new Date().toISOString(),
      }

      listeners.forEach((callback) => callback(eventData))
    }
  }

  // Notification system
  addNotificationListener(callback: (notification: Notification) => void) {
    this.notificationListeners.add(callback)
  }

  removeNotificationListener(callback: (notification: Notification) => void) {
    this.notificationListeners.delete(callback)
  }

  private async createNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const fullNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    }

    // Store in database
    await this.supabase.from("notifications").insert({
      id: fullNotification.id,
      title: fullNotification.title,
      message: fullNotification.message,
      type: fullNotification.type,
      action_url: fullNotification.actionUrl,
      created_at: fullNotification.timestamp,
    })

    // Emit to listeners
    this.notificationListeners.forEach((callback) => callback(fullNotification))
  }

  // Get live metrics
  async getLiveMetrics() {
    const [orders, revenue, users, alerts] = await Promise.all([
      // Today's orders count
      this.supabase
        .from("orders")
        .select("id", { count: "exact" })
        .gte("created_at", new Date().toISOString().split("T")[0] + "T00:00:00"),

      // Today's revenue
      this.supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "completed")
        .gte("created_at", new Date().toISOString().split("T")[0] + "T00:00:00"),

      // Active users (mock - would need session tracking)
      Promise.resolve({ count: Math.floor(Math.random() * 50) + 10 }),

      // Low stock alerts
      this.supabase
        .from("products")
        .select("id", { count: "exact" })
        .lt("stock_quantity", 10),
    ])

    const todayRevenue = revenue.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    return {
      todayOrders: orders.count || 0,
      todayRevenue,
      activeUsers: users.count,
      lowStockAlerts: alerts.count || 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Cleanup subscriptions
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.eventListeners.clear()
    this.notificationListeners.clear()
  }

  // Unsubscribe from specific channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()

// React hook for real-time subscriptions
export function useRealtime() {
  return realtimeService
}

// Utility functions
export const formatRealtimeTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return date.toLocaleDateString()
}
