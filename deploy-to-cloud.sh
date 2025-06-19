#!/bin/bash

# Complete Cloud Shell Deployment Script
# Run this in Google Cloud Shell

# 1. Set project and region
gcloud config set project hazel-pillar-451015-q8
gcloud config set run/region us-south1

# 2. Clone latest code
rm -rf flujo-demo
git clone https://github.com/r2d2dlg/flujo-demo.git
cd flujo-demo

# 3. Set environment variables
export PROJECT_ID=hazel-pillar-451015-q8
export REGION=us-south1

echo "Building and deploying frontend..."

# 4. Build and push frontend
cd frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/flujo-frontend .

# 5. Deploy frontend to Cloud Run
gcloud run deploy flujo-frontend \
  --image gcr.io/$PROJECT_ID/flujo-frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 20

echo "Building and deploying backend..."

# 6. Build and push backend  
cd ../backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/flujo-backend .

# 7. Deploy backend to Cloud Run
gcloud run deploy flujo-backend \
  --image gcr.io/$PROJECT_ID/flujo-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 20 \
  --set-env-vars DATABASE_URL='postgresql://postgres:Cashflow2024@10.75.48.3:5432/grupo11cashflow' \
  --set-env-vars SECRET_KEY='flujo-secret-key-2024-production' \
  --set-env-vars ALGORITHM='HS256' \
  --set-env-vars ACCESS_TOKEN_EXPIRE_MINUTES='30'

echo "Deployment completed!"
echo "Frontend URL: https://flujo-frontend-536388050352.us-south1.run.app"
echo "Backend URL: https://flujo-backend-536388050352.us-south1.run.app" 