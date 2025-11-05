# Homeopathy ERP - Project Structure

## Root Level Structure
\`\`\`
homeopathy-erp/
├── frontend/              # Next.js Frontend (Customer & Admin UI)
├── backend/               # Laravel Backend API
├── docker/                # Docker configurations
├── kubernetes/            # Kubernetes manifests
├── .github/               # GitHub Actions CI/CD
├── docs/                  # Documentation
├── scripts/               # Setup & deployment scripts
├── docker-compose.yml     # Local development
└── package.json           # Root monorepo config
\`\`\`

## Frontend Structure (`frontend/`)
\`\`\`
frontend/
├── app/                   # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (admin)/           # Admin dashboard routes
│   ├── (customer)/        # Customer-facing routes
│   └── layout.tsx
├── components/            # React components
│   ├── auth/
│   ├── admin/
│   ├── customer/
│   └── ui/
├── lib/                   # Frontend utilities
├── public/                # Static assets
├── package.json
└── tsconfig.json
\`\`\`

## Backend Structure (`backend/`)
\`\`\`
backend/
├── app/
│   ├── Http/Middleware/   # API middleware
│   ├── Http/Controllers/  # API controllers
│   ├── Services/          # Business logic
│   ├── Models/            # Database models
│   └── Events/            # Event handling
├── database/
│   ├── migrations/        # Database migrations
│   └── seeders/           # Database seeders
├── routes/
│   └── api.php            # API routes
├── config/                # Configuration files
├── composer.json
└── .env.example
\`\`\`

## Why This Structure?

1. **Single Backend** - One Laravel API that handles everything
2. **Single Frontend** - One Next.js app for both admin and customer UI
3. **No Duplicates** - Remove redundant `apps/nextjs-frontend` and root `/app`
4. **Clear Separation** - Frontend and backend are independent services
5. **Docker Ready** - Easy to containerize separate services
6. **K8s Ready** - Easy to deploy as microservices if needed later

## Running Locally

\`\`\`bash
# Start all services
docker-compose up -d

# Frontend at http://localhost:3000
# Backend API at http://localhost:8000
# Database at localhost:5432
