# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the E-commerce Microservices Platform.

## Quick Diagnostics

### Health Check Commands

\`\`\`bash
# Check all Docker services
docker-compose -f infrastructure/docker-compose.yml ps

# Check service logs
docker-compose -f infrastructure/docker-compose.yml logs [service-name]

# Check API Gateway health
curl http://localhost:8000/api/health

# Check microservice health
curl http://localhost:3001/health  # Identity Service
curl http://localhost:3002/health  # Catalog Service
curl http://localhost:3004/health  # Orders Service
\`\`\`

### System Status

\`\`\`bash
# Check port usage
netstat -tulpn | grep -E ':(3000|3001|3002|3004|8000|5432|27017|6379|9092)'

# Check disk space
df -h

# Check memory usage
free -h

# Check Docker resources
docker system df
\`\`\`

## Common Issues

### 1. Port Already in Use

**Symptoms**:
- Error: "Port 3000 is already in use"
- Services fail to start

**Solutions**:

\`\`\`bash
# Find process using the port
lsof -i :3000
# or
netstat -tulpn | grep :3000

# Kill the process
kill -9 <PID>

# Alternative: Change port in configuration
# Edit .env files or docker-compose.yml
\`\`\`

**Prevention**:
- Use the stop script: `./scripts/stop-development.sh`
- Check for running processes before starting

### 2. Database Connection Issues

**Symptoms**:
- "Connection refused" errors
- Services can't connect to PostgreSQL/MongoDB

**Diagnosis**:
\`\`\`bash
# Check database containers
docker-compose -f infrastructure/docker-compose.yml ps postgres mongodb

# Check database logs
docker-compose -f infrastructure/docker-compose.yml logs postgres
docker-compose -f infrastructure/docker-compose.yml logs mongodb

# Test connection manually
docker-compose -f infrastructure/docker-compose.yml exec postgres psql -U postgres -d ecommerce_core -c "SELECT 1;"
\`\`\`

**Solutions**:

\`\`\`bash
# Restart database services
docker-compose -f infrastructure/docker-compose.yml restart postgres mongodb

# Reset database (WARNING: This deletes all data)
docker-compose -f infrastructure/docker-compose.yml down -v
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait for services to be ready
sleep 30

# Re-run database setup
docker-compose -f infrastructure/docker-compose.yml exec -T postgres psql -U postgres -f /docker-entrypoint-initdb.d/complete-database-dump.sql
\`\`\`

### 3. Environment Variable Issues

**Symptoms**:
- Services fail to start with configuration errors
- Authentication failures
- API connection errors

**Diagnosis**:
\`\`\`bash
# Check if .env files exist
ls -la .env apps/*/.env*

# Validate environment variables
cd apps/laravel-core && php artisan config:show
\`\`\`

**Solutions**:

\`\`\`bash
# Recreate environment files
cp .env.example .env
cp apps/laravel-core/.env.example apps/laravel-core/.env
cp apps/nextjs-frontend/.env.example apps/nextjs-frontend/.env.local

# Generate new Laravel key
cd apps/laravel-core && php artisan key:generate

# Clear Laravel config cache
php artisan config:clear && php artisan cache:clear
\`\`\`

### 4. Docker Issues

**Symptoms**:
- Docker containers won't start
- Out of disk space errors
- Permission denied errors

**Diagnosis**:
\`\`\`bash
# Check Docker status
docker info

# Check disk usage
docker system df

# Check container status
docker ps -a
\`\`\`

**Solutions**:

\`\`\`bash
# Clean up Docker resources
docker system prune -f
docker volume prune -f

# Restart Docker daemon (Linux)
sudo systemctl restart docker

# Fix permissions (Linux/macOS)
sudo chown -R $USER:$USER .
chmod -R 755 .
\`\`\`

### 5. Node.js/npm Issues

**Symptoms**:
- npm install failures
- Module not found errors
- Build failures

**Diagnosis**:
\`\`\`bash
# Check Node.js version
node --version  # Should be 18+
npm --version   # Should be 8+

# Check for package-lock.json conflicts
ls -la */package-lock.json
\`\`\`

**Solutions**:

\`\`\`bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For all services
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "package-lock.json" -delete
./scripts/setup-complete-environment.sh
\`\`\`

### 6. PHP/Composer Issues

**Symptoms**:
- Composer install failures
- PHP extension errors
- Laravel errors

**Diagnosis**:
\`\`\`bash
# Check PHP version and extensions
php --version
php -m | grep -E "(pdo|pgsql|mbstring|xml|curl|zip)"

# Check Composer
composer --version
\`\`\`

**Solutions**:

\`\`\`bash
# Install missing PHP extensions (Ubuntu/Debian)
sudo apt-get install php8.2-pgsql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip

# Clear Composer cache
composer clear-cache

# Reinstall dependencies
cd apps/laravel-core
rm -rf vendor composer.lock
composer install --optimize-autoloader
\`\`\`

### 7. Kafka/Event System Issues

**Symptoms**:
- Real-time features not working
- Event processing failures
- Kafka connection errors

**Diagnosis**:
\`\`\`bash
# Check Kafka containers
docker-compose -f infrastructure/docker-compose.yml ps kafka zookeeper

# Check Kafka logs
docker-compose -f infrastructure/docker-compose.yml logs kafka

# List Kafka topics
docker-compose -f infrastructure/docker-compose.yml exec kafka kafka-topics --bootstrap-server localhost:9092 --list
\`\`\`

**Solutions**:

\`\`\`bash
# Restart Kafka services
docker-compose -f infrastructure/docker-compose.yml restart zookeeper kafka

# Reset Kafka (WARNING: Deletes all messages)
docker-compose -f infrastructure/docker-compose.yml down
docker volume rm $(docker volume ls -q | grep kafka)
docker-compose -f infrastructure/docker-compose.yml up -d
\`\`\`

### 8. Frontend Build Issues

**Symptoms**:
- Next.js build failures
- TypeScript errors
- Missing dependencies

**Diagnosis**:
\`\`\`bash
# Check build logs
cd apps/nextjs-frontend
npm run build 2>&1 | tee build.log

# Check TypeScript
npx tsc --noEmit
\`\`\`

**Solutions**:

\`\`\`bash
# Clear Next.js cache
cd apps/nextjs-frontend
rm -rf .next
npm run build

# Fix TypeScript issues
npm run type-check

# Update dependencies
npm update
\`\`\`

### 9. Authentication Issues

**Symptoms**:
- Login failures
- JWT token errors
- Supabase connection issues

**Diagnosis**:
\`\`\`bash
# Check Supabase configuration
grep SUPABASE .env apps/nextjs-frontend/.env.local

# Test API authentication
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/user
\`\`\`

**Solutions**:

\`\`\`bash
# Verify Supabase credentials
# Check your Supabase dashboard for correct URLs and keys

# Clear authentication cache
# In browser: Clear cookies and localStorage
# In app: Restart services
\`\`\`

### 10. Performance Issues

**Symptoms**:
- Slow response times
- High memory usage
- Database query timeouts

**Diagnosis**:
\`\`\`bash
# Check system resources
top
htop  # If available

# Check database performance
docker-compose -f infrastructure/docker-compose.yml exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/health
\`\`\`

**Solutions**:

\`\`\`bash
# Optimize database
docker-compose -f infrastructure/docker-compose.yml exec postgres psql -U postgres -c "VACUUM ANALYZE;"

# Clear caches
cd apps/laravel-core
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Restart services
./scripts/stop-development.sh
./scripts/start-development.sh
\`\`\`

## Advanced Debugging

### Enable Debug Mode

\`\`\`bash
# Laravel debug mode
cd apps/laravel-core
echo "APP_DEBUG=true" >> .env
echo "LOG_LEVEL=debug" >> .env

# Next.js debug mode
cd apps/nextjs-frontend
echo "NODE_ENV=development" >> .env.local
\`\`\`

### Database Debugging

\`\`\`bash
# Enable PostgreSQL query logging
docker-compose -f infrastructure/docker-compose.yml exec postgres psql -U postgres -c "ALTER SYSTEM SET log_statement = 'all';"
docker-compose -f infrastructure/docker-compose.yml restart postgres

# Monitor database queries
docker-compose -f infrastructure/docker-compose.yml logs -f postgres | grep "LOG:"
\`\`\`

### Network Debugging

\`\`\`bash
# Check service connectivity
docker-compose -f infrastructure/docker-compose.yml exec laravel-core ping postgres
docker-compose -f infrastructure/docker-compose.yml exec nextjs-frontend ping laravel-core

# Check DNS resolution
nslookup localhost
\`\`\`

## Getting Help

### Log Collection

When reporting issues, collect these logs:

\`\`\`bash
# Create debug bundle
mkdir debug-logs
docker-compose -f infrastructure/docker-compose.yml logs > debug-logs/docker-logs.txt
cd apps/laravel-core && php artisan log:show > ../../debug-logs/laravel-logs.txt
cd ../nextjs-frontend && npm run build > ../../debug-logs/nextjs-build.log 2>&1
cd ../..

# System information
uname -a > debug-logs/system-info.txt
docker version >> debug-logs/system-info.txt
node --version >> debug-logs/system-info.txt
php --version >> debug-logs/system-info.txt
\`\`\`

### Support Channels

1. **GitHub Issues**: Create detailed issue with logs
2. **Documentation**: Check other docs in `/docs` folder
3. **Community**: GitHub Discussions for questions

### Issue Template

When reporting issues, include:

1. **Environment**: OS, Docker version, Node.js version
2. **Steps to reproduce**: Exact commands run
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Logs**: Relevant error messages and logs
6. **Configuration**: Relevant environment variables (redacted)

---

**Remember**: Most issues are environment-related. The automated setup script resolves 90% of common problems.
