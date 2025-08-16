#!/bin/bash

# =============================================================================
# E-COMMERCE PLATFORM - LOAD TESTING SCRIPT
# =============================================================================
# This script performs basic load testing on the platform
# Requires 'ab' (Apache Bench) to be installed
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Apache Bench is installed
if ! command -v ab &> /dev/null; then
    print_warning "Apache Bench (ab) is not installed."
    print_status "Installing Apache Bench..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y apache2-utils
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install httpd
    else
        echo "Please install Apache Bench manually"
        exit 1
    fi
fi

echo "🚀 Starting Load Tests for E-commerce Platform..."
echo "================================================"

# Test configuration
CONCURRENT_USERS=10
TOTAL_REQUESTS=100
BASE_URL="http://localhost:8000"

# =============================================================================
# API GATEWAY LOAD TESTS
# =============================================================================
print_status "Testing API Gateway Load..."

print_status "Health endpoint load test..."
ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS "$BASE_URL/api/health" > /tmp/health_load_test.txt 2>&1

# Extract key metrics
REQUESTS_PER_SECOND=$(grep "Requests per second" /tmp/health_load_test.txt | awk '{print $4}')
MEAN_TIME=$(grep "Time per request" /tmp/health_load_test.txt | head -1 | awk '{print $4}')
FAILED_REQUESTS=$(grep "Failed requests" /tmp/health_load_test.txt | awk '{print $3}')

print_success "Health Endpoint Results:"
echo "  - Requests per second: $REQUESTS_PER_SECOND"
echo "  - Mean response time: ${MEAN_TIME}ms"
echo "  - Failed requests: $FAILED_REQUESTS"

# =============================================================================
# MICROSERVICES LOAD TESTS
# =============================================================================
print_status "Testing Microservices Load..."

# Test Identity Service
print_status "Identity service load test..."
ab -n 50 -c 5 "http://localhost:3001/health" > /tmp/identity_load_test.txt 2>&1
IDENTITY_RPS=$(grep "Requests per second" /tmp/identity_load_test.txt | awk '{print $4}')
print_success "Identity Service: $IDENTITY_RPS requests/sec"

# Test Catalog Service
print_status "Catalog service load test..."
ab -n 50 -c 5 "http://localhost:3002/health" > /tmp/catalog_load_test.txt 2>&1
CATALOG_RPS=$(grep "Requests per second" /tmp/catalog_load_test.txt | awk '{print $4}')
print_success "Catalog Service: $CATALOG_RPS requests/sec"

# Test Orders Service
print_status "Orders service load test..."
ab -n 50 -c 5 "http://localhost:3004/health" > /tmp/orders_load_test.txt 2>&1
ORDERS_RPS=$(grep "Requests per second" /tmp/orders_load_test.txt | awk '{print $4}')
print_success "Orders Service: $ORDERS_RPS requests/sec"

# =============================================================================
# FRONTEND LOAD TESTS
# =============================================================================
print_status "Testing Frontend Load..."

print_status "Frontend homepage load test..."
ab -n 50 -c 5 "http://localhost:3000/" > /tmp/frontend_load_test.txt 2>&1
FRONTEND_RPS=$(grep "Requests per second" /tmp/frontend_load_test.txt | awk '{print $4}')
print_success "Frontend: $FRONTEND_RPS requests/sec"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "================================================"
echo "🚀 Load Test Summary"
echo "================================================"
echo "API Gateway Health: $REQUESTS_PER_SECOND req/sec"
echo "Identity Service: $IDENTITY_RPS req/sec"
echo "Catalog Service: $CATALOG_RPS req/sec"
echo "Orders Service: $ORDERS_RPS req/sec"
echo "Frontend: $FRONTEND_RPS req/sec"
echo ""
echo "Test Configuration:"
echo "- Concurrent Users: $CONCURRENT_USERS"
echo "- Total Requests: $TOTAL_REQUESTS"
echo ""

# Performance recommendations
if (( $(echo "$REQUESTS_PER_SECOND < 50" | bc -l) )); then
    print_warning "API Gateway performance is below recommended threshold (50 req/sec)"
    echo "Consider optimizing database queries and enabling caching"
else
    print_success "API Gateway performance is good"
fi

print_status "Load testing completed. Check /tmp/*_load_test.txt for detailed results."
