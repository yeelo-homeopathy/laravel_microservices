import { registerAs } from "@nestjs/config"

/**
 * Authentication Configuration
 *
 * Centralized configuration for JWT tokens, session management,
 * and authentication-related settings.
 */
export const authConfig = registerAs("auth", () => ({
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your_super_secure_jwt_secret_key_here",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key_here",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    issuer: process.env.JWT_ISSUER || "identity-service",
    audience: process.env.JWT_AUDIENCE || "ecommerce-platform",
  },

  // Password Configuration
  password: {
    saltRounds: Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    minLength: Number.parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === "true",
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === "true",
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === "true",
    requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === "true",
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || "your_session_secret_key_here",
    maxAge: Number.parseInt(process.env.SESSION_MAX_AGE, 10) || 86400000, // 24 hours
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/v1/auth/google/callback",
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/api/v1/auth/facebook/callback",
    },
  },

  // Rate Limiting
  rateLimiting: {
    login: {
      windowMs: Number.parseInt(process.env.LOGIN_RATE_WINDOW_MS, 10) || 900000, // 15 minutes
      max: Number.parseInt(process.env.LOGIN_RATE_MAX_ATTEMPTS, 10) || 5,
    },
    register: {
      windowMs: Number.parseInt(process.env.REGISTER_RATE_WINDOW_MS, 10) || 3600000, // 1 hour
      max: Number.parseInt(process.env.REGISTER_RATE_MAX_ATTEMPTS, 10) || 3,
    },
    passwordReset: {
      windowMs: Number.parseInt(process.env.PASSWORD_RESET_RATE_WINDOW_MS, 10) || 3600000, // 1 hour
      max: Number.parseInt(process.env.PASSWORD_RESET_RATE_MAX_ATTEMPTS, 10) || 3,
    },
  },

  // Account Lockout
  accountLockout: {
    enabled: process.env.ACCOUNT_LOCKOUT_ENABLED === "true",
    maxAttempts: Number.parseInt(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS, 10) || 5,
    lockoutDuration: Number.parseInt(process.env.ACCOUNT_LOCKOUT_DURATION, 10) || 1800000, // 30 minutes
  },

  // Email Verification
  emailVerification: {
    required: process.env.EMAIL_VERIFICATION_REQUIRED === "true",
    tokenExpiresIn: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN || "24h",
  },

  // Password Reset
  passwordReset: {
    tokenExpiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || "1h",
    tokenLength: Number.parseInt(process.env.PASSWORD_RESET_TOKEN_LENGTH, 10) || 32,
  },
}))
