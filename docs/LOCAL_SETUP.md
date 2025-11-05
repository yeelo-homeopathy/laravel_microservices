# Local Development Setup

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v9 or higher (run: `npm install -g pnpm`)
- **Docker**: Latest version with Docker Compose
- **Git**: Latest version
- **PostgreSQL Client** (optional, for direct database access)

## Quick Start (5 minutes)

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url> homeopathy-erp
cd homeopathy-erp

# Copy environment template
cp .env.example .env.local

# Install dependencies
pnpm install
\`\`\`

### 2. Start Services

\`\`\`bash
# Start all Docker services (database, redis, kafka, etc.)
docker-compose -f docker/compose/docker-compose.dev.yml up -d

# Run database migrations and seeds
pnpm run db:setup
pnpm run db:seed
\`\`\`

### 3. Start Development Servers

\`\`\`bash
# Start all services in development mode
pnpm run dev

# Or start individual services:
# Terminal 1: Laravel API
cd apps/laravel-core && pnpm run dev

# Terminal 2: Next.js Admin
cd apps/nextjs-admin && pnpm run dev

# Terminal 3: Next.js Frontend
cd apps/nextjs-frontend && pnpm run dev
\`\`\`

### 4. Access Applications

- **Admin Dashboard**: http://localhost:3000/admin
- **Customer Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

## Detailed Setup

### Environment Configuration

Create `.env.local` from template:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` with your local settings (database credentials, JWT secrets, etc.)

### Database Setup

\`\`\`bash
# Create databases
docker exec ecom_postgres createdb -U postgres homeopathy_erp
docker exec ecom_postgres createdb -U postgres homeopathy_erp_test

# Run migrations
pnpm run db:migrate

# Seed sample data
pnpm run db:seed
\`\`\`

### Docker Services

Available services in `docker-compose.dev.yml`:

- **PostgreSQL**: Port 5432 (user: postgres, password: postgres)
- **Redis**: Port 6379
- **Kafka**: Port 9092 (UI: http://localhost:8081)
- **MailHog**: Port 1025 (UI: http://localhost:8025)

### Monorepo Structure

\`\`\`
apps/
  ├── laravel-core/          # API Gateway & Backend Services
  ├── nextjs-admin/          # Admin Dashboard
  └── nextjs-frontend/       # Customer Frontend

packages/
  ├── shared-types/          # TypeScript types
  ├── shared-utils/          # Utility functions
  └── ui-components/         # Shared UI library
\`\`\`

## Development Workflow

### Running Tests

\`\`\`bash
# Run all tests
pnpm run test

# Run tests in specific app
cd apps/laravel-core && pnpm run test

# Run E2E tests
pnpm run test:e2e
\`\`\`

### Building

\`\`\`bash
# Build all apps
pnpm run build

# Build specific app
cd apps/nextjs-admin && pnpm run build
\`\`\`

### Linting & Formatting

\`\`\`bash
# Lint all code
pnpm run lint

# Format code
pnpm run format
\`\`\`

## Troubleshooting

### Port Already in Use

\`\`\`bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use Docker to stop containers
docker-compose -f docker/compose/docker-compose.dev.yml down
\`\`\`

### Database Connection Failed

\`\`\`bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs ecom_postgres
\`\`\`

### Node Modules Issues

\`\`\`bash
# Clean and reinstall
pnpm run clean
pnpm install
\`\`\`

## Next Steps

- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [API.md](./API.md) for API documentation
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
