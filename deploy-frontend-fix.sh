#!/bin/bash

# Simple Frontend Fix - Deploy Script
# This will rebuild the frontend with the hardcoded production API URL

echo "🔧 Deploying Frontend Fix..."

# Set environment variables
export PROJECT_ID=hazel-pillar-451015-q8
export REGION=us-south1
export TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🏗️ Building frontend with fixed API URL..."

# Go to frontend directory
cd frontend

# Build and deploy frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/flujo-frontend:apifix-$TIMESTAMP .

echo "🚀 Deploying fixed frontend to Cloud Run..."

gcloud run deploy flujo-frontend \
  --image gcr.io/$PROJECT_ID/flujo-frontend:apifix-$TIMESTAMP \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 20

echo "✅ Frontend deployed with API fix!"
echo ""
echo "🌟 Updated Frontend URL:"
echo "🖥️  https://flujo-frontend-536388050352.us-south1.run.app"
echo ""
echo "🧪 The frontend now automatically detects production mode"
echo "    and will connect to: https://flujo-backend-536388050352.us-south1.run.app"
echo ""
echo "Try logging in now - it should work! 🎉" 