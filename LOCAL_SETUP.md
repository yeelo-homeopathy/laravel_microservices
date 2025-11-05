# Homeopathy ERP System - Local Development Setup Guide

## Prerequisites

Before you start, ensure you have the following installed:

- **Docker & Docker Compose** (v20.10+)
- **Node.js** (v18+)
- **npm** (v9+)
- **PHP** (v8.2+)
- **Composer** (v2.5+)
- **PostgreSQL Client** (v14+)
- **Git**

## Quick Start (5 minutes)

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/homeopathy-erp.git
cd homeopathy-erp
\`\`\`

### 2. Copy Environment Files

\`\`\`bash
cp .env.local.example .env.local
cp apps/laravel-core/.env.example apps/laravel-core/.env
cp apps/nextjs-frontend/.env.example apps/nextjs-frontend/.env
\`\`\`

### 3. Start Docker Containers

\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Initialize Database

\`\`\`bash
# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Run migrations and seeders
docker-compose exec laravel-core php artisan migrate
docker-compose exec laravel-core php artisan db:seed
\`\`\`

### 5. Install Frontend Dependencies

\`\`\`bash
cd apps/nextjs-frontend
npm install
npm run dev
\`\`\`

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Laravel Admin**: http://localhost:8080
- **Kafka UI**: http://localhost:8081
- **MinIO Console**: http://localhost:9001
- **OpenSearch Dashboards**: http://localhost:5601
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090

---

## Detailed Local Setup

### Step 1: Database Setup

#### Configure PostgreSQL Connection

Edit `.env.local` and verify database settings:

\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=homeopathy_erp
DB_USERNAME=postgres
DB_PASSWORD=password
\`\`\`

#### Create Databases

\`\`\`bash
# Connect to PostgreSQL
psql -h localhost -U postgres -c "CREATE DATABASE homeopathy_erp;"

# Run schema creation
psql -h localhost -U postgres -d homeopathy_erp < scripts/create-homeopathy-erp-schema.sql

# Seed sample data
psql -h localhost -U postgres -d homeopathy_erp < scripts/seed-comprehensive-data.sql
\`\`\`

### Step 2: Laravel Setup

#### Install Dependencies

\`\`\`bash
cd apps/laravel-core
composer install
\`\`\`

#### Generate Application Key

\`\`\`bash
php artisan key:generate
\`\`\`

#### Run Migrations

\`\`\`bash
php artisan migrate
php artisan db:seed
\`\`\`

#### Start Laravel Development Server

\`\`\`bash
php artisan serve
\`\`\`

Laravel will be available at: `http://localhost:8000`

### Step 3: Next.js Frontend Setup

#### Install Dependencies

\`\`\`bash
cd apps/nextjs-frontend
npm install
\`\`\`

#### Create `.env.local`

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Homeopathy ERP"
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=homeopathy_erp
DB_USERNAME=postgres
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
\`\`\`

#### Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Next.js will be available at: `http://localhost:3000`

### Step 4: PostgreSQL Client Connection

#### Using psql

