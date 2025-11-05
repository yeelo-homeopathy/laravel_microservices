# Complete CI/CD Deployment Guide - Homeopathy ERP

## Architecture Overview

\`\`\`
GitHub Repository
    ↓ (push to main/develop/staging)
GitHub Actions Workflow
    ├─ Test Phase (Laravel + Next.js)
    ├─ Security Scan (Trivy)
    └─ Build & Push Docker Images to GHCR
        ↓
Docker Images in GitHub Container Registry
    ↓
Kubernetes Cluster (Staging/Production)
    ├─ PostgreSQL (1 replica staging, 1 replica production)
    ├─ Redis (1 replica staging, 1 replica production)
    ├─ Laravel Core (2 replicas staging, 3 replicas production) + HPA
    └─ Next.js Frontend (2 replicas staging, 3 replicas production) + HPA
\`\`\`

## Prerequisites

### Local Development
1. **Docker & Docker Compose** - For local testing
2. **kubectl** - Kubernetes CLI (v1.27+)
3. **Git** - Version control

### Kubernetes Cluster
1. **EKS/GKE/AKS** - Managed Kubernetes cluster
2. **kubectl** configured with cluster credentials
3. **Persistent Volume Provider** - EBS, GCP Disks, or Azure Disks

### GitHub Repository Secrets
Set these in GitHub Settings → Secrets and Variables:

\`\`\`
KUBE_CONFIG_STAGING        # Base64 encoded kubeconfig for staging
KUBE_CONFIG_PRODUCTION     # Base64 encoded kubeconfig for production
DB_PASSWORD_STAGING        # PostgreSQL password for staging
DB_PASSWORD_PRODUCTION     # PostgreSQL password for production
JWT_SECRET_STAGING         # JWT secret key for staging
JWT_SECRET_PRODUCTION      # JWT secret key for production
SLACK_WEBHOOK              # Slack webhook for notifications
\`\`\`

### Generate Base64 Kubeconfig
\`\`\`bash
cat ~/.kube/config | base64 | tr -d '\n'
# Copy the output to GitHub Secrets
\`\`\`

## Workflow

### 1. Development Flow
\`\`\`bash
# Create feature branch
git checkout -b feature/new-feature
# Make changes and commit
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create Pull Request (GitHub Actions runs tests)
\`\`\`

### 2. Staging Deployment
\`\`\`bash
# Merge to develop branch
git checkout develop
git merge feature/new-feature
git push origin develop

# Automatically:
# - Runs all tests
# - Security scanning
# - Builds Docker images
# - Deploys to staging Kubernetes cluster
\`\`\`

### 3. Production Deployment
\`\`\`bash
# Create release
git tag v1.0.0
git push origin v1.0.0

# OR Merge to main branch
git checkout main
git merge develop
git push origin main

# Automatically:
# - Runs all tests
# - Security scanning
# - Builds Docker images
# - Deploys to production Kubernetes cluster
# - Sends Slack notification
\`\`\`

## Manual Deployment

### Deploy to Staging
\`\`\`bash
kubectl apply -f kubernetes/staging/

# Or with envsubst for variables
export DB_PASSWORD_STAGING="your_password"
export JWT_SECRET_STAGING="your_jwt_secret"
envsubst < kubernetes/staging/postgres-deployment.yml | kubectl apply -f -
envsubst < kubernetes/staging/laravel-deployment.yml | kubectl apply -f -
envsubst < kubernetes/staging/nextjs-deployment.yml | kubectl apply -f -
\`\`\`

### Deploy to Production
\`\`\`bash
# Create namespace
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -

# Deploy services
kubectl apply -f kubernetes/production/

# Verify deployment
kubectl get deployments -n production
kubectl get pods -n production
kubectl get svc -n production
\`\`\`

## Monitoring & Debugging

### Check Deployment Status
\`\`\`bash
# Get deployment status
kubectl get deployments -n staging

# Get pod status
kubectl get pods -n staging

# Get services
kubectl get svc -n staging

# Get events
kubectl get events -n staging --sort-by='.lastTimestamp'
\`\`\`

### View Logs
\`\`\`bash
# Laravel logs
kubectl logs -f deployment/laravel-core -n staging

# Next.js logs
kubectl logs -f deployment/nextjs-frontend -n staging

# PostgreSQL logs
kubectl logs -f deployment/postgres -n staging
\`\`\`

### Describe Pods
\`\`\`bash
# Get detailed pod info
kubectl describe pod <pod-name> -n staging

# Check resource usage
kubectl top pods -n staging
kubectl top nodes
\`\`\`

### Access Pod Shell
\`\`\`bash
# SSH into Laravel pod
kubectl exec -it <laravel-pod-name> -n staging -- sh

# Run Laravel commands
kubectl exec <laravel-pod-name> -n staging -- php artisan migrate
kubectl exec <laravel-pod-name> -n staging -- php artisan cache:clear
\`\`\`

## Scaling & Performance

### Horizontal Pod Autoscaling (HPA)
The system automatically scales based on CPU and memory usage:

\`\`\`bash
# View HPA status
kubectl get hpa -n staging

# Get HPA details
kubectl describe hpa laravel-core-hpa -n staging

# Manual scaling (if needed)
kubectl scale deployment/laravel-core --replicas=4 -n staging
\`\`\`

### Resource Monitoring
\`\`\`bash
# Real-time resource usage
watch kubectl top pods -n production

# Resource requests/limits in YAML
kubectl get deployment laravel-core -n production -o yaml | grep -A 20 resources
\`\`\`

## Rollback

### Automatic Rollback
The CI/CD pipeline includes automatic rollback on deployment failure.

### Manual Rollback
\`\`\`bash
# View rollout history
kubectl rollout history deployment/laravel-core -n production

# Rollback to previous version
kubectl rollout undo deployment/laravel-core -n production

# Rollback to specific revision
kubectl rollout undo deployment/laravel-core --to-revision=2 -n production

# Check rollout status
kubectl rollout status deployment/laravel-core -n production
\`\`\`

## Backup & Recovery

### Backup PostgreSQL
\`\`\`bash
# Create a backup pod
kubectl run postgres-backup --image=postgres:16-alpine -i -t --rm \
  -- pg_dump -h postgres -U erp_user -d homeopathy_erp > backup.sql \
  -n production
\`\`\`

### Restore PostgreSQL
\`\`\`bash
# Restore from backup
kubectl exec <postgres-pod> -n production -- psql -U erp_user -d homeopathy_erp < backup.sql
\`\`\`

## Troubleshooting

### Pod Not Starting
\`\`\`bash
# Check pod status
kubectl describe pod <pod-name> -n staging

# Check liveness/readiness probe status
kubectl get pod <pod-name> -n staging -o yaml | grep -A 10 "livenessProbe\|readinessProbe"

# Check events
kubectl get events -n staging --field-selector involvedObject.name=<pod-name>
\`\`\`

### Database Connection Issues
\`\`\`bash
# Test database connectivity
kubectl run postgres-test --image=postgres:16-alpine -i -t --rm \
  -- psql -h postgres -U erp_user -d homeopathy_erp -c "SELECT 1" \
  -n staging

# Check database logs
kubectl logs deployment/postgres -n staging
\`\`\`

### Memory/CPU Issues
\`\`\`bash
# Check resource metrics
kubectl top pods -n production --sort-by=memory

# Increase resource limits (edit deployment)
kubectl edit deployment laravel-core -n production

# Or patch deployment
kubectl patch deployment laravel-core -n production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"laravel-core","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'
\`\`\`

## Health Checks

### Endpoint Verification
\`\`\`bash
# Get load balancer IP
kubectl get svc laravel-core -n production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Test health endpoint
curl http://<LOAD_BALANCER_IP>:8000/api/health

# Test readiness endpoint
curl http://<LOAD_BALANCER_IP>:8000/api/ready
\`\`\`

## Performance Optimization

### Enable Pod Affinity
Already configured in production manifests to spread pods across nodes.

### Resource Quotas
\`\`\`bash
# Set namespace resource quotas
kubectl create quota dev-quota --hard=pods=100,requests.cpu=100,requests.memory=200Gi -n staging
\`\`\`

### Network Policies
\`\`\`yaml
# Optional: Restrict traffic between pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-laravel-redis
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: laravel-core
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nextjs-frontend
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: redis
\`\`\`

## CI/CD Pipeline Stages

### Stage 1: Test (15 minutes)
- PHP dependencies installation
- Laravel migrations and tests
- Node.js dependencies installation
- Next.js linting and build
- Security scanning

### Stage 2: Build & Push (10 minutes)
- Build Laravel Docker image
- Build Next.js Docker image
- Push to GitHub Container Registry

### Stage 3: Deploy Staging (5 minutes)
- Apply Kubernetes manifests
- Update images
- Wait for rollout
- Verify deployment

### Stage 4: Deploy Production (5 minutes)
- Apply Kubernetes manifests
- Update images
- Wait for rollout
- Run smoke tests
- Send Slack notification

**Total Time: ~35 minutes**

## Maintenance

### Database Migrations
\`\`\`bash
# Run migrations in production
kubectl exec <laravel-pod> -n production -- php artisan migrate --force

# Rollback migrations
kubectl exec <laravel-pod> -n production -- php artisan migrate:rollback
\`\`\`

### Cache Clearing
\`\`\`bash
# Clear all caches
kubectl exec <laravel-pod> -n production -- php artisan cache:clear

# Clear config cache
kubectl exec <laravel-pod> -n production -- php artisan config:clear
\`\`\`

### Logs Rotation
Logs are automatically managed by Kubernetes and stored in `/var/log/pods/`.

## Support & Monitoring

### View CI/CD Pipeline
Go to: GitHub Repository → Actions → Workflow runs

### Slack Notifications
- Production deployments trigger Slack notifications
- Success: ✅ Green notification
- Failure: ❌ Red notification

### Metrics & Dashboards
- Grafana: `http://<cluster-ip>:3000`
- Prometheus: `http://<cluster-ip>:9090`
