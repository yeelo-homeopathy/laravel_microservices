#!/bin/bash

# =============================================================================
# E-COMMERCE PLATFORM - SETUP VALIDATION SCRIPT
# =============================================================================
# This script validates that the platform is properly set up and configured
# Run this before starting development
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VALIDATION_ERRORS=0

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((VALIDATION_ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

validate_file() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        print_success "$description exists"
    else
        print_error "$description missing: $file_path"
    fi
}

validate_directory() {
    local dir_path="$1"
    local description="$2"
    
    if [ -d "$dir_path" ]; then
        print_success "$description exists"
    else
        print_error "$description missing: $dir_path"
    fi
}

validate_command() {
    local command="$1"
    local description="$2"
    
    if command -v "$command" &> /dev/null; then
        print_success "$description is installed"
    else
        print_error "$description is not installed: $command"
    fi
}

validate_env_var() {
    local var_name="$1"
    local file_path="$2"
    local description="$3"
    
    if grep -q "^$var_name=" "$file_path" 2>/dev/null; then
        local value=$(grep "^$var_name=" "$file_path" | cut -d'=' -f2- | tr -d '"')
        if [ -n "$value" ] && [ "$value" != "your_value_here" ] && [ "$value" != "change_me" ]; then
            print_success "$description is configured"
        else
            print_error "$description needs to be set in $file_path"
        fi
    else
        print_error "$description missing in $file_path"
    fi
}

echo "🔍 Validating E-commerce Platform Setup..."
echo "=========================================="

# =============================================================================
# SYSTEM REQUIREMENTS
# =============================================================================
print_status "Checking System Requirements..."

validate_command "docker" "Docker"
validate_command "docker-compose" "Docker Compose"
validate_command "node" "Node.js"
validate_command "npm" "npm"
validate_command "php" "PHP"
validate_command "composer" "Composer"

# Check versions
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_success "Node.js version is compatible (v$(node --version | cut -d'v' -f2))"
    else
        print_error "Node.js version too old. Required: v18+, Found: $(node --version)"
    fi
fi

if command -v php &> /dev/null; then
    PHP_VERSION=$(php --version | head -n1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$(echo "$PHP_VERSION >= 8.2" | bc)" -eq 1 ] 2>/dev/null; then
        print_success "PHP version is compatible ($PHP_VERSION)"
    else
        print_error "PHP version too old. Required: 8.2+, Found: $PHP_VERSION"
    fi
fi

# =============================================================================
# PROJECT STRUCTURE
# =============================================================================
print_status "Checking Project Structure..."

validate_directory "apps" "Apps directory"
validate_directory "apps/laravel-core" "Laravel core application"
validate_directory "apps/nextjs-frontend" "Next.js frontend"
validate_directory "apps/svc-identity" "Identity service"
validate_directory "apps/svc-catalog" "Catalog service"
validate_directory "apps/svc-orders" "Orders service"
validate_directory "infrastructure" "Infrastructure directory"
validate_directory "scripts" "Scripts directory"
validate_directory "docs" "Documentation directory"

# =============================================================================
# CONFIGURATION FILES
# =============================================================================
print_status "Checking Configuration Files..."

validate_file ".env" "Main environment file"
validate_file "apps/laravel-core/.env" "Laravel environment file"
validate_file "apps/nextjs-frontend/.env.local" "Next.js environment file"
validate_file "apps/svc-identity/.env" "Identity service environment file"
validate_file "apps/svc-catalog/.env" "Catalog service environment file"
validate_file "apps/svc-orders/.env" "Orders service environment file"

validate_file "docker-compose.yml" "Main Docker Compose file"
validate_file "infrastructure/docker-compose.yml" "Infrastructure Docker Compose file"
validate_file "infrastructure/nginx/default.conf" "Nginx configuration"

# =============================================================================
# ENVIRONMENT VARIABLES
# =============================================================================
print_status "Checking Environment Variables..."

# Check main .env file
if [ -f ".env" ]; then
    validate_env_var "SUPABASE_URL" ".env" "Supabase URL"
    validate_env_var "SUPABASE_ANON_KEY" ".env" "Supabase Anonymous Key"
    validate_env_var "NEXT_PUBLIC_API_URL" ".env" "API URL"
fi

# Check Laravel .env file
if [ -f "apps/laravel-core/.env" ]; then
    validate_env_var "APP_KEY" "apps/laravel-core/.env" "Laravel App Key"
    validate_env_var "DB_CONNECTION" "apps/laravel-core/.env" "Database Connection"
fi

# Check Next.js .env file
if [ -f "apps/nextjs-frontend/.env.local" ]; then
    validate_env_var "NEXT_PUBLIC_API_URL" "apps/nextjs-frontend/.env.local" "Next.js API URL"
fi

# =============================================================================
# DEPENDENCIES
# =============================================================================
print_status "Checking Dependencies..."

# Check Laravel dependencies
if [ -f "apps/laravel-core/composer.json" ]; then
    if [ -d "apps/laravel-core/vendor" ]; then
        print_success "Laravel dependencies installed"
    else
        print_error "Laravel dependencies not installed. Run: cd apps/laravel-core && composer install"
    fi
fi

# Check Next.js dependencies
if [ -f "apps/nextjs-frontend/package.json" ]; then
    if [ -d "apps/nextjs-frontend/node_modules" ]; then
        print_success "Next.js dependencies installed"
    else
        print_error "Next.js dependencies not installed. Run: cd apps/nextjs-frontend && npm install"
    fi
fi

# Check microservice dependencies
for service in svc-identity svc-catalog svc-orders; do
    if [ -f "apps/$service/package.json" ]; then
        if [ -d "apps/$service/node_modules" ]; then
            print_success "$service dependencies installed"
        else
            print_error "$service dependencies not installed. Run: cd apps/$service && npm install"
        fi
    fi
done

# =============================================================================
# DOCKER CONFIGURATION
# =============================================================================
print_status "Checking Docker Configuration..."

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
fi

# Check Docker Compose files syntax
if docker-compose -f infrastructure/docker-compose.yml config > /dev/null 2>&1; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors"
fi

# =============================================================================
# DATABASE SCRIPTS
# =============================================================================
print_status "Checking Database Scripts..."

validate_file "scripts/complete-database-dump.sql" "Complete database dump script"
validate_file "scripts/seed-sample-data.sql" "Sample data script"
validate_file "scripts/setup-complete-environment.sh" "Complete setup script"

# Check if scripts are executable
for script in scripts/*.sh; do
    if [ -x "$script" ]; then
        print_success "$(basename "$script") is executable"
    else
        print_warning "$(basename "$script") is not executable. Run: chmod +x $script"
    fi
done

# =============================================================================
# PORT AVAILABILITY
# =============================================================================
print_status "Checking Port Availability..."

check_port() {
    local port="$1"
    local service="$2"
    
    if lsof -i ":$port" > /dev/null 2>&1; then
        print_warning "Port $port is already in use (needed for $service)"
    else
        print_success "Port $port is available for $service"
    fi
}

check_port 3000 "Next.js Frontend"
check_port 8000 "Laravel API Gateway"
check_port 3001 "Identity Service"
check_port 3002 "Catalog Service"
check_port 3004 "Orders Service"
check_port 5432 "PostgreSQL"
check_port 27017 "MongoDB"
check_port 6379 "Redis"
check_port 9092 "Kafka"

# =============================================================================
# FINAL VALIDATION RESULTS
# =============================================================================
echo ""
echo "=========================================="
echo "🔍 Validation Results"
echo "=========================================="

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All validations passed!${NC}"
    echo ""
    echo "Your e-commerce platform is properly configured and ready to start."
    echo ""
    echo "Next steps:"
    echo "1. Start the platform: ./scripts/start-development.sh"
    echo "2. Run integration tests: ./scripts/test-integration.sh"
    echo "3. Access the frontend: http://localhost:3000"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Found $VALIDATION_ERRORS validation error(s)!${NC}"
    echo ""
    echo "Please fix the errors above before starting the platform."
    echo ""
    echo "Common fixes:"
    echo "1. Run the setup script: ./scripts/setup-complete-environment.sh"
    echo "2. Copy environment files: cp .env.example .env"
    echo "3. Install dependencies: npm install && composer install"
    echo "4. Make scripts executable: chmod +x scripts/*.sh"
    echo ""
    exit 1
fi
