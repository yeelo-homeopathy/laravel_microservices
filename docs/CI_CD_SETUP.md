# CI/CD Pipeline Setup

## GitHub Actions Workflow

The project uses GitHub Actions for automated testing, building, and deployment.

### Workflow Files

Located in `.github/workflows/`:

- **ci-cd-pipeline.yml** - Main CI/CD pipeline
- **ci.yml** - Testing and validation
- **security.yml** - Security scanning (optional)
- **deploy.yml** - Deployment automation (optional)

### Pipeline Stages

1. **Checkout** - Clone repository
2. **Setup** - Install dependencies, setup environment
3. **Lint** - Code style validation
4. **Test** - Unit & integration tests
5. **Build** - Build Docker images
6. **Push** - Push to container registry
7. **Deploy** - Deploy to Kubernetes

### Triggering Pipeline

Pipeline runs automatically on:
- Push to `main` branch
- Pull requests
- Scheduled runs (configurable)

## Docker Build & Push

\`\`\`bash
# Build all images
pnpm run docker:build

# Push to registry
pnpm run docker:push

# Or manually:
docker build -f docker/Dockerfile.laravel -t myrepo/laravel:latest .
docker build -f docker/Dockerfile.nextjs -t myrepo/nextjs:latest .
docker push myrepo/laravel:latest
docker push myrepo/nextjs:latest
\`\`\`

## Kubernetes Deployment

\`\`\`bash
# Deploy to cluster
pnpm run k8s:deploy

# Or manually:
kubectl apply -f kubernetes/namespace.yml
kubectl apply -f kubernetes/configmap.yml
kubectl apply -f kubernetes/secrets.yml
kubectl apply -f kubernetes/laravel/deployment.yml
kubectl apply -f kubernetes/nextjs/deployment.yml
\`\`\`

## Environment Variables

### CI/CD Variables

Configure in GitHub repository settings:

- `DOCKER_REGISTRY` - Container registry URL
- `DOCKER_USERNAME` - Registry username
- `DOCKER_PASSWORD` - Registry password
- `KUBECONFIG` - Kubernetes config (base64 encoded)
- `SLACK_WEBHOOK` - Slack notifications (optional)

### Secret Management

Secrets are managed via:
- GitHub Secrets for CI/CD
- Kubernetes Secrets for runtime
- `.env.local` for local development (NEVER commit)
