import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CacheModule } from "@nestjs/cache-manager"
import { ThrottlerModule } from "@nestjs/throttler"
import { ScheduleModule } from "@nestjs/schedule"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { redisStore } from "cache-manager-redis-store"

import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { RolesModule } from "./roles/roles.module"
import { HealthModule } from "./health/health.module"
import { KafkaModule } from "./kafka/kafka.module"
import { EmailModule } from "./email/email.module"

import { databaseConfig } from "./config/database.config"
import { authConfig } from "./config/auth.config"
import { redisConfig } from "./config/redis.config"
import { kafkaConfig } from "./config/kafka.config"
import { emailConfig } from "./config/email.config"

/**
 * Main Application Module
 *
 * Configures and imports all feature modules for the Identity microservice.
 * Sets up database connections, caching, rate limiting, and event handling.
 *
 * Architecture follows NestJS best practices with:
 * - Feature-based module organization
 * - Configuration management
 * - Database integration with TypeORM
 * - Redis caching and session storage
 * - Kafka event streaming
 * - Rate limiting and security
 */
@Module({
  imports: [
    // ==========================================================================
    // CONFIGURATION MODULE
    // ==========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, redisConfig, kafkaConfig, emailConfig],
      envFilePath: [".env.local", ".env"],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // ==========================================================================
    // DATABASE MODULE
    // ==========================================================================
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("database.host"),
        port: configService.get<number>("database.port"),
        username: configService.get<string>("database.username"),
        password: configService.get<string>("database.password"),
        database: configService.get<string>("database.name"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/migrations/*{.ts,.js}"],
        synchronize: configService.get<string>("NODE_ENV") === "development",
        logging: configService.get<string>("NODE_ENV") === "development",
        retryAttempts: 3,
        retryDelay: 3000,
        autoLoadEntities: true,
        keepConnectionAlive: true,
        // Connection pool settings for production
        extra: {
          max: 20, // Maximum number of connections
          min: 5, // Minimum number of connections
          acquire: 30000, // Maximum time to get connection
          idle: 10000, // Maximum time connection can be idle
        },
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
            limit: configService.get<number>("RATE_LIMIT_MAX", 100),
          },
          {
            name: "auth",
            ttl: 60000, // 1 minute
            limit: configService.get<number>("AUTH_RATE_LIMIT_MAX", 5),
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
      // Use this instance across the whole app
      global: true,
      // Set this to `true` to use wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: ".",
      // Set this to `true` if you want to emit the newListener event
      newListener: false,
      // Set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // The maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // Show event name in memory leak message when more than maximum amount of listeners are assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),

    // ==========================================================================
    // FEATURE MODULES
    // ==========================================================================

    // Authentication and authorization
    AuthModule,

    // User management
    UsersModule,

    // Role and permission management
    RolesModule,

    // Health checks and monitoring
    HealthModule,

    // Kafka event streaming
    KafkaModule,

    // Email service
    EmailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
