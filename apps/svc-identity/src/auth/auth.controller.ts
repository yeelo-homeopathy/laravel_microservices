import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { ThrottlerGuard } from "@nestjs/throttler"
import type { Request, Response } from "express"

import type { AuthService } from "./auth.service"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { GoogleAuthGuard } from "./guards/google-auth.guard"

import type { LoginDto } from "./dto/login.dto"
import type { RegisterDto } from "./dto/register.dto"
import type { RefreshTokenDto } from "./dto/refresh-token.dto"
import type { ForgotPasswordDto } from "./dto/forgot-password.dto"
import type { ResetPasswordDto } from "./dto/reset-password.dto"
import type { VerifyEmailDto } from "./dto/verify-email.dto"

import { AuthResponseDto } from "./dto/auth-response.dto"
import { UserResponseDto } from "../users/dto/user-response.dto"

import { CurrentUser } from "../common/decorators/current-user.decorator"
import type { User } from "../entities/user.entity"

/**
 * Authentication Controller
 *
 * Handles all authentication-related endpoints including:
 * - User registration and login
 * - JWT token management
 * - Password reset functionality
 * - Email verification
 * - OAuth2 social authentication
 * - Session management
 *
 * Features comprehensive rate limiting, validation, and security measures.
 */
@ApiTags("Authentication")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================================================
  // LOCAL AUTHENTICATION
  // ==========================================================================

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register new user",
    description:
      "Create a new user account with email and password. Sends verification email if email verification is enabled.",
  })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data or email already exists",
  })
  @ApiResponse({
    status: 429,
    description: "Too many registration attempts",
  })
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const result = await this.authService.register(registerDto)
      return result
    } catch (error) {
      if (error.message.includes("already exists")) {
        throw new BadRequestException("Email address is already registered")
      }
      throw error
    }
  }

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login user",
    description: "Authenticate user with email and password. Returns JWT tokens for API access.",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials or account locked",
  })
  @ApiResponse({
    status: 429,
    description: "Too many login attempts",
  })
  async login(loginDto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const user = req.user as User
    const userAgent = req.get("User-Agent")
    const ip = req.ip

    return this.authService.login(user, { ip, userAgent })
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description: "Generate new access token using refresh token. Extends user session.",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired refresh token",
  })
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      return await this.authService.refreshToken(refreshTokenDto.refreshToken)
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token")
    }
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Logout user",
    description: "Invalidate current user session and tokens.",
  })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid token",
  })
  async logout(@CurrentUser() user: User, @Req() req: Request): Promise<{ message: string }> {
    const token = req.get("Authorization")?.replace("Bearer ", "")
    await this.authService.logout(user.id, token)

    return { message: "Logout successful" }
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidate all user sessions and tokens across all devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async logoutAll(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id);
    
    return { message: 'Logged out from all devices successfully' };
  }

  // ==========================================================================
  // USER PROFILE
  // ==========================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user information including roles and permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.authService.getUserProfile(user.id);
  }

  // ==========================================================================
  // EMAIL VERIFICATION
  // ==========================================================================

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify email address",
    description: "Verify user email address using verification token sent via email.",
  })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired verification token",
  })
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(verifyEmailDto.token)

    return { message: "Email verified successfully" }
  }

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resend email verification",
    description: "Send new email verification token to user email address.",
  })
  @ApiResponse({
    status: 200,
    description: "Verification email sent successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Email already verified or user not found",
  })
  async resendVerification(email: string): Promise<{ message: string }> {
    await this.authService.resendEmailVerification(email)

    return { message: "Verification email sent successfully" }
  }

  // ==========================================================================
  // PASSWORD RESET
  // ==========================================================================

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reset",
    description: "Send password reset token to user email address.",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent successfully",
  })
  @ApiResponse({
    status: 400,
    description: "User not found or email not verified",
  })
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email)

    return { message: "Password reset email sent successfully" }
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reset password",
    description: "Reset user password using reset token and new password.",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired reset token",
  })
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password)

    return { message: "Password reset successfully" }
  }

  // ==========================================================================
  // OAUTH2 AUTHENTICATION
  // ==========================================================================

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: "Google OAuth login",
    description: "Initiate Google OAuth2 authentication flow.",
  })
  @ApiResponse({
    status: 302,
    description: "Redirect to Google OAuth consent screen",
  })
  async googleAuth(): Promise<void> {
    // Guard handles the redirect to Google
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: "Google OAuth callback",
    description: "Handle Google OAuth2 callback and complete authentication.",
  })
  @ApiResponse({
    status: 302,
    description: "Redirect to frontend with authentication tokens",
  })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as User
    const userAgent = req.get("User-Agent")
    const ip = req.ip

    const result = await this.authService.login(user, { ip, userAgent })

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.accessToken}&refresh=${result.refreshToken}`

    res.redirect(redirectUrl)
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user sessions',
    description: 'Retrieve all active sessions for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User sessions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async getUserSessions(@CurrentUser() user: User) {
    return this.authService.getUserSessions(user.id);
  }

  @Post("sessions/:sessionId/revoke")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Revoke user session",
    description: "Revoke a specific user session by session ID.",
  })
  @ApiResponse({
    status: 200,
    description: "Session revoked successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid token",
  })
  @ApiResponse({
    status: 404,
    description: "Session not found",
  })
  async revokeSession(@CurrentUser() user: User, sessionId: string): Promise<{ message: string }> {
    await this.authService.revokeSession(user.id, sessionId)

    return { message: "Session revoked successfully" }
  }
}
