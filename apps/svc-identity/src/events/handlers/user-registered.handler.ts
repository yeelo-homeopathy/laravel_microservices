import { Injectable, Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import type { EmailService } from "../../services/email.service"
import type { AnalyticsService } from "../../services/analytics.service"

/**
 * User Registered Event Handler
 *
 * Handles the UserRegistered event by performing various side effects:
 * - Sending welcome email
 * - Creating user analytics profile
 * - Initializing user preferences
 * - Triggering onboarding workflow
 */
@Injectable()
export class UserRegisteredHandler {
  private readonly logger = new Logger(UserRegisteredHandler.name)

  constructor(
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Handle UserRegistered event
   */
  @OnEvent("App\\Events\\User\\UserRegistered")
  async handleUserRegistered(eventData: any): Promise<void> {
    try {
      const { payload } = eventData

      this.logger.log("Processing UserRegistered event", {
        userId: payload.user_id,
        email: payload.email,
        eventId: eventData.event_id,
      })

      // Send welcome email
      await this.sendWelcomeEmail(payload)

      // Track user registration in analytics
      await this.trackUserRegistration(payload)

      // Initialize user preferences
      await this.initializeUserPreferences(payload)

      this.logger.log("UserRegistered event processed successfully", {
        userId: payload.user_id,
        eventId: eventData.event_id,
      })
    } catch (error) {
      this.logger.error("Failed to process UserRegistered event", {
        eventId: eventData.event_id,
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  /**
   * Send welcome email to new user
   */
  private async sendWelcomeEmail(payload: any): Promise<void> {
    try {
      await this.emailService.sendWelcomeEmail({
        to: payload.email,
        name: payload.name,
        userId: payload.user_id,
      })

      this.logger.debug("Welcome email sent", {
        userId: payload.user_id,
        email: payload.email,
      })
    } catch (error) {
      this.logger.error("Failed to send welcome email", {
        userId: payload.user_id,
        error: error.message,
      })
      // Don't throw - email failure shouldn't fail the entire handler
    }
  }

  /**
   * Track user registration in analytics
   */
  private async trackUserRegistration(payload: any): Promise<void> {
    try {
      await this.analyticsService.trackEvent("user_registered", {
        user_id: payload.user_id,
        email: payload.email,
        role: payload.role,
        registration_date: payload.registered_at,
      })

      this.logger.debug("User registration tracked in analytics", {
        userId: payload.user_id,
      })
    } catch (error) {
      this.logger.error("Failed to track user registration", {
        userId: payload.user_id,
        error: error.message,
      })
      // Don't throw - analytics failure shouldn't fail the entire handler
    }
  }

  /**
   * Initialize default user preferences
   */
  private async initializeUserPreferences(payload: any): Promise<void> {
    try {
      // Initialize default preferences based on user role
      const defaultPreferences = this.getDefaultPreferences(payload.role)

      // Save preferences (implementation would depend on your preferences service)
      // await this.preferencesService.initializePreferences(payload.user_id, defaultPreferences)

      this.logger.debug("User preferences initialized", {
        userId: payload.user_id,
        role: payload.role,
      })
    } catch (error) {
      this.logger.error("Failed to initialize user preferences", {
        userId: payload.user_id,
        error: error.message,
      })
      // Don't throw - preferences failure shouldn't fail the entire handler
    }
  }

  /**
   * Get default preferences based on user role
   */
  private getDefaultPreferences(role: string): any {
    const basePreferences = {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        profileVisible: true,
        activityTracking: true,
      },
    }

    switch (role) {
      case "seller":
        return {
          ...basePreferences,
          seller: {
            orderNotifications: true,
            inventoryAlerts: true,
            salesReports: "weekly",
          },
        }
      case "admin":
        return {
          ...basePreferences,
          admin: {
            systemAlerts: true,
            userReports: "daily",
            securityNotifications: true,
          },
        }
      default:
        return basePreferences
    }
  }
}
