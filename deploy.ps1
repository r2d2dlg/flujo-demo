# Deployment script for Flujo Demo App (PowerShell)
# This script deploys backend and frontend to Google Cloud Run using source deployment

$PROJECT_ID = "hazel-pillar-451015-q8"
$REGION = "us-south1"
$DB_USER = "arturodlg"
$DB_NAME = "demoflujo"
# URL encode the password for special characters
$DB_PASSWORD_ENCODED = "Oc%25d%7Dc8lIm%3A9c2%5CS"

Write-Host "🚀 Deploying Flujo Demo App to Cloud Run..." -ForegroundColor Green
Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host ""

# Deploy Backend
Write-Host "📦 Deploying Backend..." -ForegroundColor Yellow
& gcloud run deploy flujo-backend `
    --source ./backend `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --add-cloudsql-instances "${PROJECT_ID}:${REGION}:grupo11cashflow" `
    --set-env-vars "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD_ENCODED}@/demoflujo?host=/cloudsql/${PROJECT_ID}:${REGION}:grupo11cashflow,ENVIRONMENT=production" `
    --set-secrets "SECRET_KEY=flujo-secret-key:latest" `
    --memory 2Gi `
    --cpu 2 `
    --project $PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    $BACKEND_URL_RAW = & gcloud run services describe flujo-backend --region=$REGION --project=$PROJECT_ID --format="value(status.url)"
    # Ensure the URL is always HTTPS
    $BACKEND_URL = $BACKEND_URL_RAW.Replace("http://", "https://")
    if (-not $BACKEND_URL.StartsWith("https://")) {
        $BACKEND_URL = "https://" + $BACKEND_URL
    }
    Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Deploy Frontend with the backend URL
Write-Host "🎨 Deploying Frontend..." -ForegroundColor Yellow
& gcloud run deploy flujo-frontend `
    --source ./frontend `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 80 `
    --set-env-vars "VITE_API_BASE_URL=$BACKEND_URL" `
    --project $PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
    $FRONTEND_URL = & gcloud run services describe flujo-frontend --region=$REGION --project=$PROJECT_ID --format="value(status.url)"
    Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Deployment completed!" -ForegroundColor Green
    Write-Host "Visit your app at: $FRONTEND_URL" -ForegroundColor Yellow
} else {
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    exit 1
} 