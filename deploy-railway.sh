#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Kisaan AI - Railway Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./deploy-railway.sh

set -e

echo "🚀 Kisaan AI - Railway Deployment"
echo "=================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm i -g @railway/cli
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Link to project (or create new)
echo ""
echo "📦 Linking to Railway project..."
if [ ! -f "railway.toml" ]; then
    echo "❌ railway.toml not found!"
    exit 1
fi

railway link || railway init

# Set environment variables
echo ""
echo "🔧 Setting environment variables..."
echo "Please enter your API keys:"
echo ""

read -p "GEMINI_API_KEY: " GEMINI_KEY
read -p "OPENWEATHERMAP_API_KEY: " WEATHER_KEY
read -p "JWT_SECRET_KEY (press Enter to auto-generate): " JWT_KEY

if [ -z "$JWT_KEY" ]; then
    JWT_KEY=$(openssl rand -hex 32)
    echo "Generated JWT_SECRET_KEY: $JWT_KEY"
fi

railway variables set GEMINI_API_KEY="$GEMINI_KEY"
railway variables set OPENWEATHERMAP_API_KEY="$WEATHER_KEY"
railway variables set JWT_SECRET_KEY="$JWT_KEY"

# Deploy
echo ""
echo "🚢 Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "🌐 Getting deployment URL..."
DEPLOY_URL=$(railway domain)

if [ -n "$DEPLOY_URL" ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "Backend URL: https://$DEPLOY_URL"
    echo ""
    echo "⚠️  IMPORTANT: Update VITE_API_URL environment variable:"
    railway variables set VITE_API_URL="https://$DEPLOY_URL"
    echo ""
    echo "🔗 Testing health endpoint..."
    sleep 10
    curl -s "https://$DEPLOY_URL/health" | jq . || echo "Health check pending..."
else
    echo "⚠️  Could not retrieve deployment URL. Check Railway dashboard."
fi

echo ""
echo "📋 Next steps:"
echo "1. Add persistent volume in Railway dashboard (Settings → Volumes)"
echo "2. Mount path: /app"
echo "3. Deploy frontend to Vercel with VITE_API_URL=https://$DEPLOY_URL"
echo "4. Run: python scripts/ingest_data.py (for RAG features)"
echo ""
echo "🎉 Deployment complete!"
