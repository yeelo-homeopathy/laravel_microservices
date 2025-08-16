#!/bin/bash

# =============================================================================
# E-COMMERCE MICROSERVICES PLATFORM - COMPLETE ENVIRONMENT SETUP
# =============================================================================
# This script sets up the complete development environment
# Run this after cloning the repository
# =============================================================================

set -e

echo "🚀 Setting up E-commerce Microservices Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js (v18 or higher) first."
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    print_error "PHP is not installed. Please install PHP (v8.2 or higher) first."
    exit 1
fi

# Check if Composer is installed
if ! command -v composer &> /dev/null; then
    print_error "Composer is not installed. Please install Composer first."
    exit 1
fi

print_status "All prerequisites are installed ✅"

# Create environment files if they don't exist
print_status "Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created main .env file"
else
    print_warning ".env file already exists"
fi

if [ ! -f apps/laravel-core/.env ]; then
    cp apps/laravel-core/.env.example apps/laravel-core/.env
    print_success "Created Laravel .env file"
else
    print_warning "Laravel .env file already exists"
fi

if [ ! -f apps/nextjs-frontend/.env.local ]; then
    cp apps/nextjs-frontend/.env.example apps/nextjs-frontend/.env.local
    print_success "Created Next.js .env.local file"
else
    print_warning "Next.js .env.local file already exists"
fi

if [ ! -f apps/svc-identity/.env ]; then
    cp apps/svc-identity/.env.example apps/svc-identity/.env
    print_success "Created Identity service .env file"
else
    print_warning "Identity service .env file already exists"
fi

if [ ! -f apps/svc-catalog/.env ]; then
    cp apps/svc-catalog/.env.example apps/svc-catalog/.env
    print_success "Created Catalog service .env file"
else
    print_warning "Catalog service .env file already exists"
fi

if [ ! -f apps/svc-orders/.env ]; then
    cp apps/svc-orders/.env.example apps/svc-orders/.env
    print_success "Created Orders service .env file"
else
    print_warning "Orders service .env file already exists"
fi

# Generate Laravel application key
print_status "Generating Laravel application key..."
cd apps/laravel-core
if ! grep -q "APP_KEY=base64:" .env; then
    php artisan key:generate
    print_success "Laravel application key generated"
else
    print_warning "Laravel application key already exists"
fi
cd ../..

# Install dependencies
print_status "Installing dependencies..."

# Install Laravel dependencies
print_status "Installing Laravel dependencies..."
cd apps/laravel-core
composer install --no-dev --optimize-autoloader
print_success "Laravel dependencies installed"
cd ../..

# Install Next.js frontend dependencies
print_status "Installing Next.js frontend dependencies..."
cd apps/nextjs-frontend
npm install
print_success "Next.js frontend dependencies installed"
cd ../..

# Install Identity service dependencies
print_status "Installing Identity service dependencies..."
cd apps/svc-identity
npm install
print_success "Identity service dependencies installed"
cd ../..

# Install Catalog service dependencies
print_status "Installing Catalog service dependencies..."
cd apps/svc-catalog
npm install
print_success "Catalog service dependencies installed"
cd ../..

# Install Orders service dependencies
print_status "Installing Orders service dependencies..."
cd apps/svc-orders
npm install
print_success "Orders service dependencies installed"
cd ../..

# Install root dependencies
print_status "Installing root dependencies..."
npm install
print_success "Root dependencies installed"

# Start Docker services
print_status "Starting Docker services..."
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Setup databases
print_status "Setting up databases..."
docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -f /docker-entrypoint-initdb.d/complete-database-dump.sql

# Run Laravel migrations
print_status "Running Laravel migrations..."
cd apps/laravel-core
php artisan migrate --force
php artisan db:seed --force
print_success "Laravel migrations completed"
cd ../..

# Build Next.js application
print_status "Building Next.js application..."
cd apps/nextjs-frontend
npm run build
print_success "Next.js application built"
cd ../..

# Build microservices
print_status "Building microservices..."
cd apps/svc-identity
npm run build
print_success "Identity service built"
cd ../..

cd apps/svc-catalog
npm run build
print_success "Catalog service built"
cd ../..

cd apps/svc-orders
npm run build
print_success "Orders service built"
cd ../..

print_success "🎉 Setup completed successfully!"
print_status "You can now start the development servers:"
echo ""
echo "1. Start all services:"
echo "   docker-compose -f infrastructure/docker-compose.yml up -d"
echo ""
echo "2. Start Laravel API Gateway:"
echo "   cd apps/laravel-core && php artisan serve --host=0.0.0.0 --port=8000"
echo ""
echo "3. Start Next.js Frontend:"
echo "   cd apps/nextjs-frontend && npm run dev"
echo ""
echo "4. Start Identity Service:"
echo "   cd apps/svc-identity && npm run start:dev"
echo ""
echo "5. Start Catalog Service:"
echo "   cd apps/svc-catalog && npm run start:dev"
echo ""
echo "6. Start Orders Service:"
echo "   cd apps/svc-orders && npm run start:dev"
echo ""
print_status "Access the application at:"
echo "- Frontend: http://localhost:3000"
echo "- API Gateway: http://localhost:8000"
echo "- API Documentation: http://localhost:8000/api/documentation"
echo ""
print_success "Happy coding! 🚀"
