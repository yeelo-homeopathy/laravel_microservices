import { Injectable, UnauthorizedException, ConflictException, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { JwtService } from "@nestjs/jwt"
import type { ConfigService } from "@nestjs/config"
import type { EventEmitter2 } from "@nestjs/event-emitter"
import * as bcrypt from "bcrypt"
import { v4 as uuidv4 } from "uuid"

import { type User, UserStatus, UserProvider } from "../entities/user.entity"
import type { UserSession } from "../entities/user-session.entity"
import { type UserLoginAttempt, LoginAttemptResult } from "../entities/user-login-attempt.entity"
import type { Role } from "../entities/role.entity"

import type { RegisterDto } from "./dto/register.dto"
import type { EmailService } from "../email/email.service"
import type { KafkaService } from "../kafka/kafka.service"

/**
 * Authentication Service
 *
 * Core authentication logic including:
 * - User registration and login
 * - JWT token management
 * - Password reset and email verification
 * - OAuth2 integration
 * - Session management
 * - Security features (account lockout, rate limiting)
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly userRepository: Repository<User>,
    private readonly sessionRepository: Repository<UserSession>,
    private readonly loginAttemptRepository: Repository<UserLoginAttempt>,
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
    private readonly kafkaService: KafkaService,
  ) {}

  // ==========================================================================
  // REGISTRATION AND LOGIN
  // ==========================================================================

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone: phone || undefined }].filter(Boolean),
    })

    if (existingUser) {
      throw new ConflictException("User with this email or phone already exists")
    }

    // Get default role
    const defaultRole = await this.roleRepository.findOne({
      where: { isDefault: true },
    })

    // Create user
    const user = this.userRepository.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      provider: UserProvider.LOCAL,
      status: this.configService.get("auth.emailVerification.required")
        ? UserStatus.PENDING_VERIFICATION
        : UserStatus.ACTIVE,
      roles: defaultRole ? [defaultRole] : [],
    })

    const savedUser = await this.userRepository.save(user)

    // Generate email verification token if required
    if (this.configService.get("auth.emailVerification.required")) {
      await this.generateEmailVerificationToken(savedUser)
      await this.emailService.sendVerificationEmail(savedUser)
    }

    // Emit user registered event
    this.eventEmitter.emit("user.registered", { user: savedUser })
    await this.kafkaService.publishEvent("user-registered", {
      userId: savedUser.id,
      email: savedUser.email,
      timestamp: new Date().toISOString(),
    })

    // Generate tokens
    const tokens = await this.generateTokens(savedUser)

    this.logger.log(`User registered: ${savedUser.email}`)

    return {
      message: "User registered successfully",
      user: this.sanitizeUser(savedUser),
      ...tokens,
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["roles", "roles.permissions"],
    })

    if (!user) {
      await this.recordLoginAttempt(null, email, LoginAttemptResult.FAILED_INVALID_CREDENTIALS)
      return null
    }

    // Check if account is locked
    if (user.isLocked) {
      await this.recordLoginAttempt(user.id, email, LoginAttemptResult.FAILED_ACCOUNT_LOCKED)
      throw new UnauthorizedException("Account is locked")
    }

    // Check if account is suspended
    if (user.status === UserStatus.SUSPENDED) {
      await this.recordLoginAttempt(user.id, email, LoginAttemptResult.FAILED_ACCOUNT_SUSPENDED)
      throw new UnauthorizedException("Account is suspended")
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password)
    if (!isPasswordValid) {
      user.incrementLoginAttempts()

      // Lock account if too many failed attempts
      const maxAttempts = this.configService.get("auth.accountLockout.maxAttempts", 5)
      if (user.loginAttempts >= maxAttempts) {
        const lockoutDuration = this.configService.get("auth.accountLockout.lockoutDuration", 1800000)
        user.lockAccount(lockoutDuration)
      }

      await this.userRepository.save(user)
      await this.recordLoginAttempt(user.id, email, LoginAttemptResult.FAILED_INVALID_CREDENTIALS)
      return null
    }

    // Check email verification if required
    if (this.configService.get("auth.emailVerification.required") && !user.emailVerified) {
      await this.recordLoginAttempt(user.id, email, LoginAttemptResult.FAILED_EMAIL_NOT_VERIFIED)
      throw new UnauthorizedException("Email not verified")
    }

    return user
  }

  /**
   * Login user
   */
  async login(user: User, context: { ipAddress?: string; userAgent?: string }) {
    // Update last login info
    user.updateLastLogin(context.ipAddress, context.userAgent)
    await this.userRepository.save(user)

    // Record successful login attempt
    await this.recordLoginAttempt(user.id, user.email, LoginAttemptResult.SUCCESS, context)

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Create session
    await this.createSession(user, tokens.accessToken, context)

    // Emit login event
    this.eventEmitter.emit("user.login", { user, context })
    await this.kafkaService.publishEvent("user-login", {
      userId: user.id,
      email: user.email,
      ipAddress: context.ipAddress,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`User logged in: ${user.email}`)

    return {
      message: "Login successful",
      user: this.sanitizeUser(user),
      ...tokens,
    }
  }

  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((role) => role.name) || [],
      permissions: user.getAllPermissions(),
    }

    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get("auth.jwt.refreshSecret"),
      expiresIn: this.configService.get("auth.jwt.refreshExpiresIn"),
    })

    // Store refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10)
    await this.userRepository.save(user)

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.configService.get("auth.jwt.expiresIn"),
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("auth.jwt.refreshSecret"),
      })

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ["roles", "roles.permissions"],
      })

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException("Invalid refresh token")
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken)
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException("Invalid refresh token")
      }

      return this.generateTokens(user)
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token")
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User) {
    const { password, refreshToken, emailVerificationToken, passwordResetToken, ...sanitized } = user
    return sanitized
  }

  /**
   * Record login attempt
   */
  private async recordLoginAttempt(
    userId: string | null,
    email: string,
    result: LoginAttemptResult,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const attempt = this.loginAttemptRepository.create({
      userId,
      email,
      result,
      isSuccessful: result === LoginAttemptResult.SUCCESS,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    })

    await this.loginAttemptRepository.save(attempt)
  }

  /**
   * Create user session
   */
  private async createSession(user: User, token: string, context: { ipAddress?: string; userAgent?: string }) {
    const expiresIn = this.configService.get("auth.jwt.expiresIn")
    const expirationMs = this.parseExpirationTime(expiresIn)

    const session = this.sessionRepository.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + expirationMs),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    await this.sessionRepository.save(session)
  }

  /**
   * Parse expiration time string to milliseconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) return 24 * 60 * 60 * 1000 // Default 24 hours

    const value = Number.parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case "s":
        return value * 1000
      case "m":
        return value * 60 * 1000
      case "h":
        return value * 60 * 60 * 1000
      case "d":
        return value * 24 * 60 * 60 * 1000
      default:
        return 24 * 60 * 60 * 1000
    }
  }

  /**
   * Generate email verification token
   */
  private async generateEmailVerificationToken(user: User) {
    const token = uuidv4()
    const expiresIn = this.configService.get("auth.emailVerification.tokenExpiresIn", "24h")
    const expirationMs = this.parseExpirationTime(expiresIn)

    user.emailVerificationToken = token
    user.emailVerificationTokenExpiresAt = new Date(Date.now() + expirationMs)

    await this.userRepository.save(user)
    return token
  }

  // Additional methods would continue here...
  // Including: logout, logoutAll, forgotPassword, resetPassword, verifyEmail, etc.
}
