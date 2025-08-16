import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CacheModule } from "@nestjs/cache-manager"
import { ThrottlerModule } from "@nestjs/throttler"
import { EventEmitterModule } from "@nestjs/event-emitter"
import * as redisStore from "cache-manager-redis-store"

// Configuration
import { DatabaseConfig } from "./config/database.config"
import { RedisConfig } from "./config/redis.config"
import { KafkaConfig } from "./config/kafka.config"

// Modules
import { OrdersModule } from "./orders/orders.module"
import { CartModule } from "./cart/cart.module"
import { FulfillmentModule } from "./fulfillment/fulfillment.module"
import { AnalyticsModule } from "./analytics/analytics.module"
import { EventsModule } from "./events/events.module"
import { HealthModule } from "./health/health.module"

/**
 * Orders Microservice App Module
 *
 * This module configures the entire Orders microservice with:
 * - Database connection (PostgreSQL)
 * - Redis caching for performance
 * - Kafka integration for event streaming
 * - Rate limiting and security
 * - Business logic modules (Orders, Cart, Fulfillment, Analytics)
 */
@Module({
  imports: [
    // Configuration management
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, RedisConfig, KafkaConfig],
      envFilePath: [".env.local", ".env"],
    }),

    // Database connection with TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("database.host"),
        port: configService.get("database.port"),
        username: configService.get("database.username"),
        password: configService.get("database.password"),
        database: configService.get("database.name"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: configService.get("NODE_ENV") === "development",
        logging: configService.get("database.logging"),
        ssl: configService.get("database.ssl"),
        extra: {
          max: configService.get("database.pool.max"),
          min: configService.get("database.pool.min"),
          acquire: configService.get("database.pool.acquire"),
          idle: configService.get("database.pool.idle"),
        },
      }),
      inject: [ConfigService],
    }),

    // Redis caching for performance optimization
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get("redis.host"),
        port: configService.get("redis.port"),
        password: configService.get("redis.password"),
        db: configService.get("redis.db"),
        ttl: configService.get("redis.ttl"),
        max: configService.get("redis.max"),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Rate limiting for API protection
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: "short",
          ttl: 1000, // 1 second
          limit: 10, // 10 requests per second
        },
        {
          name: "medium",
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
        {
          name: "long",
          ttl: 3600000, // 1 hour
          limit: 1000, // 1000 requests per hour
        },
      ],
      inject: [ConfigService],
    }),

    // Event system for internal communication
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Business logic modules
    OrdersModule,
    CartModule,
    FulfillmentModule,
    AnalyticsModule,
    EventsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
