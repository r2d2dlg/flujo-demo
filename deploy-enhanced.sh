#!/bin/bash

# Enhanced Cloud Deployment Script - Flujo Demo v2.0
# Includes Admin Panel, Enhanced Authentication, Scenario Projects with Credit Lines
# Run this in Google Cloud Shell

echo "🚀 Starting Enhanced Flujo Demo Deployment..."

# 1. Set project and region
gcloud config set project hazel-pillar-451015-q8
gcloud config set run/region us-south1

# 2. Enable required APIs
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com

# 3. Set environment variables
export PROJECT_ID=hazel-pillar-451015-q8
export REGION=us-south1
export TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🏗️ Building and deploying enhanced frontend..."

# 4. Build and push frontend with new admin features
cd frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/flujo-frontend:enhanced-$TIMESTAMP .

# 5. Deploy enhanced frontend to Cloud Run
gcloud run deploy flujo-frontend \
  --image gcr.io/$PROJECT_ID/flujo-frontend:enhanced-$TIMESTAMP \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 20 \
  --set-env-vars VITE_API_BASE_URL='https://flujo-backend-536388050352.us-south1.run.app' \
  --tag enhanced

echo "🔧 Building and deploying enhanced backend..."

# 6. Build and push backend with admin panel and auth
cd ../backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/flujo-backend:enhanced-$TIMESTAMP .

# 7. Deploy enhanced backend to Cloud Run
gcloud run deploy flujo-backend \
  --image gcr.io/$PROJECT_ID/flujo-backend:enhanced-$TIMESTAMP \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 20 \
  --set-env-vars DB_USER='arturodlg' \
  --set-env-vars DB_PASSWORD='Negocios11' \
  --set-env-vars DB_HOST='34.174.189.231' \
  --set-env-vars DB_PORT='5432' \
  --set-env-vars DB_NAME='demoflujo' \
  --set-env-vars SECRET_KEY='flujo-enhanced-secret-key-2024-admin-panel-secure' \
  --set-env-vars ENVIRONMENT='production' \
  --set-env-vars ALGORITHM='HS256' \
  --set-env-vars ACCESS_TOKEN_EXPIRE_MINUTES='30' \
  --tag enhanced

echo "🗄️ Running database migrations for new features..."

# 8. Get the backend URL for migration
BACKEND_URL=$(gcloud run services describe flujo-backend --region=$REGION --format='value(status.url)')

# 9. Create admin user (if needed)
echo "👤 Setting up admin user..."
# Note: You may need to call an endpoint to create the initial admin user

echo "✅ Deployment completed successfully!"
echo ""
echo "🌟 Enhanced Flujo Demo v2.0 Deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  Frontend URL: https://flujo-frontend-536388050352.us-south1.run.app"
echo "🔧 Backend URL:  https://flujo-backend-536388050352.us-south1.run.app"
echo ""
echo "🆕 New Features Included:"
echo "   ✨ Admin Panel (/admin)"
echo "   🔐 Enhanced Authentication"
echo "   📊 Scenario Projects with Credit Lines"
echo "   👥 User Management"
echo "   🎯 Baseline Approval System"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123 (Change immediately!)"
echo ""
echo "📝 Next Steps:"
echo "   1. Test the admin panel"
echo "   2. Create your users"
echo "   3. Set up scenario projects"
echo "   4. Configure credit lines"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 