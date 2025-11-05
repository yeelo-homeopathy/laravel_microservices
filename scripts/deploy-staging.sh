#!/bin/bash

# Deploy to Staging Script
set -e

NAMESPACE="staging"
REGISTRY="ghcr.io"
IMAGE_TAG="${1:-latest}"

echo "🚀 Deploying Homeopathy ERP to Staging..."
echo "Repository: yourusername"
echo "Image Tag: $IMAGE_TAG"

# Create namespace
echo "📦 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
echo "📝 Applying Kubernetes manifests..."
envsubst < kubernetes/staging/namespace.yml | kubectl apply -f -
envsubst < kubernetes/staging/postgres-deployment.yml | kubectl apply -f -
envsubst < kubernetes/staging/redis-deployment.yml | kubectl apply -f -
envsubst < kubernetes/staging/laravel-deployment.yml | kubectl apply -f -
envsubst < kubernetes/staging/nextjs-deployment.yml | kubectl apply -f -

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/postgres -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/redis -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/laravel-core -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/nextjs-frontend -n $NAMESPACE --timeout=5m

# Get service details
echo "✅ Staging deployment complete!"
echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE
