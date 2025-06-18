#!/bin/bash

# Deployment script for Google Cloud
# Project: hazel-pillar-451015-q8

set -e

echo "🚀 Starting deployment to Google Cloud..."

# Configuration
PROJECT_ID="hazel-pillar-451015-q8"
REGION="us-south1"
DB_INSTANCE_NAME="grupo11cashflow"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for colored output
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    error "Google Cloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
log "Setting Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs (already done, but ensuring they're enabled)
log "Ensuring required Google Cloud APIs are enabled..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Check if database exists
log "Checking existing Cloud SQL instance..."
if gcloud sql instances describe $DB_INSTANCE_NAME &> /dev/null; then
    log "Using existing Cloud SQL instance: $DB_INSTANCE_NAME"
else
    error "Cloud SQL instance $DB_INSTANCE_NAME not found!"
    exit 1
fi

# Generate a secure secret key
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
log "Generated secure secret key"

# Build and deploy using Cloud Build
log "Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_SECRET_KEY="$SECRET_KEY"

# Get deployed URLs
BACKEND_URL=$(gcloud run services describe flujo-backend --region=$REGION --format='value(status.url)')
FRONTEND_URL=$(gcloud run services describe flujo-frontend --region=$REGION --format='value(status.url)')

log "🎉 Deployment completed!"
echo ""
echo "📱 Application URLs:"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo ""
echo "🔑 Generated Secret Key (save this safely):"
echo "$SECRET_KEY"
echo ""
echo "📋 Next steps:"
echo "1. Update database credentials in Cloud Run:"
echo "   gcloud run services update flujo-backend --region=$REGION \\"
echo "     --set-env-vars=\"DATABASE_URL=postgresql://USERNAME:PASSWORD@/DATABASE_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME\""
echo ""
echo "2. Test the application:"
echo "   curl $BACKEND_URL/health"
echo ""
echo "3. Configure custom domain (optional)"
echo ""
echo "🔐 Security reminders:"
echo "- Update database connection string with correct credentials"
echo "- Configure proper CORS settings"
echo "- Set up SSL certificates"
echo "- Review IAM permissions" 