#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Running Complete Test Suite for E-commerce Platform${NC}"
echo "=================================================="

# Check if services are running
echo -e "\n${YELLOW}📋 Checking Prerequisites...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, using default${NC}"
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_core"
fi

if [ -z "$MONGODB_URI" ]; then
    echo -e "${YELLOW}⚠️  MONGODB_URI not set, using default${NC}"
    export MONGODB_URI="mongodb://localhost:27017/ecommerce_catalog"
fi

if [ -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}⚠️  REDIS_URL not set, using default${NC}"
    export REDIS_URL="redis://localhost:6379"
fi

# Install test dependencies if not present
echo -e "\n${YELLOW}📦 Installing Test Dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install testing framework if not present
npm list mocha > /dev/null 2>&1 || npm install --save-dev mocha chai axios

# Start services if not running
echo -e "\n${YELLOW}🚀 Starting Services...${NC}"
./scripts/start-development.sh

# Wait for services to be ready
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Function to run test suite
run_test_suite() {
    local test_name=$1
    local test_file=$2
    
    echo -e "\n${YELLOW}🧪 Running $test_name...${NC}"
    
    if npx mocha "$test_file" --timeout 30000 --reporter spec; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Track test results
total_tests=0
passed_tests=0

# Run Database Integration Tests
total_tests=$((total_tests + 1))
if run_test_suite "Database Integration Tests" "tests/integration/database.test.js"; then
    passed_tests=$((passed_tests + 1))
fi

# Run Microservices Integration Tests
total_tests=$((total_tests + 1))
if run_test_suite "Microservices Integration Tests" "tests/integration/microservices.test.js"; then
    passed_tests=$((passed_tests + 1))
fi

# Run API Gateway Tests
total_tests=$((total_tests + 1))
if run_test_suite "API Gateway Integration Tests" "tests/integration/api-gateway.test.js"; then
    passed_tests=$((passed_tests + 1))
fi

# Run End-to-End Tests
total_tests=$((total_tests + 1))
if run_test_suite "End-to-End User Journey Tests" "tests/e2e/user-journey.test.js"; then
    passed_tests=$((passed_tests + 1))
fi

# Run Load Tests (optional)
echo -e "\n${YELLOW}🔥 Running Load Tests (optional)...${NC}"
if command -v ab > /dev/null 2>&1; then
    ./scripts/load-test.sh
else
    echo -e "${YELLOW}⚠️  Apache Bench (ab) not found, skipping load tests${NC}"
fi

# Generate Test Report
echo -e "\n${YELLOW}📊 Test Results Summary${NC}"
echo "=================================================="
echo -e "Total Test Suites: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your e-commerce platform is ready.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the logs above.${NC}"
    exit 1
fi
