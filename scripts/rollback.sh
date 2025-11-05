#!/bin/bash

# Rollback Script
set -e

NAMESPACE="${1:-production}"
DEPLOYMENT="${2:-laravel-core}"

echo "🔙 Rolling back $DEPLOYMENT in $NAMESPACE..."

# Get revision history
echo "📋 Revision history:"
kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE

# Rollback to previous
echo "⏳ Rolling back to previous version..."
kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE

# Check status
echo "✅ Rollback complete!"
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=5m

echo "Current revision:"
kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE | head -2
