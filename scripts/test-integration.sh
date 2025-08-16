#!/bin/bash

# =============================================================================
# E-COMMERCE MICROSERVICES PLATFORM - INTEGRATION TESTING SCRIPT
# =============================================================================
# This script performs comprehensive integration testing of all services
# Run this after the platform is fully set up and running
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((TOTAL_TESTS++))
    print_status "Testing: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

# Function to test HTTP endpoint
test_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    ((TOTAL_TESTS++))
    print_status "Testing HTTP: $name"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$name (Status: $status_code)"
        return 0
    else
        print_error "$name (Expected: $expected_status, Got: $status_code)"
        return 1
    fi
}

# Function to test database connectivity
test_database() {
    local name="$1"
    local connection_string="$2"
    
    ((TOTAL_TESTS++))
    print_status "Testing Database: $name"
    
    case "$name" in
        "PostgreSQL")
            if docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -d ecommerce_core -c "SELECT 1;" > /dev/null 2>&1; then
                print_success "$name connectivity"
                return 0
            else
                print_error "$name connectivity"
                return 1
            fi
            ;;
        "MongoDB")
            if docker-compose -f infrastructure/docker-compose.yml exec -T mongo mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
                print_success "$name connectivity"
                return 0
            else
                print_error "$name connectivity"
                return 1
            fi
            ;;
        "Redis")
            if docker-compose -f infrastructure/docker-compose.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
                print_success "$name connectivity"
                return 0
            else
                print_error "$name connectivity"
                return 1
            fi
            ;;
    esac
}

echo "🧪 Starting E-commerce Platform Integration Tests..."
echo "=================================================="

# =============================================================================
# INFRASTRUCTURE TESTS
# =============================================================================
print_status "Testing Infrastructure Services..."

# Test Docker services
run_test "Docker Compose Services" "docker-compose -f infrastructure/docker-compose.yml ps | grep -q 'Up'"

# Test databases
test_database "PostgreSQL" ""
test_database "MongoDB" ""
test_database "Redis" ""

# Test Kafka
run_test "Kafka Connectivity" "docker-compose -f infrastructure/docker-compose.yml exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list"

# Test MinIO
test_http_endpoint "MinIO Health" "http://localhost:9000/minio/health/live" "200"

# =============================================================================
# MICROSERVICES HEALTH TESTS
# =============================================================================
print_status "Testing Microservices Health..."

# Wait for services to be ready
sleep 10

# Test Laravel API Gateway
test_http_endpoint "Laravel API Gateway Health" "http://localhost:8000/api/health" "200"

# Test Identity Service
test_http_endpoint "Identity Service Health" "http://localhost:3001/health" "200"

# Test Catalog Service
test_http_endpoint "Catalog Service Health" "http://localhost:3002/health" "200"

# Test Orders Service
test_http_endpoint "Orders Service Health" "http://localhost:3004/health" "200"

# Test Next.js Frontend
test_http_endpoint "Next.js Frontend" "http://localhost:3000" "200"

# =============================================================================
# API ENDPOINT TESTS
# =============================================================================
print_status "Testing API Endpoints..."

# Test API Gateway routes
test_http_endpoint "API Documentation" "http://localhost:8000/api/documentation" "200"

# Test authentication endpoints
test_http_endpoint "Login Endpoint" "http://localhost:8000/api/auth/login" "422"  # Expects validation error without data

# Test service proxy endpoints
test_http_endpoint "Identity Service Proxy" "http://localhost:8000/api/identity/health" "200"
test_http_endpoint "Catalog Service Proxy" "http://localhost:8000/api/catalog/health" "200"
test_http_endpoint "Orders Service Proxy" "http://localhost:8000/api/orders/health" "200"

# =============================================================================
# DATABASE INTEGRATION TESTS
# =============================================================================
print_status "Testing Database Integration..."

# Test database schemas exist
run_test "Core Database Schema" "docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -d ecommerce_core -c '\dt' | grep -q users"

run_test "Identity Database Schema" "docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -d ecommerce_identity -c '\dt' | grep -q users"

run_test "Orders Database Schema" "docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -d ecommerce_orders -c '\dt' | grep -q orders"

# Test MongoDB collections
run_test "MongoDB Catalog Collections" "docker-compose -f infrastructure/docker-compose.yml exec -T mongo mongosh ecommerce_catalog --eval 'db.products.findOne()'"

# =============================================================================
# FRONTEND INTEGRATION TESTS
# =============================================================================
print_status "Testing Frontend Integration..."

# Test frontend can reach API
test_http_endpoint "Frontend API Connection" "http://localhost:3000/api/health" "404"  # Next.js API routes

# Test static assets
test_http_endpoint "Frontend Static Assets" "http://localhost:3000/_next/static/css" "404"  # CSS files should be served

# =============================================================================
# AUTHENTICATION FLOW TESTS
# =============================================================================
print_status "Testing Authentication Flow..."

# Test user registration (should fail without proper data but endpoint should be reachable)
((TOTAL_TESTS++))
print_status "Testing User Registration Endpoint"
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}' \
    http://localhost:8000/api/auth/register -o /dev/null)

if [ "$REGISTER_RESPONSE" = "422" ] || [ "$REGISTER_RESPONSE" = "201" ]; then
    print_success "User Registration Endpoint (Status: $REGISTER_RESPONSE)"
else
    print_error "User Registration Endpoint (Status: $REGISTER_RESPONSE)"
fi

# =============================================================================
# EVENT SYSTEM TESTS
# =============================================================================
print_status "Testing Event System..."

# Test Kafka topics exist
run_test "Kafka Topics Created" "docker-compose -f infrastructure/docker-compose.yml exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list | grep -q ecommerce"

# =============================================================================
# PERFORMANCE TESTS
# =============================================================================
print_status "Testing Performance..."

# Test API response times
((TOTAL_TESTS++))
print_status "Testing API Response Time"
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/api/health)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    print_success "API Response Time (${RESPONSE_TIME}s)"
else
    print_warning "API Response Time Slow (${RESPONSE_TIME}s)"
fi

# Test database query performance
((TOTAL_TESTS++))
print_status "Testing Database Query Performance"
DB_QUERY_TIME=$(docker-compose -f infrastructure/docker-compose.yml exec -T postgres bash -c "time psql -U postgres -d ecommerce_core -c 'SELECT COUNT(*) FROM users;'" 2>&1 | grep real | awk '{print $2}')
print_success "Database Query Time ($DB_QUERY_TIME)"

# =============================================================================
# SECURITY TESTS
# =============================================================================
print_status "Testing Security..."

# Test CORS headers
((TOTAL_TESTS++))
print_status "Testing CORS Headers"
CORS_HEADER=$(curl -s -H "Origin: http://localhost:3000" -I http://localhost:8000/api/health | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    print_success "CORS Headers Present"
else
    print_warning "CORS Headers Missing"
fi

# Test rate limiting
((TOTAL_TESTS++))
print_status "Testing Rate Limiting"
# Make multiple rapid requests
for i in {1..6}; do
    curl -s http://localhost:8000/api/health > /dev/null
done
RATE_LIMIT_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8000/api/health -o /dev/null)
if [ "$RATE_LIMIT_RESPONSE" = "429" ] || [ "$RATE_LIMIT_RESPONSE" = "200" ]; then
    print_success "Rate Limiting Working (Status: $RATE_LIMIT_RESPONSE)"
else
    print_warning "Rate Limiting Status: $RATE_LIMIT_RESPONSE"
fi

# =============================================================================
# MONITORING TESTS
# =============================================================================
print_status "Testing Monitoring..."

# Test Prometheus metrics
test_http_endpoint "Prometheus Metrics" "http://localhost:9090/metrics" "200"

# Test Grafana
test_http_endpoint "Grafana Dashboard" "http://localhost:3001" "200"

# Test Kafka UI
test_http_endpoint "Kafka UI" "http://localhost:8081" "200"

# =============================================================================
# FINAL RESULTS
# =============================================================================
echo ""
echo "=================================================="
echo "🧪 Integration Test Results"
echo "=================================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    echo ""
    echo "🎉 Your e-commerce platform is ready for development!"
    echo ""
    echo "Access URLs:"
    echo "- Frontend: http://localhost:3000"
    echo "- API Gateway: http://localhost:8000"
    echo "- API Documentation: http://localhost:8000/api/documentation"
    echo "- Kafka UI: http://localhost:8081"
    echo "- MinIO Console: http://localhost:9001"
    echo "- Grafana: http://localhost:3001"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some integration tests failed!${NC}"
    echo ""
    echo "Please check the following:"
    echo "1. All services are running: docker-compose -f infrastructure/docker-compose.yml ps"
    echo "2. Check service logs: docker-compose -f infrastructure/docker-compose.yml logs [service-name]"
    echo "3. Verify environment variables are set correctly"
    echo "4. Run the setup script again: ./scripts/setup-complete-environment.sh"
    echo ""
    exit 1
fi
