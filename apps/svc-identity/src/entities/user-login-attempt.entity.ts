import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator"

import { User } from "./user.entity"

/**
 * User Login Attempt Entity
 *
 * Tracks login attempts for security monitoring and account protection.
 * Used for implementing account lockout and detecting suspicious activity.
 */

export enum LoginAttemptResult {
  SUCCESS = "success",
  FAILED_INVALID_CREDENTIALS = "failed_invalid_credentials",
  FAILED_ACCOUNT_LOCKED = "failed_account_locked",
  FAILED_ACCOUNT_SUSPENDED = "failed_account_suspended",
  FAILED_EMAIL_NOT_VERIFIED = "failed_email_not_verified",
  FAILED_TOO_MANY_ATTEMPTS = "failed_too_many_attempts",
}

@Entity("user_login_attempts")
@Index(["userId"])
@Index(["email"])
@Index(["result"])
@Index(["ipAddress"])
@Index(["createdAt"])
export class UserLoginAttempt {
  @PrimaryGeneratedColumn("uuid")
  id: string

  // ==========================================================================
  // ATTEMPT INFORMATION
  // ==========================================================================

  @Column({ nullable: true })
  userId?: string // null for failed attempts with invalid email

  @Column({ length: 255 })
  @IsString()
  email: string

  @Column({
    type: "enum",
    enum: LoginAttemptResult,
  })
  @IsEnum(LoginAttemptResult)
  result: LoginAttemptResult

  @Column({ default: false })
  @IsBoolean()
  isSuccessful: boolean

  // ==========================================================================
  // REQUEST INFORMATION
  // ==========================================================================

  @Column({ nullable: true, length: 45 })
  @IsOptional()
  @IsString()
  ipAddress?: string

  @Column({ nullable: true, length: 500 })
  @IsOptional()
  @IsString()
  userAgent?: string

  @Column({ nullable: true, length: 100 })
  @IsOptional()
  @IsString()
  location?: string

  // ==========================================================================
  // ADDITIONAL DETAILS
  // ==========================================================================

  @Column({ nullable: true, length: 500 })
  @IsOptional()
  @IsString()
  failureReason?: string

  @Column({ nullable: true, length: 100 })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string

  @Column({ nullable: true })
  responseTime?: number // milliseconds

  // ==========================================================================
  // TIMESTAMPS
  // ==========================================================================

  @CreateDateColumn()
  createdAt: Date

  // ==========================================================================
  // RELATIONSHIPS
  // ==========================================================================

  @ManyToOne(
    () => User,
    (user) => user.loginAttempts_,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "userId" })
  user?: User

  // ==========================================================================
  // METHODS
  // ==========================================================================

  /**
   * Check if attempt is suspicious
   */
  isSuspicious(): boolean {
    // Define criteria for suspicious attempts
    return (
      !this.isSuccessful &&
      (this.result === LoginAttemptResult.FAILED_INVALID_CREDENTIALS ||
        this.result === LoginAttemptResult.FAILED_TOO_MANY_ATTEMPTS)
    )
  }

  /**
   * Get attempt summary
   */
  getSummary(): string {
    const status = this.isSuccessful ? "SUCCESS" : "FAILED"
    const location = this.location ? ` from ${this.location}` : ""
    return `${status}: ${this.email}${location} at ${this.createdAt.toISOString()}`
  }
}
