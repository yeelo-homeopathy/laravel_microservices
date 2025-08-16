#!/bin/bash

# =============================================================================
# E-COMMERCE MICROSERVICES PLATFORM - STOP DEVELOPMENT SERVERS
# =============================================================================
# This script stops all development servers
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "🛑 Stopping E-commerce Microservices Platform..."

# Function to stop service
stop_service() {
    local service_name=$1
    local pid_file="${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            print_success "$service_name stopped (PID: $pid)"
        else
            print_status "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_status "No PID file found for $service_name"
    fi
}

# Stop all services
stop_service "Laravel API Gateway"
stop_service "Identity Service"
stop_service "Catalog Service"
stop_service "Orders Service"
stop_service "Next.js Frontend"

# Stop Docker services
print_status "Stopping Docker infrastructure..."
docker-compose -f infrastructure/docker-compose.yml down

print_success "🎉 All services stopped successfully!"
