# E-commerce Microservices Platform

A production-ready, scalable e-commerce platform built with Laravel 12, React, and NestJS microservices. Designed for high-performance online marketplaces with advanced features like multi-vendor support, real-time inventory management, and comprehensive order processing.

## 🏗️ Architecture Overview

### Core Technologies
- **Laravel 12**: API Gateway, Admin Panel, Business Logic Orchestration
- **React 18**: Modern admin interface with TypeScript
- **NestJS**: Microservices for domain-specific operations
- **PostgreSQL**: Primary OLTP database for transactional data
- **MongoDB**: Flexible catalog and product data storage
- **Redis**: Caching, session storage, and queue management
- **Apache Kafka**: Event streaming and microservice communication
- **OpenSearch**: Product search and analytics
- **MinIO**: Object storage for images and assets

### Microservices Architecture

\`\`\`
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Laravel Core  │    │  React Admin     │    │  Next.js Store  │
│   (API Gateway) │    │  (Dashboard)     │    │  (Frontend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
┌───▼────┐ ┌──────────┐ ┌────────▼───┐ ┌──────────┐ ┌────────────┐
│Identity│ │ Catalog  │ │ Inventory  │ │ Orders   │ │ Payments   │
│Service │ │ Service  │ │ Service    │ │ Service  │ │ Service    │
└────────┘ └──────────┘ └────────────┘ └──────────┘ └────────────┘
     │           │            │             │             │
     └───────────┼────────────┼─────────────┼─────────────┘
                 │            │             │
         ┌───────▼────────────▼─────────────▼───────┐
         │           Apache Kafka                   │
         │        (Event Streaming)                 │
         └─────────────────────────────────────────┘
\`\`\`

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PHP 8.3+ (for local development)
- Composer

### Development Setup

1. **Clone and Setup Environment**
   \`\`\`bash
   git clone <repository-url>
   cd ecommerce-platform
   chmod +x scripts/setup-development.sh
   ./scripts/setup-development.sh
   \`\`\`

2. **Start All Services**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Setup Laravel Application**
   \`\`\`bash
   cd apps/laravel-core
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan db:seed
   npm install && npm run build
   \`\`\`

4. **Access the Platform**
   - Main Application: http://localhost:8080
   - Admin Dashboard: http://localhost:8080/admin
   - API Documentation: http://localhost:8080/api/documentation

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 8080 | Main application entry point |
| Laravel Core | 9000 | PHP-FPM (internal) |
| Identity Service | 3001 | User authentication & authorization |
| Catalog Service | 3002 | Product catalog management |
| Inventory Service | 3003 | Stock and warehouse management |
| Orders Service | 3004 | Order processing and fulfillment |
| Payments Service | 3005 | Payment processing and reconciliation |
| PostgreSQL | 5432 | Primary database |
| MongoDB | 27017 | Catalog database |
| Redis | 6379 | Cache and session store |
| Kafka | 9092 | Message broker |
| Kafka UI | 8081 | Kafka management interface |
| MinIO | 9000/9001 | Object storage |
| OpenSearch | 9200 | Search engine |
| Grafana | 3000 | Monitoring dashboards |
| Prometheus | 9090 | Metrics collection |

## 🏢 Business Domains

### 1. Identity & Access Management
- User registration and authentication
- Role-based access control (RBAC)
- OAuth2 integration
- Session management

### 2. Catalog Management
- Product information management
- Category and brand management
- Attribute and variant handling
- Media asset management

### 3. Inventory Management
- Multi-warehouse stock tracking
- Real-time inventory updates
- Stock reservation and allocation
- Low stock alerts

### 4. Order Management
- Shopping cart functionality
- Order processing workflow
- Order status tracking
- Return and refund processing

### 5. Payment Processing
- Multiple payment gateway support
- Payment reconciliation
- Refund processing
- Financial reporting

## 🔧 Development Workflow

### Adding New Features

1. **Create Feature Branch**
   \`\`\`bash
   git checkout -b feature/new-feature-name
   \`\`\`

2. **Update Relevant Microservice**
   \`\`\`bash
   cd apps/svc-[service-name]
   # Make your changes
   npm run test
   npm run build
   \`\`\`

3. **Update API Documentation**
   \`\`\`bash
   # Update OpenAPI specs in docs/api/
   # Generate documentation
   php artisan l5-swagger:generate
   \`\`\`

4. **Test Integration**
   \`\`\`bash
   docker-compose up -d
   # Run integration tests
   \`\`\`

### Database Migrations

Each microservice manages its own database schema:

\`\`\`bash
# Laravel Core
cd apps/laravel-core
php artisan make:migration create_new_table
php artisan migrate

# NestJS Services
cd apps/svc-[service-name]
npm run migration:generate -- --name=CreateNewTable
npm run migration:run
\`\`\`

### Event-Driven Communication

Services communicate via Kafka events:

\`\`\`typescript
// Publishing an event
await this.kafkaService.emit('catalog.product.created', {
  productId: product.id,
  sku: product.sku,
  sellerId: product.sellerId,
  timestamp: new Date()
});

// Consuming an event
@EventPattern('catalog.product.created')
async handleProductCreated(data: ProductCreatedEvent) {
  // Update search index
  await this.searchService.indexProduct(data);
}
\`\`\`

## 📈 Monitoring & Observability

### Metrics Collection
- **Prometheus**: Collects metrics from all services
- **Grafana**: Visualizes performance dashboards
- **Custom Metrics**: Business KPIs and technical metrics

### Logging
- Centralized logging via Docker logs
- Structured JSON logging
- Log aggregation and analysis

### Health Checks
- Service health endpoints
- Database connectivity checks
- External service dependency monitoring

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API rate limiting
- CORS configuration

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Infrastructure Security
- SSL/TLS encryption
- Network isolation
- Secret management
- Security headers

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**
   \`\`\`bash
   # Update production environment variables
   cp .env.production .env
   \`\`\`

2. **Build and Deploy**
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml up -d
   \`\`\`

3. **Database Migrations**
   \`\`\`bash
   docker-compose exec laravel-core php artisan migrate --force
   \`\`\`

### Scaling Services

\`\`\`bash
# Scale specific services
docker-compose up -d --scale svc-catalog=3 --scale svc-orders=2
\`\`\`

## 📚 API Documentation

### REST API Endpoints

- **Authentication**: `/api/auth/*`
- **Products**: `/api/products/*`
- **Orders**: `/api/orders/*`
- **Users**: `/api/users/*`
- **Admin**: `/api/admin/*`

### Event Schema

Events follow a standardized schema:

\`\`\`json
{
  "eventType": "catalog.product.created",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "catalog-service",
  "data": {
    "productId": "uuid",
    "sku": "string",
    "sellerId": "uuid"
  }
}
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: `/docs` directory
- **API Reference**: http://localhost:8080/api/documentation
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

Built with ❤️ for scalable e-commerce solutions.
