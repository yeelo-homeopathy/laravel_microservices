# Setup Guide

This guide provides detailed instructions for setting up the E-commerce Microservices Platform on your local development environment.

## Prerequisites

### Required Software
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v18.0+) and **npm** (v8.0+)
- **PHP** (v8.2+) with extensions: mbstring, xml, curl, zip, pdo, pdo_pgsql
- **Composer** (v2.0+)
- **Git** (v2.30+)

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

## Installation Methods

### Method 1: Automated Setup (Recommended)

The automated setup script handles all configuration and installation:

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ecommerce-platform

# Make scripts executable
chmod +x scripts/*.sh

# Run complete setup
./scripts/setup-complete-environment.sh
\`\`\`

This script will:
1. Verify all prerequisites
2. Create environment files from templates
3. Install all dependencies
4. Start Docker infrastructure
5. Setup databases with sample data
6. Build all applications

### Method 2: Manual Setup

If you prefer manual control or the automated script fails:

#### Step 1: Environment Configuration

\`\`\`bash
# Copy environment files
cp .env.example .env
cp apps/laravel-core/.env.example apps/laravel-core/.env
cp apps/nextjs-frontend/.env.example apps/nextjs-frontend/.env.local
cp apps/svc-identity/.env.example apps/svc-identity/.env
cp apps/svc-catalog/.env.example apps/svc-catalog/.env
cp apps/svc-orders/.env.example apps/svc-orders/.env
\`\`\`

#### Step 2: Configure Environment Variables

Edit the `.env` files with your specific configuration:

**Main .env file:**
\`\`\`env
# Supabase Configuration (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URLs
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME="E-commerce Platform"

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=ecommerce_core
DB_USERNAME=postgres
DB_PASSWORD=password
\`\`\`

#### Step 3: Generate Application Keys

\`\`\`bash
# Generate Laravel application key
cd apps/laravel-core
php artisan key:generate
cd ../..

# Generate JWT secrets (optional - defaults provided)
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET
\`\`\`

#### Step 4: Install Dependencies

\`\`\`bash
# Install root dependencies
npm install

# Install Laravel dependencies
cd apps/laravel-core
composer install --optimize-autoloader
cd ../..

# Install Next.js frontend dependencies
cd apps/nextjs-frontend
npm install
cd ../..

# Install microservice dependencies
cd apps/svc-identity && npm install && cd ../..
cd apps/svc-catalog && npm install && cd ../..
cd apps/svc-orders && npm install && cd ../..
\`\`\`

#### Step 5: Start Infrastructure Services

\`\`\`bash
# Start Docker infrastructure
docker-compose -f infrastructure/docker-compose.yml up -d

# Verify services are running
docker-compose -f infrastructure/docker-compose.yml ps
\`\`\`

Expected services:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- Kafka (port 9092)
- Zookeeper (port 2181)
- MinIO (port 9000)
- OpenSearch (port 9200)
- Prometheus (port 9090)
- Grafana (port 3001)

#### Step 6: Setup Databases

\`\`\`bash
# Wait for PostgreSQL to be ready
sleep 30

# Run database setup
docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -f /docker-entrypoint-initdb.d/complete-database-dump.sql

# Load sample data (optional)
docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -f /docker-entrypoint-initdb.d/seed-sample-data.sql
\`\`\`

#### Step 7: Run Laravel Migrations

\`\`\`bash
cd apps/laravel-core

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear

cd ../..
\`\`\`

#### Step 8: Build Applications

\`\`\`bash
# Build Next.js frontend
cd apps/nextjs-frontend
npm run build
cd ../..

# Build microservices
cd apps/svc-identity && npm run build && cd ../..
cd apps/svc-catalog && npm run build && cd ../..
cd apps/svc-orders && npm run build && cd ../..
\`\`\`

## Starting the Platform

### Method 1: Using Start Script

\`\`\`bash
# Start all services
./scripts/start-development.sh

# Stop all services
./scripts/stop-development.sh
\`\`\`

### Method 2: Manual Start

Open separate terminals for each service:

\`\`\`bash
# Terminal 1: Laravel API Gateway
cd apps/laravel-core
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2: Next.js Frontend
cd apps/nextjs-frontend
npm run dev

# Terminal 3: Identity Service
cd apps/svc-identity
npm run start:dev

# Terminal 4: Catalog Service
cd apps/svc-catalog
npm run start:dev

# Terminal 5: Orders Service
cd apps/svc-orders
npm run start:dev
\`\`\`

## Verification

### Check Service Health

\`\`\`bash
# Check API Gateway
curl http://localhost:8000/api/health

# Check Identity Service
curl http://localhost:3001/health

# Check Catalog Service
curl http://localhost:3002/health

# Check Orders Service
curl http://localhost:3004/health
\`\`\`

### Access Applications

- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/documentation

### Test Login

Use these default credentials:
- **Email**: admin@ecommerce.local
- **Password**: password

## Troubleshooting

### Common Issues

#### Port Conflicts
If ports are already in use, update the port configurations in:
- `infrastructure/docker-compose.yml`
- Environment files
- Application configurations

#### Database Connection Issues
\`\`\`bash
# Check PostgreSQL logs
docker-compose -f infrastructure/docker-compose.yml logs postgres

# Reset database
docker-compose -f infrastructure/docker-compose.yml down -v
docker-compose -f infrastructure/docker-compose.yml up -d
\`\`\`

#### Permission Issues (Linux/macOS)
\`\`\`bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
chmod +x scripts/*.sh
\`\`\`

#### Memory Issues
\`\`\`bash
# Increase Docker memory limit to 8GB+
# Check Docker Desktop settings or daemon configuration
\`\`\`

### Getting Help

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review Docker logs: `docker-compose -f infrastructure/docker-compose.yml logs`
3. Check application logs in respective directories
4. Create an issue on GitHub with error details

## Next Steps

After successful setup:
1. Read the [Development Guide](DEVELOPMENT.md)
2. Explore the [API Documentation](API.md)
3. Review the [Architecture Guide](ARCHITECTURE.md)
4. Start building your e-commerce features!
