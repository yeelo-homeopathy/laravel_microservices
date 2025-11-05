#!/bin/bash

# Deploy to Production Script
set -e

NAMESPACE="production"
REGISTRY="ghcr.io"
IMAGE_TAG="${1:-latest}"

echo "🚀 Deploying Homeopathy ERP to Production..."
echo "Repository: yourusername"
echo "Image Tag: $IMAGE_TAG"

# Confirmation prompt
read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 1
fi

# Create namespace
echo "📦 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
echo "📝 Applying Kubernetes manifests..."
envsubst < kubernetes/production/namespace.yml | kubectl apply -f -
envsubst < kubernetes/production/postgres-deployment.yml | kubectl apply -f -
envsubst < kubernetes/production/redis-deployment.yml | kubectl apply -f -
envsubst < kubernetes/production/laravel-deployment.yml | kubectl apply -f -
envsubst < kubernetes/production/nextjs-deployment.yml | kubectl apply -f -

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/postgres -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/redis -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/laravel-core -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/nextjs-frontend -n $NAMESPACE --timeout=5m

# Health check
echo "🏥 Running health checks..."
BACKEND_POD=$(kubectl get pod -n $NAMESPACE -l app=laravel-core -o jsonpath='{.items[0].metadata.name}')
kubectl exec $BACKEND_POD -n $NAMESPACE -- curl -f http://localhost:8000/api/health || exit 1

echo "✅ Production deployment complete!"
echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE
