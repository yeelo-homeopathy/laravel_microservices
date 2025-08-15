import { NestFactory } from "@nestjs/core"
import { ValidationPipe, Logger } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { ConfigService } from "@nestjs/config"
import { type MicroserviceOptions, Transport } from "@nestjs/microservices"
import helmet from "helmet"
import compression from "compression"

import { AppModule } from "./app.module"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { TransformInterceptor } from "./common/interceptors/transform.interceptor"
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor"

/**
 * Bootstrap function for Identity Microservice
 *
 * Sets up the NestJS application with:
 * - HTTP server for REST API
 * - Kafka microservice for event handling
 * - Security middleware
 * - API documentation
 * - Global pipes, filters, and interceptors
 */
async function bootstrap() {
  const logger = new Logger("Bootstrap")

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ["error", "warn", "log", "debug", "verbose"],
    })

    // Get configuration service
    const configService = app.get(ConfigService)
    const port = configService.get<number>("PORT", 3000)
    const nodeEnv = configService.get<string>("NODE_ENV", "development")

    // ==========================================================================
    // GLOBAL CONFIGURATION
    // ==========================================================================

    // Global prefix for all routes
    app.setGlobalPrefix("api/v1")

    // Global validation pipe with transformation
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        whitelist: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: nodeEnv === "production",
      }),
    )

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter())

    // Global interceptors
    app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor())

    // ==========================================================================
    // SECURITY MIDDLEWARE
    // ==========================================================================

    // Enable security headers
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    )

    // Enable compression
    app.use(compression())

    // Enable CORS for development
    if (nodeEnv === "development") {
      app.enableCors({
        origin: ["http://localhost:8080", "http://localhost:3000"],
        credentials: true,
      })
    }

    // ==========================================================================
    // MICROSERVICE SETUP
    // ==========================================================================

    // Connect Kafka microservice for event handling
    const kafkaBrokers = configService.get<string>("KAFKA_BROKERS", "localhost:9092").split(",")

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: "identity-service",
          brokers: kafkaBrokers,
          retry: {
            retries: 5,
            initialRetryTime: 300,
            maxRetryTime: 30000,
          },
        },
        consumer: {
          groupId: "identity-service-group",
          allowAutoTopicCreation: true,
          retry: {
            retries: 5,
          },
        },
        producer: {
          allowAutoTopicCreation: true,
          retry: {
            retries: 5,
          },
        },
      },
    })

    // ==========================================================================
    // API DOCUMENTATION
    // ==========================================================================

    // Setup Swagger documentation
    const config = new DocumentBuilder()
      .setTitle("Identity & Access Management API")
      .setDescription(`
        Comprehensive Identity and Access Management microservice for the e-commerce platform.
        
        This service handles:
        - User authentication and authorization
        - JWT token management
        - Role-based access control (RBAC)
        - OAuth2 integration
        - Session management
        - User profile management
        - Password reset and email verification
        
        ## Authentication
        
        Most endpoints require authentication via JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        
        API endpoints are rate-limited to prevent abuse:
        - Authentication endpoints: 5 requests per minute
        - General endpoints: 100 requests per minute
        
        ## Error Handling
        
        All errors follow a consistent format with appropriate HTTP status codes
        and detailed error messages for debugging.
      `)
      .setVersion("1.0.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .addTag("Authentication", "User authentication and token management")
      .addTag("Users", "User profile and account management")
      .addTag("Roles", "Role and permission management")
      .addTag("OAuth", "OAuth2 social authentication")
      .addTag("Health", "Service health and monitoring")
      .addServer(`http://localhost:${port}`, "Development server")
      .addServer("https://api.ecommerce.com", "Production server")
      .build()

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    })

    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: "Identity Service API Documentation",
      customfavIcon: "/favicon.ico",
      customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js",
      ],
      customCssUrl: ["https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css"],
    })

    // ==========================================================================
    // START SERVICES
    // ==========================================================================

    // Start all microservices
    await app.startAllMicroservices()
    logger.log("Kafka microservice started successfully")

    // Start HTTP server
    await app.listen(port, "0.0.0.0")

    logger.log(`🚀 Identity Service is running on: http://localhost:${port}`)
    logger.log(`📚 API Documentation available at: http://localhost:${port}/docs`)
    logger.log(`🏥 Health check available at: http://localhost:${port}/api/v1/health`)
    logger.log(`🌍 Environment: ${nodeEnv}`)
  } catch (error) {
    logger.error("Failed to start Identity Service", error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  process.exit(0)
})

bootstrap()
