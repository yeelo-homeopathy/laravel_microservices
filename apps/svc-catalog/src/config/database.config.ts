import { registerAs } from "@nestjs/config"

/**
 * Database Configuration
 *
 * Centralized configuration for MongoDB connection.
 * Supports environment-specific settings and connection pooling.
 */
export const databaseConfig = registerAs("database", () => ({
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/ecom_catalog",

  // Connection options
  options: {
    maxPoolSize: Number.parseInt(process.env.MONGODB_MAX_POOL_SIZE || "20"),
    minPoolSize: Number.parseInt(process.env.MONGODB_MIN_POOL_SIZE || "5"),
    maxIdleTimeMS: Number.parseInt(process.env.MONGODB_MAX_IDLE_TIME || "30000"),
    serverSelectionTimeoutMS: Number.parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || "5000"),
    socketTimeoutMS: Number.parseInt(process.env.MONGODB_SOCKET_TIMEOUT || "45000"),
  },

  // Database name
  name: process.env.MONGODB_DATABASE || "ecom_catalog",
}))
