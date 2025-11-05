# Homeopathy ERP System Architecture

This document provides a comprehensive overview of the enterprise homeopathy ERP system architecture, design patterns, and technical decisions.

## System Overview

The platform follows a modern microservices architecture pattern with event-driven communication, designed for scalability, maintainability, and business-specific ERP requirements.

### High-Level Architecture

\`\`\`
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Admin Dashboard │    │Customer Frontend │    │  POS Terminal    │
│    (Next.js)     │    │    (Next.js)     │    │   (Web/Mobile)   │
└──────────┬───────┘    └──────────┬───────┘    └──────────┬───────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │  Laravel API Gateway │
                        │  - Auth & ACL       │
                        │  - Business Logic   │
                        │  - Service Routing  │
                        └──────────┬──────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────────┐    ┌──────────▼─────────┐    ┌──────────▼──────┐
    │   Identity  │    │   Inventory &      │    │    Orders &     │
    │   Service   │    │   Stock Aging      │    │    Payments     │
    │  (NestJS)   │    │    Service         │    │    Service      │
    │             │    │    (NestJS)        │    │    (NestJS)     │
    └────┬────────┘    └──────────┬─────────┘    └──────────┬──────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                     ┌────────────▼────────────┐
                     │  Event Bus (Kafka)      │
                     │  - Order Events         │
                     │  - Inventory Updates    │
                     │  - Payment Confirmations│
                     └─────────────────────────┘
\`\`\`

## Core Components

### 1. API Gateway (Laravel)

**Purpose**: Central entry point for all client requests, handles routing, business logic, and cross-cutting concerns.

**Responsibilities**:
- Request routing to appropriate microservices
- Authentication and authorization with JWT
- Business logic for ERP workflows
- Rate limiting and throttling
- Request/response transformation
- Circuit breaker pattern implementation
- API documentation (Swagger/OpenAPI)

**Key Features**:
- Service discovery and load balancing
- Health check aggregation
- Centralized logging and monitoring
- CORS handling
- API versioning support

### 2. Frontend Applications (Next.js 14)

**Admin Dashboard**:
- **Purpose**: Business management interface for dealers/owners
- **Features**:
  - Multi-brand product management
  - Customer segmentation (retail, wholesale, doctors, pharmacies)
  - Purchase order management
  - Dynamic GST-based pricing
  - Stock aging analysis and reports
  - Batch and expiry tracking
  - Payment pending aging analysis
  - Profitability analysis and KPIs

**Customer Frontend**:
- **Purpose**: B2B/B2C customer ordering interface
- **Features**:
  - Product browsing by brand and category
  - Real-time inventory checks
  - Dynamic pricing per customer type
  - Cart management
  - Checkout with payment gateway
  - Order tracking and history
  - Invoice generation with GST details

**Technology Stack**:
- Next.js 14 App Router
- Server-side rendering for performance
- React Query for server state
- Tailwind CSS + shadcn/ui components
- TypeScript for type safety

### 3. Microservices

#### Identity Service (NestJS)
**Database**: PostgreSQL (dedicated schema)
**Purpose**: User authentication, authorization, and role management

**Features**:
- JWT token management with refresh tokens
- Role-based access control (RBAC)
- Multi-user role support (Admin, Dealer, Customer)
- Session management
- Password reset and email verification
- Account lockout and security features
- Audit logging for all auth events

**ERP-Specific Features**:
- Dealer hierarchy management
- Customer type-based access control
- Permission inheritance for sub-dealers

#### Inventory & Stock Aging Service (NestJS)
**Database**: PostgreSQL (dedicated schema)
**Purpose**: Manage complex inventory with batch tracking, expiry, and stock aging analysis

**Features**:
- Multi-brand product catalog
- Batch-level inventory tracking (SKU, manufacturing date, expiry date)
- Stock aging calculations (days in stock, holding cost)
- Real-time stock checks for sales orders
- Automated expiry alerts
- Dead stock identification
- Cost-benefit analysis per batch
- Inventory movement audit trail

**ERP-Specific Analytics**:
- ABC analysis (fast-moving vs slow-moving)
- Aging bucket reports (0-30 days, 30-60 days, etc.)
- Dead stock value calculation
- Monthly interest accrual for aged stock
- Stock turnover ratios

#### Orders & Payments Service (NestJS)
**Database**: PostgreSQL (dedicated schema)
**Purpose**: Order processing, fulfillment, and payment management

**Features**:
- Sales order creation with customer-specific pricing
- Cart management and validation
- Payment processing (Stripe, Razorpay)
- Invoice generation with GST calculation
- Order fulfillment tracking
- Return and refund processing
- Payment aging and outstanding tracking

**B2B Features**:
- Credit limit management per customer
- Payment terms (COD, 15/30/60 days)
- Pending payment aging analysis
- Automatic reminders for overdue payments

## Data Architecture

### PostgreSQL Database Design

**Core Tables**:
- **users** - User accounts with roles
- **customers** - Customer profiles (retail, wholesale, doctors, pharmacies)
- **brands** - Product brands
- **products** - Product master data
- **product_potencies** - Homeopathy potencies (30C, 200C, etc.)
- **batches** - Individual product batches with SKU, manufacturing date, expiry
- **inventory** - Stock levels by batch
- **stock_movements** - Audit trail of inventory changes
- **suppliers** - Supplier information
- **purchase_orders** - Inbound purchase orders
- **sales_orders** - Outbound sales orders
- **order_items** - Line items with batch selection
- **payments** - Payment records with status
- **pricing** - Dynamic pricing rules by customer type and time
- **aging_analysis** - Stock aging calculations

**Event Store**:
- Complete audit trail of all state changes
- Enables replay and temporal queries
- Supports compliance and traceability

### Redis (Caching & Sessions)
- Session storage for authenticated users
- API response caching
- Real-time inventory caches
- Rate limiting counters
- Pending order queues

### Kafka (Event Streaming)
**Topics**:
- `order.created` - New sales order
- `order.confirmed` - Order confirmed with payment
- `inventory.updated` - Stock movements
- `batch.expiring` - Expiry alerts
- `payment.pending` - Outstanding payment notifications
- `stock.aged` - Stock aging updates

## Communication Patterns

### Synchronous Communication
**HTTP/REST APIs**:
- Client to API Gateway
- API Gateway to microservices
- Real-time data requirements (inventory checks, pricing)

### Asynchronous Communication
**Event-Driven Architecture** (Kafka):
- Order processing workflows
- Inventory updates across services
- Notification triggers
- Audit logging
- Analytics data pipelines

**Message Patterns**:
- **Events**: State change notifications (order created, payment received)
- **Commands**: Action requests (process order, update inventory)
- **Queries**: Data requests (get stock level, check pricing)
- **Sagas**: Distributed transactions (order fulfillment workflow)

## Security Architecture

### Authentication & Authorization

**Multi-Layer Security**:
1. **API Gateway**: JWT validation, signature verification
2. **Service Level**: Role-based access control (RBAC)
3. **Database Level**: Row-level security (RLS) for multi-tenant data
4. **Network Level**: TLS encryption for all communication

**Security Features**:
- JWT tokens with 24-hour expiry
- Refresh tokens for extended sessions
- Role-based permissions (Admin, Dealer, Manager, Customer)
- Audit logging for compliance
- Password policies and enforcement

### Data Protection

**Encryption**:
- TLS 1.3 for data in transit
- AES-256 for sensitive data at rest (customer PII, payment info)
- Bcrypt for password hashing
- JWT RS256 signing

**Compliance**:
- GST compliance features
- Invoice audit trails
- Payment reconciliation logs
- Supplier and customer data protection

## Scalability & Performance

### Horizontal Scaling

**Stateless Architecture**:
- All microservices are stateless
- Session data in Redis
- Load balancing across service instances

**Database Scaling**:
- Read replicas for query optimization
- Connection pooling (pgBouncer)
- Query optimization and indexing
- Partitioning for large tables (orders, payments)

### Caching Strategy

**Multi-Level Caching**:
1. **API Gateway**: Product catalog, pricing rules
2. **Service Level**: Inventory levels, customer data
3. **Database**: Query result caching
4. **Frontend**: Client-side React Query caching

### Performance Optimization

**Backend**:
- Database query optimization
- Batch processing for bulk operations
- Async processing with Kafka
- Connection pooling and timeouts

**Frontend**:
- Code splitting and lazy loading
- Image optimization
- Next.js incremental static regeneration
- Service worker for offline capability

## Deployment Architecture

### Containerization

**Docker Strategy**:
- Multi-stage builds for optimization
- Distroless base images
- Health checks and graceful shutdown
- Resource limits for each service

### Orchestration

**Kubernetes** (Production):
- Service discovery and load balancing
- Auto-scaling based on CPU/memory metrics
- Rolling deployments with health checks
- ConfigMaps for configuration
- Secrets for sensitive data
- Persistent volumes for databases

**Docker Compose** (Development):
- Local development environment
- Service dependencies
- Volume management
- Network isolation

### CI/CD Pipeline

**GitHub Actions Workflow**:
- Triggered on push to main/develop branches
- Automated testing (unit, integration, E2E)
- Code quality checks (ESLint, PHPStan)
- Security scanning (Trivy for container images)
- Docker image build and push to registry
- Automated Kubernetes deployment to staging
- Manual approval for production deployment

**Deployment Stages**:
- Build → Push to registry → Deploy to staging → Health checks → Deploy to production

## Monitoring & Observability

### Metrics Collection

**Prometheus Stack**:
- Application metrics (requests, latency, errors)
- Infrastructure metrics (CPU, memory, disk)
- Business metrics (orders/day, revenue, inventory value)
- Custom ERP metrics (stock aging, pending payments)

**Grafana Dashboards**:
- System health overview
- Business KPIs (daily sales, inventory turnover)
- Performance metrics (response time, error rates)
- Operational dashboards (stock levels, pending orders)

### Logging Strategy

**Centralized Logging**:
- Structured JSON logs
- Correlation IDs for tracing requests
- Log aggregation and search
- Log retention for compliance

### Distributed Tracing

**Request Tracing**:
- Track requests across API Gateway and microservices
- Performance bottleneck identification
- Error propagation tracking
- Service dependency mapping

## Design Patterns

### Microservices Patterns

**Service Decomposition**:
- Domain-driven design (DDD)
- Bounded contexts per domain
- Database per service pattern
- Single responsibility principle

**Resilience Patterns**:
- Circuit breaker for failing services
- Retry with exponential backoff
- Timeout handling
- Graceful degradation

**Data Patterns**:
- Event sourcing for audit trails
- CQRS for read optimization
- Saga pattern for distributed transactions
- Outbox pattern for reliable messaging

### ERP-Specific Patterns

**Batch Processing**:
- Bulk order processing
- Inventory reconciliation
- Payment settlement
- Report generation

**Stock Management**:
- Lot tracking (batch-wise)
- FIFO/LIFO selection strategies
- Expiry date monitoring
- Aging analysis

**Financial**:
- GST calculation and compliance
- Credit limit validation
- Payment terms enforcement
- Aging of receivables

## Future Enhancements

### Phase 1 (Current)
- Core ERP functionality
- Docker Compose for development
- Kubernetes deployment ready

### Phase 2
- Service mesh implementation (Istio)
- Advanced analytics and BI
- Mobile POS application
- Multi-location support

### Phase 3
- AI-based demand forecasting
- Automated reorder point calculation
- Supplier performance analytics
- Integration with accounting software

### Phase 4
- Real-time collaboration features
- Advanced role-based permissions
- Multi-tenant architecture
- Global deployment capabilities

---

This architecture provides a robust foundation for managing complex homeopathy ERP operations while maintaining scalability, reliability, and compliance with business requirements.
\`\`\`
