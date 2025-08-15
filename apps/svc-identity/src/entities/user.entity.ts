import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm"
import { Exclude, Transform } from "class-transformer"
import { IsEmail, IsOptional, IsEnum, IsPhoneNumber, IsObject } from "class-validator"
import * as bcrypt from "bcrypt"

import { Role } from "./role.entity"
import { UserSession } from "./user-session.entity"
import { UserLoginAttempt } from "./user-login-attempt.entity"

/**
 * User Entity
 *
 * Core user entity for the Identity microservice.
 * Handles user authentication, profile management, and relationships.
 *
 * Features:
 * - Secure password hashing with bcrypt
 * - Email verification and phone validation
 * - Account status management
 * - Role-based access control
 * - Login attempt tracking
 * - Session management
 * - Audit trail with timestamps
 */

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
  LOCKED = "locked",
}

export enum UserProvider {
  LOCAL = "local",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
}

@Entity("users")
@Index(["email"])
@Index(["phone"])
@Index(["status"])
@Index(["provider"])
@Index(["createdAt"])
@Index(["lastLoginAt"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  // ==========================================================================
  // BASIC INFORMATION
  // ==========================================================================

  @Column({ length: 100 })
  firstName: string

  @Column({ length: 100 })
  lastName: string

  @Column({ unique: true, length: 255 })
  @IsEmail()
  email: string

  @Column({ unique: true, nullable: true, length: 20 })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string

  @Column({ select: false })
  @Exclude()
  password: string

  // ==========================================================================
  // ACCOUNT STATUS AND VERIFICATION
  // ==========================================================================

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  @IsEnum(UserStatus)
  status: UserStatus

  @Column({ default: false })
  emailVerified: boolean

  @Column({ nullable: true })
  emailVerifiedAt?: Date

  @Column({ default: false })
  phoneVerified: boolean

  @Column({ nullable: true })
  phoneVerifiedAt?: Date

  // ==========================================================================
  // AUTHENTICATION PROVIDER
  // ==========================================================================

  @Column({
    type: "enum",
    enum: UserProvider,
    default: UserProvider.LOCAL,
  })
  @IsEnum(UserProvider)
  provider: UserProvider

  @Column({ nullable: true })
  providerId?: string

  // ==========================================================================
  // PROFILE INFORMATION
  // ==========================================================================

  @Column({ nullable: true, length: 255 })
  avatar?: string

  @Column({ nullable: true, type: "date" })
  dateOfBirth?: Date

  @Column({ nullable: true, length: 10 })
  gender?: string

  @Column({ nullable: true, length: 100 })
  timezone?: string

  @Column({ nullable: true, length: 10 })
  locale?: string

  // ==========================================================================
  // PREFERENCES AND METADATA
  // ==========================================================================

  @Column({ type: "jsonb", nullable: true })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>

  @Column({ type: "jsonb", nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>

  // ==========================================================================
  // SECURITY AND TRACKING
  // ==========================================================================

  @Column({ nullable: true })
  lastLoginAt?: Date

  @Column({ nullable: true, length: 45 })
  lastLoginIp?: string

  @Column({ nullable: true, length: 255 })
  lastLoginUserAgent?: string

  @Column({ default: 0 })
  loginAttempts: number

  @Column({ nullable: true })
  lockedUntil?: Date

  @Column({ nullable: true })
  passwordChangedAt?: Date

  // ==========================================================================
  // TOKENS
  // ==========================================================================

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken?: string

  @Column({ nullable: true })
  emailVerificationTokenExpiresAt?: Date

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken?: string

  @Column({ nullable: true })
  passwordResetTokenExpiresAt?: Date

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string

  // ==========================================================================
  // TIMESTAMPS
  // ==========================================================================

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true })
  deletedAt?: Date

  // ==========================================================================
  // RELATIONSHIPS
  // ==========================================================================

  @ManyToMany(
    () => Role,
    (role) => role.users,
    { eager: true },
  )
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "userId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "roleId", referencedColumnName: "id" },
  })
  roles: Role[]

  @OneToMany(
    () => UserSession,
    (session) => session.user,
  )
  sessions: UserSession[]

  @OneToMany(
    () => UserLoginAttempt,
    (attempt) => attempt.user,
  )
  loginAttempts_: UserLoginAttempt[]

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`.trim())
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  get initials(): string {
    return `${this.firstName?.[0] || ""}${this.lastName?.[0] || ""}`.toUpperCase()
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE
  }

  get isLocked(): boolean {
    return this.status === UserStatus.LOCKED || (this.lockedUntil && this.lockedUntil > new Date())
  }

  get isVerified(): boolean {
    return this.emailVerified
  }

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith("$2b$")) {
      const saltRounds = 12
      this.password = await bcrypt.hash(this.password, saltRounds)
    }
  }

  @BeforeInsert()
  setDefaultValues(): void {
    if (!this.preferences) {
      this.preferences = {
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        privacy: {
          profileVisibility: "private",
          showEmail: false,
          showPhone: false,
        },
        ui: {
          theme: "light",
          language: "en",
        },
      }
    }

    if (!this.metadata) {
      this.metadata = {}
    }
  }

  // ==========================================================================
  // METHODS
  // ==========================================================================

  /**
   * Verify password against stored hash
   */
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password)
  }

  /**
   * Check if user has specific role
   */
  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) || false
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: string[]): boolean {
    return this.roles?.some((role) => roleNames.includes(role.name)) || false
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permissionName: string): boolean {
    return (
      this.roles?.some((role) => role.permissions?.some((permission) => permission.name === permissionName)) || false
    )
  }

  /**
   * Get all user permissions from roles
   */
  getAllPermissions(): string[] {
    const permissions = new Set<string>()

    this.roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        permissions.add(permission.name)
      })
    })

    return Array.from(permissions)
  }

  /**
   * Update last login information
   */
  updateLastLogin(ip?: string, userAgent?: string): void {
    this.lastLoginAt = new Date()
    this.lastLoginIp = ip
    this.lastLoginUserAgent = userAgent
    this.loginAttempts = 0 // Reset failed attempts on successful login
  }

  /**
   * Increment failed login attempts
   */
  incrementLoginAttempts(): void {
    this.loginAttempts += 1
  }

  /**
   * Lock user account
   */
  lockAccount(duration: number = 30 * 60 * 1000): void {
    // 30 minutes default
    this.status = UserStatus.LOCKED
    this.lockedUntil = new Date(Date.now() + duration)
  }

  /**
   * Unlock user account
   */
  unlockAccount(): void {
    if (this.status === UserStatus.LOCKED) {
      this.status = UserStatus.ACTIVE
    }
    this.lockedUntil = null
    this.loginAttempts = 0
  }

  /**
   * Verify email
   */
  verifyEmail(): void {
    this.emailVerified = true
    this.emailVerifiedAt = new Date()
    this.emailVerificationToken = null
    this.emailVerificationTokenExpiresAt = null

    if (this.status === UserStatus.PENDING_VERIFICATION) {
      this.status = UserStatus.ACTIVE
    }
  }

  /**
   * Verify phone
   */
  verifyPhone(): void {
    this.phoneVerified = true
    this.phoneVerifiedAt = new Date()
  }

  /**
   * Set password reset token
   */
  setPasswordResetToken(token: string, expiresIn = 3600000): void {
    // 1 hour default
    this.passwordResetToken = token
    this.passwordResetTokenExpiresAt = new Date(Date.now() + expiresIn)
  }

  /**
   * Clear password reset token
   */
  clearPasswordResetToken(): void {
    this.passwordResetToken = null
    this.passwordResetTokenExpiresAt = null
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    this.password = newPassword // Will be hashed by @BeforeUpdate hook
    this.passwordChangedAt = new Date()
    this.clearPasswordResetToken()
  }

  /**
   * Soft delete user
   */
  softDelete(): void {
    this.deletedAt = new Date()
    this.status = UserStatus.INACTIVE
  }

  /**
   * Restore soft deleted user
   */
  restore(): void {
    this.deletedAt = null
    this.status = UserStatus.ACTIVE
  }
}
