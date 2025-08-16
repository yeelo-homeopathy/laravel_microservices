import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm"
import { IsString, IsOptional, IsBoolean, IsObject } from "class-validator"

import { User } from "./user.entity"

/**
 * User Session Entity
 *
 * Tracks active user sessions for security and monitoring purposes.
 * Supports session management, device tracking, and security auditing.
 */

@Entity("user_sessions")
@Index(["userId"])
@Index(["token"])
@Index(["isActive"])
@Index(["expiresAt"])
@Index(["createdAt"])
export class UserSession {
  @PrimaryGeneratedColumn("uuid")
  id: string

  // ==========================================================================
  // SESSION INFORMATION
  // ==========================================================================

  @Column({ unique: true })
  @IsString()
  token: string // JWT token or session identifier

  @Column()
  userId: string

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean

  @Column()
  expiresAt: Date

  // ==========================================================================
  // DEVICE AND LOCATION INFORMATION
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
  deviceType?: string // mobile, desktop, tablet

  @Column({ nullable: true, length: 100 })
  @IsOptional()
  @IsString()
  browser?: string

  @Column({ nullable: true, length: 100 })
  @IsOptional()
  @IsString()
  operatingSystem?: string

  @Column({ nullable: true, length: 100 })
  @IsOptional()
  @IsString()
  location?: string // City, Country

  // ==========================================================================
  // SESSION METADATA
  // ==========================================================================

  @Column({ type: "jsonb", nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>

  @Column({ nullable: true })
  lastActivityAt?: Date

  @Column({ nullable: true })
  revokedAt?: Date

  @Column({ nullable: true, length: 100 })
  @IsOptional()
  @IsString()
  revokedReason?: string

  // ==========================================================================
  // TIMESTAMPS
  // ==========================================================================

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // ==========================================================================
  // RELATIONSHIPS
  // ==========================================================================

  @ManyToOne(
    () => User,
    (user) => user.sessions,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "userId" })
  user: User

  // ==========================================================================
  // METHODS
  // ==========================================================================

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  /**
   * Check if session is valid (active and not expired)
   */
  isValid(): boolean {
    return this.isActive && !this.isExpired() && !this.revokedAt
  }

  /**
   * Revoke session
   */
  revoke(reason?: string): void {
    this.isActive = false
    this.revokedAt = new Date()
    this.revokedReason = reason
  }

  /**
   * Update last activity
   */
  updateActivity(): void {
    this.lastActivityAt = new Date()
  }

  /**
   * Extend session expiration
   */
  extend(duration: number): void {
    this.expiresAt = new Date(Date.now() + duration)
  }
}
