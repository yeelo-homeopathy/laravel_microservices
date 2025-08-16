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
 * Bootstrap function for Catalog Microservice
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
    const validationPipe = new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: nodeEnv === "production",
    })
    app.useGlobalPipes(validationPipe)

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
          clientId: "catalog-service",
          brokers: kafkaBrokers,
          retry: {
            retries: 5,
            initialRetryTime: 300,
            maxRetryTime: 30000,
          },
        },
        consumer: {
          groupId: "catalog-service-group",
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
      .setTitle("Catalog Management API")
      .setDescription(`
        Comprehensive Catalog Management microservice for the e-commerce platform.
        
        This service handles:
        - Product catalog management
        - Category and brand management
        - Product variants and attributes
        - Media and image management
        - Search and filtering
        - Product relationships
        
        ## Authentication
        
        Most endpoints require authentication via JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## File Uploads
        
        Product images and media files are uploaded to MinIO object storage
        and automatically optimized for different display sizes.
        
        ## Search
        
        Products support full-text search across name, description, tags,
        brand, and category information with relevance scoring.
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
      .addTag("Products", "Product catalog management")
      .addTag("Categories", "Category management")
      .addTag("Brands", "Brand management")
      .addTag("Media", "Image and media management")
      .addTag("Search", "Product search and filtering")
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
      customSiteTitle: "Catalog Service API Documentation",
      customfavIcon: "/favicon.ico",
    })

    // ==========================================================================
    // START SERVICES
    // ==========================================================================

    // Start all microservices
    await app.startAllMicroservices()
    logger.log("Kafka microservice started successfully")

    // Start HTTP server
    await app.listen(port, "0.0.0.0")

    logger.log(`🚀 Catalog Service is running on: http://localhost:${port}`)
    logger.log(`📚 API Documentation available at: http://localhost:${port}/docs`)
    logger.log(`🏥 Health check available at: http://localhost:${port}/api/v1/health`)
    logger.log(`🌍 Environment: ${nodeEnv}`)
  } catch (error) {
    logger.error("Failed to start Catalog Service", error)
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
