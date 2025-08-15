import { registerAs } from "@nestjs/config"

/**
 * Database Configuration
 *
 * Centralized configuration for PostgreSQL database connection.
 * Supports environment-specific settings and connection pooling.
 */
export const databaseConfig = registerAs("database", () => ({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number.parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || "ecom_user",
  password: process.env.DATABASE_PASSWORD || "ecom_secure_password",
  name: process.env.DATABASE_NAME || "ecom_identity",

  // Connection pool settings
  pool: {
    max: Number.parseInt(process.env.DATABASE_POOL_MAX, 10) || 20,
    min: Number.parseInt(process.env.DATABASE_POOL_MIN, 10) || 5,
    acquire: Number.parseInt(process.env.DATABASE_POOL_ACQUIRE, 10) || 30000,
    idle: Number.parseInt(process.env.DATABASE_POOL_IDLE, 10) || 10000,
  },

  // SSL configuration for production
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,

  // Logging configuration
  logging: process.env.NODE_ENV === "development",

  // Migration settings
  migrationsRun: process.env.NODE_ENV === "production",
  migrationsTableName: "identity_migrations",
}))
