import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { ConfigService } from "@nestjs/config"
import { AppModule } from "./app.module"

/**
 * Orders Microservice Bootstrap
 *
 * This microservice handles:
 * - Order creation and management
 * - Shopping cart operations
 * - Order status tracking and workflows
 * - Inventory reservation and management
 * - Order fulfillment processes
 * - Integration with payment and shipping services
 * - Real-time order updates via Kafka events
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Enable CORS for cross-origin requests
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8000",
      configService.get("FRONTEND_URL", "http://localhost:3000"),
    ],
    credentials: true,
  })

  // API prefix for all routes
  app.setGlobalPrefix("api/v1")

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle("Orders Microservice API")
    .setDescription(`
      Orders microservice for e-commerce platform.
      
      This service provides comprehensive order management capabilities including:
      - Order creation and lifecycle management
      - Shopping cart operations
      - Inventory reservation and tracking
      - Order status workflows (pending → confirmed → processing → shipped → delivered)
      - Integration with payment processing
      - Real-time order updates and notifications
      - Order analytics and reporting
      
      The service integrates with other microservices through Kafka events and REST APIs.
    `)
    .setVersion("1.0.0")
    .addTag("orders", "Order management operations")
    .addTag("cart", "Shopping cart operations")
    .addTag("fulfillment", "Order fulfillment and shipping")
    .addTag("analytics", "Order analytics and reporting")
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
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  })

  // Health check endpoint
  app.getHttpAdapter().get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "orders-microservice",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
    })
  })

  const port = configService.get("PORT", 3000)
  await app.listen(port)

  console.log(`🚀 Orders Microservice is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
  console.log(`❤️  Health Check: http://localhost:${port}/health`)
}

bootstrap()
