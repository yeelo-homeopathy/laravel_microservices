# Deployment Guide - Homeopathy ERP System

## Production Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] SSL certificates installed
- [ ] Security scanning completed
- [ ] Performance testing passed
- [ ] Monitoring configured
- [ ] Incident response plan ready

## Docker Push to Registry

\`\`\`bash
# Authenticate with Docker registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build images
docker build -f Dockerfile.laravel -t ghcr.io/yourusername/laravel-core:v1.0 apps/laravel-core/
docker build -f Dockerfile.nextjs -t ghcr.io/yourusername/nextjs-frontend:v1.0 apps/nextjs-frontend/

# Push to registry
docker push ghcr.io/yourusername/laravel-core:v1.0
docker push ghcr.io/yourusername/nextjs-frontend:v1.0
\`\`\`

## Kubernetes Deployment

### 1. Create Namespace

\`\`\`bash
kubectl create namespace homeopathy-erp
\`\`\`

### 2. Create Secrets

\`\`\`bash
# Create database secret
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres_user \
  --from-literal=password=your_secure_password \
  -n homeopathy-erp

# Create JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=your_jwt_secret_key_here \
  -n homeopathy-erp
\`\`\`

### 3. Apply Deployments

\`\`\`bash
# Apply all Kubernetes manifests
kubectl apply -f kubernetes/deployment.yml -n homeopathy-erp

# Verify deployments
kubectl get deployments -n homeopathy-erp
kubectl get pods -n homeopathy-erp
\`\`\`

### 4. Monitor Deployment

\`\`\`bash
# Watch deployment progress
kubectl rollout status deployment/laravel-core -n homeopathy-erp

# View pod logs
kubectl logs -f deployment/laravel-core -n homeopathy-erp

# Get service endpoints
kubectl get svc -n homeopathy-erp
\`\`\`

## Scaling & Load Balancing

### Horizontal Pod Autoscaling

\`\`\`bash
# View autoscaler status
kubectl get hpa -n homeopathy-erp

# Manual scaling
kubectl scale deployment laravel-core --replicas=5 -n homeopathy-erp
\`\`\`

## Backup & Recovery

### Database Backup

\`\`\`bash
# Backup PostgreSQL
kubectl exec postgres-0 -n homeopathy-erp -- \
  pg_dump -U postgres_user homeopathy_erp > backup.sql

# Restore PostgreSQL
kubectl exec -i postgres-0 -n homeopathy-erp -- \
  psql -U postgres_user homeopathy_erp < backup.sql
\`\`\`

## Troubleshooting Deployment

See `TROUBLESHOOTING.md` for common issues and solutions.
