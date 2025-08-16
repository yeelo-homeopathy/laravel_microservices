#!/bin/bash

# =============================================================================
# E-COMMERCE MICROSERVICES PLATFORM - START DEVELOPMENT SERVERS
# =============================================================================
# This script starts all development servers in the correct order
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "🚀 Starting E-commerce Microservices Platform..."

# Start Docker services
print_status "Starting Docker infrastructure..."
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait for services to be ready
print_status "Waiting for infrastructure services..."
sleep 10

# Function to start service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local start_command=$3
    local port=$4
    
    print_status "Starting $service_name on port $port..."
    cd $service_path
    $start_command &
    echo $! > "../${service_name}.pid"
    cd - > /dev/null
    print_success "$service_name started (PID: $(cat ${service_name}.pid))"
}

# Start all services
start_service "Laravel API Gateway" "apps/laravel-core" "php artisan serve --host=0.0.0.0 --port=8000" "8000"
start_service "Identity Service" "apps/svc-identity" "npm run start:dev" "3001"
start_service "Catalog Service" "apps/svc-catalog" "npm run start:dev" "3002"
start_service "Orders Service" "apps/svc-orders" "npm run start:dev" "3004"
start_service "Next.js Frontend" "apps/nextjs-frontend" "npm run dev" "3000"

print_success "🎉 All services started successfully!"
print_status "Access the application at:"
echo "- Frontend: http://localhost:3000"
echo "- API Gateway: http://localhost:8000"
echo "- API Documentation: http://localhost:8000/api/documentation"
echo ""
print_status "To stop all services, run: ./scripts/stop-development.sh"