\`\`\`bash
psql -h localhost -U postgres -d homeopathy_erp
\`\`\`

#### Common Commands

\`\`\`sql
-- List all databases
\l

-- Connect to database
\c homeopathy_erp

-- List all tables
\dt

-- View table structure
\d products

-- Run queries
SELECT * FROM products LIMIT 10;
SELECT COUNT(*) FROM users;
\`\`\`

---

## Docker Compose Services

### Available Services

1. **nginx** - Reverse proxy and load balancer
2. **laravel-core** - PHP Laravel application
3. **postgres** - PostgreSQL database
4. **redis** - In-memory cache store
5. **kafka** - Message broker
6. **kafka-ui** - Kafka UI for monitoring
7. **mongo** - MongoDB for flexible schema
8. **minio** - Object storage
9. **opensearch** - Search engine
10. **opensearch-dashboards** - Search visualization
11. **prometheus** - Metrics collection
12. **grafana** - Metrics visualization

### Docker Commands

\`\`\`bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f laravel-core

# Execute command in container
docker-compose exec laravel-core php artisan tinker

# View running containers
docker-compose ps

# Rebuild containers
docker-compose up -d --build

# Remove all volumes (WARNING: deletes data)
docker-compose down -v
\`\`\`

---

## Database Seeding

### Run All Seeders

\`\`\`bash
# Using Laravel artisan
php artisan db:seed

# Or specific seeder
php artisan db:seed --class=ProductSeeder
php artisan db:seed --class=CustomerSeeder
\`\`\`

### Sample Data Included

- **5 Brands**: SBL, Allen, Boiron, Schwabe, Hevert
- **10 Products**: Various homeopathy remedies with potencies
- **5 Customers**: Retail, wholesale, doctor, pharmacy, distributor
- **3 Suppliers**: Major homeopathy medicine suppliers
- **20 Batches**: With purchase history and inventory tracking
- **10 Purchase Orders**: With different statuses
- **15 Sales Orders**: With payment tracking

---

## API Endpoints

### Authentication

\`\`\`bash
# Register
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "customer",
  "customer_type": "retail"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### Products

\`\`\`bash
# Get all products with batches
GET /api/products

# Get products by brand
GET /api/products?brand_id=1

# Create product
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Arnica Montana 30",
  "brand_id": 1,
  "category_id": 1,
  "potency": "30",
  "therapeutic_use": "Injuries, bruises"
}
\`\`\`

### Customers

\`\`\`bash
# Get all customers
GET /api/customers

# Get customer by ID
GET /api/customers/1

# Create customer
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Local Pharmacy",
  "type": "pharmacy",
  "email": "pharmacy@example.com",
  "credit_limit": 50000,
  "credit_days": 30
}
\`\`\`

### Orders

\`\`\`bash
# Get all orders
GET /api/orders

# Create sales order
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "batch_id": 1,
      "quantity": 10
    }
  ]
}
\`\`\`

---

## Troubleshooting

### Port Already in Use

If ports are already in use, modify `docker-compose.yml`:

\`\`\`yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead of 5432
\`\`\`

Then update `.env.local`:

\`\`\`env
DB_PORT=5433
\`\`\`

### Database Connection Error

\`\`\`bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
\`\`\`

### Laravel Not Accessible

\`\`\`bash
# Check if Laravel container is running
docker-compose ps laravel-core

# View Laravel logs
docker-compose logs laravel-core

# Rebuild Laravel container
docker-compose up -d --build laravel-core
\`\`\`

### Next.js Build Errors

\`\`\`bash
# Clear cache and reinstall
rm -rf apps/nextjs-frontend/node_modules
rm apps/nextjs-frontend/package-lock.json
npm install
npm run build
\`\`\`

---

## Development Workflow

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes to code
3. Run tests: `npm test` or `php artisan test`
4. Commit changes: `git commit -m "feat: add new feature"`
5. Push to GitHub: `git push origin feature/new-feature`
6. Create pull request
7. Wait for CI/CD pipeline to pass
8. Merge to develop branch

### Database Migrations

\`\`\`bash
# Create new migration
php artisan make:migration create_new_table

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset
\`\`\`

### Code Quality

\`\`\`bash
# Run linting
npm run lint

# Run tests
npm run test

# Check code coverage
npm run test:coverage
\`\`\`

---

## Performance Optimization

### Enable Query Caching

Edit `.env.local`:

\`\`\`env
CACHE_DRIVER=redis
SESSION_DRIVER=redis
\`\`\`

### Database Indexing

Key indexes are created automatically. To verify:

\`\`\`sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'products';
\`\`\`

### API Response Caching

\`\`\`php
// In Laravel route
Route::get('/api/products', function () {
    return cache()->remember('products', 60, function () {
        return Product::with('brand')->get();
    });
});
\`\`\`

---

## Monitoring and Debugging

### View Real-time Logs

\`\`\`bash
# Laravel logs
docker-compose logs -f laravel-core

# Next.js logs
docker-compose logs -f nextjs-frontend

# All logs
docker-compose logs -f
\`\`\`

### Access Grafana Dashboard

1. Go to http://localhost:3000
2. Login with `admin` / `admin123`
3. View pre-configured dashboards

### Query Prometheus

1. Go to http://localhost:9090
2. Use PromQL to query metrics
3. Example: `rate(http_requests_total[5m])`

---

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Update JWT_SECRET in .env.local
- [ ] Set secure SESSION_SECRET
- [ ] Enable HTTPS in production
- [ ] Use strong database passwords
- [ ] Restrict API access with rate limiting
- [ ] Enable CORS only for trusted domains
- [ ] Keep dependencies updated
- [ ] Regular security audits

---

## Next Steps

1. Review the API documentation
2. Explore the admin dashboard
3. Test the customer portal
4. Set up your custom business rules
5. Configure payment gateways
6. Set up email notifications
7. Deploy to staging environment
8. Perform user acceptance testing

---

## Support & Resources

- **Documentation**: See `README.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **API Documentation**: See `docs/API.md`
- **Contributing**: See `CONTRIBUTING.md`
