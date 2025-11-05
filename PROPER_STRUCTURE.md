# Homeopathy ERP - Proper Project Structure

## Project Layout

\`\`\`
homeopathy-erp/
├── frontend/                  # Next.js Frontend (Admin + Customer UI)
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (admin)/           # Admin dashboard
│   │   └── (customer)/        # Customer pages
│   ├── components/            # React components
│   ├── lib/                   # Frontend utilities
│   ├── public/                # Static assets
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.mjs
│
├── backend/                   # Laravel Backend API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # API endpoints
│   │   │   └── Middleware/    # Request middleware
│   │   ├── Models/            # Database models
│   │   └── Services/          # Business logic
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   └── seeders/           # Test data
│   ├── routes/
│   │   └── api.php            # API routes
│   ├── config/
│   ├── Dockerfile
│   ├── .env.example
│   └── composer.json
│
├── docker/                    # Docker configs (if needed)
│   └── nginx/                 # Nginx reverse proxy (optional)
│
├── kubernetes/                # K8s manifests
│   ├── deployment.yml
│   ├── service.yml
│   └── ingress.yml
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│       └── ci-cd.yml
│
├── docs/
│   ├── LOCAL_SETUP.md
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── scripts/
│   ├── init-postgres.sql      # Database initialization
│   ├── setup-local.sh         # Local setup script
│   └── deploy.sh              # Deployment script
│
├── docker-compose.yml         # Local development orchestration
├── .gitignore
├── .env.example               # Root environment template
└── README.md
\`\`\`

## Why This Structure?

### What We REMOVED:
- ❌ Root `/app` folder (moved to `frontend/app`)
- ❌ Duplicate `apps/nextjs-frontend` (moved to just `frontend/`)
- ❌ `svc-catalog`, `svc-identity`, `svc-orders` microservices (not needed - use Laravel)
- ❌ `apps/laravel-core` (moved to just `backend/`)
- ❌ Root `/components`, `/lib` (moved to frontend and backend respectively)

### What We KEPT:
- ✅ Single **Laravel Backend** at `/backend` - handles all business logic, API routes, database models
- ✅ Single **Next.js Frontend** at `/frontend` - handles both admin dashboard and customer UI
- ✅ **Docker Compose** - Simple 3-service setup (PostgreSQL + Redis + Laravel + Next.js)
- ✅ **Proper separation** - Backend and Frontend are independent services
- ✅ **Easy scaling** - Can later add microservices if needed, but keeps things simple now

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Laravel) | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## Getting Started

\`\`\`bash
# 1. Clone repository
git clone <repo>
cd homeopathy-erp

# 2. Start services
docker-compose up -d

# 3. Setup backend
docker-compose exec backend composer install
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan db:seed

# 4. Setup frontend
docker-compose exec frontend npm install

# 5. Access application
# Admin: http://localhost:3000
# Backend API: http://localhost:8000/api
\`\`\`

## Why NO Microservices?

✅ Microservices are good when:
- You have large teams
- Different teams own different services
- Services scale independently
- You need high availability

❌ For your homeopathy ERP:
- Single monolithic backend is sufficient
- All features are tightly coupled
- Easier to debug and maintain
- Simpler deployment
- Can always refactor to microservices later

**One Laravel backend + One Next.js frontend = Simplicity + Power**
