import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { MongooseModule } from "@nestjs/mongoose"
import { CacheModule } from "@nestjs/cache-manager"
import { ThrottlerModule } from "@nestjs/throttler"
import { ScheduleModule } from "@nestjs/schedule"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { redisStore } from "cache-manager-redis-store"

import { ProductsModule } from "./products/products.module"
import { CategoriesModule } from "./categories/categories.module"
import { BrandsModule } from "./brands/brands.module"
import { MediaModule } from "./media/media.module"
import { SearchModule } from "./search/search.module"
import { HealthModule } from "./health/health.module"
import { KafkaModule } from "./kafka/kafka.module"

import { databaseConfig } from "./config/database.config"
import { redisConfig } from "./config/redis.config"
import { kafkaConfig } from "./config/kafka.config"
import { minioConfig } from "./config/minio.config"

/**
 * Main Application Module
 *
 * Configures and imports all feature modules for the Catalog microservice.
 * Sets up MongoDB connections, caching, rate limiting, and event handling.
 *
 * Architecture follows NestJS best practices with:
 * - Feature-based module organization
 * - Configuration management
 * - MongoDB integration with Mongoose
 * - Redis caching
 * - Kafka event streaming
 * - Rate limiting and security
 * - MinIO object storage for media
 */
@Module({
  imports: [
    // ==========================================================================
    // CONFIGURATION MODULE
    // ==========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, kafkaConfig, minioConfig],
      envFilePath: [".env.local", ".env"],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // ==========================================================================
    // DATABASE MODULE (MongoDB)
    // ==========================================================================
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("database.uri"),
        retryAttempts: 3,
        retryDelay: 3000,
        connectionFactory: (connection) => {
          connection.plugin(require("mongoose-autopopulate"))
          return connection
        },
        // Connection pool settings for production
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // ==========================================================================
    // CACHE MODULE (Redis)
    // ==========================================================================
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get<string>("redis.host"),
        port: configService.get<number>("redis.port"),
        password: configService.get<string>("redis.password"),
        db: configService.get<number>("redis.db", 0),
        ttl: configService.get<number>("redis.ttl", 300), // 5 minutes default
        max: 1000, // Maximum number of items in cache
        // Redis connection options
        retryAttempts: 3,
        retryDelay: 1000,
        lazyConnect: true,
        keepAlive: true,
        family: 4, // IPv4
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // ==========================================================================
    // RATE LIMITING MODULE
    // ==========================================================================
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: "default",
            ttl: 60000, // 1 minute
            limit: configService.get<number>("RATE_LIMIT_MAX", 200),
          },
          {
            name: "upload",
            ttl: 60000, // 1 minute
            limit: configService.get<number>("UPLOAD_RATE_LIMIT_MAX", 10),
          },
        ],
        storage: {
          // Use Redis for distributed rate limiting
          host: configService.get<string>("redis.host"),
          port: configService.get<number>("redis.port"),
          password: configService.get<string>("redis.password"),
          db: 1, // Use different Redis DB for rate limiting
        },
      }),
      inject: [ConfigService],
    }),

    // ==========================================================================
    // SCHEDULING MODULE
    // ==========================================================================
    ScheduleModule.forRoot(),

    // ==========================================================================
    // EVENT EMITTER MODULE
    // ==========================================================================
    EventEmitterModule.forRoot({
      global: true,
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // ==========================================================================
    // FEATURE MODULES
    // ==========================================================================

    // Product management
    ProductsModule,

    // Category management
    CategoriesModule,

    // Brand management
    BrandsModule,

    // Media and file management
    MediaModule,

    // Search functionality
    SearchModule,

    // Health checks and monitoring
    HealthModule,

    // Kafka event streaming
    KafkaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
