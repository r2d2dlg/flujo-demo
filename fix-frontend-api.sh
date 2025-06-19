#!/bin/bash

# Quick Fix - Frontend API Configuration
# Run this in Google Cloud Shell to fix the API URL issue

echo "🔧 Fixing Frontend API Configuration..."

# Set project and region
gcloud config set project hazel-pillar-451015-q8
gcloud config set run/region us-south1

# Set environment variables
export PROJECT_ID=hazel-pillar-451015-q8
export REGION=us-south1
export TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🏗️ Rebuilding frontend with correct API URL..."

# Build frontend with correct environment variable
cd frontend

# Create a temporary .env file for the build
echo "VITE_API_BASE_URL=https://flujo-backend-536388050352.us-south1.run.app" > .env.production

# Build and push frontend with fixed configuration
gcloud builds submit --tag gcr.io/$PROJECT_ID/flujo-frontend:fixed-$TIMESTAMP .

echo "🚀 Deploying fixed frontend..."

# Deploy frontend with correct API configuration
gcloud run deploy flujo-frontend \
  --image gcr.io/$PROJECT_ID/flujo-frontend:fixed-$TIMESTAMP \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 20 \
  --tag fixed

echo "✅ Frontend API configuration fixed!"
echo ""
echo "🌟 Updated URLs:"
echo "🖥️  Frontend: https://flujo-frontend-536388050352.us-south1.run.app"
echo "🔧 Backend:  https://flujo-backend-536388050352.us-south1.run.app"
echo ""
echo "🧪 Test the login now - it should connect to the production backend!" 