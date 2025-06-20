#!/bin/bash

echo "🔍 Checking deployment status..."
echo ""

echo "📱 Frontend Status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://flujo-frontend-536388050352.us-south1.run.app || echo "❌ Frontend not accessible"

echo ""
echo "🔧 Backend Status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://flujo-backend-536388050352.us-south1.run.app || echo "❌ Backend not accessible"

echo ""
echo "🌟 Application URLs:"
echo "Frontend: https://flujo-frontend-536388050352.us-south1.run.app"
echo "Backend:  https://flujo-backend-536388050352.us-south1.run.app"

echo ""
echo "⏳ Cloud Build may take 5-10 minutes to complete..."
echo "   Check status at: https://console.cloud.google.com/cloud-build/builds" 