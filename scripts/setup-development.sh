#!/bin/bash
# Development environment setup script
# Run this after cloning the repository to set up the complete development environment

set -e

echo "🚀 Setting up E-commerce Platform Development Environment"
echo "========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p apps/{laravel-core,svc-identity,svc-catalog,svc-inventory,svc-orders,svc-payments}
mkdir -p infrastructure/{nginx/ssl,grafana/{dashboards,datasources}}
mkdir -p docs/{api,architecture}

# Generate SSL certificates for development
echo "🔐 Generating SSL certificates for development..."
if [ ! -f infrastructure/nginx/ssl/cert.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout infrastructure/nginx/ssl/key.pem \
        -out infrastructure/nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Create environment files
echo "⚙️  Creating environment configuration files..."

# Laravel .env file
cat > apps/laravel-core/.env << EOF
APP_NAME="E-commerce Platform"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8080

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=ecom_core
DB_USERNAME=ecom_user
DB_PASSWORD=ecom_secure_password

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

# Microservices URLs
IDENTITY_SERVICE_URL=http://svc-identity:3000
CATALOG_SERVICE_URL=http://svc-catalog:3000
INVENTORY_SERVICE_URL=http://svc-inventory:3000
ORDERS_SERVICE_URL=http://svc-orders:3000
PAYMENTS_SERVICE_URL=http://svc-payments:3000

# Kafka Configuration
KAFKA_BROKERS=kafka:9092

# MinIO Configuration
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=ecom_minio
MINIO_SECRET_KEY=ecom_minio_secret_key
MINIO_BUCKET=ecom-assets

# Search Configuration
OPENSEARCH_HOST=opensearch:9200
EOF

# Start the infrastructure
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
services=("postgres:5432" "redis:6379" "kafka:9092" "mongo:27017" "minio:9000")
for service in "${services[@]}"; do
    echo "Checking $service..."
    timeout 30 bash -c "until nc -z ${service/:/ }; do sleep 1; done" || {
        echo "❌ $service is not responding"
        exit 1
    }
    echo "✅ $service is ready"
done

echo ""
echo "🎉 Development environment setup completed!"
echo ""
echo "📋 Service URLs:"
echo "   • Main Application: http://localhost:8080"
echo "   • Admin Panel: http://localhost:8080/admin"
echo "   • API Documentation: http://localhost:8080/api/documentation"
echo "   • Kafka UI: http://localhost:8081"
echo "   • MinIO Console: http://localhost:9001"
echo "   • OpenSearch Dashboards: http://localhost:5601"
echo "   • Grafana: http://localhost:3000 (admin/admin123)"
echo "   • Prometheus: http://localhost:9090"
echo ""
echo "🔧 Next steps:"
echo "   1. Navigate to apps/laravel-core and run: composer install"
echo "   2. Generate Laravel app key: php artisan key:generate"
echo "   3. Run migrations: php artisan migrate"
echo "   4. Install Node.js dependencies: npm install"
echo "   5. Build frontend assets: npm run build"
echo ""
echo "📚 Documentation:"
echo "   • Architecture docs: docs/architecture/"
echo "   • API specifications: docs/api/"
echo ""
