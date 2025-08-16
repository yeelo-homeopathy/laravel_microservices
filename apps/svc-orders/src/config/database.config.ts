import { registerAs } from "@nestjs/config"

export const DatabaseConfig = registerAs("database", () => ({
  host: process.env.DATABASE_HOST || "postgres",
  port: Number.parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "password",
  name: process.env.DATABASE_NAME || "orders_db",
  logging: process.env.NODE_ENV === "development",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  pool: {
    max: Number.parseInt(process.env.DATABASE_POOL_MAX, 10) || 20,
    min: Number.parseInt(process.env.DATABASE_POOL_MIN, 10) || 5,
    acquire: Number.parseInt(process.env.DATABASE_POOL_ACQUIRE, 10) || 60000,
    idle: Number.parseInt(process.env.DATABASE_POOL_IDLE, 10) || 10000,
  },
}))
