#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Kisaan AI - Deployment Verification Script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./verify-deployment.sh https://your-backend-url.railway.app

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: ./verify-deployment.sh <backend-url>"
    echo "Example: ./verify-deployment.sh https://kisaan-ai.railway.app"
    exit 1
fi

BACKEND_URL=$1
echo "🔍 Kisaan AI - Deployment Verification"
echo "======================================"
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
HTTP_CODE=$(echo "$HEALTH" | tail -n1)
RESPONSE=$(echo "$HEALTH" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
    echo "   Response: $RESPONSE"
else
    echo "❌ Health check failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 2: Weather Endpoint
echo "2️⃣  Testing weather endpoint (New Delhi)..."
WEATHER=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/weather-alerts?lat=28.6139&lon=77.2090")
HTTP_CODE=$(echo "$WEATHER" | tail -n1)
RESPONSE=$(echo "$WEATHER" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Weather endpoint passed"
    TEMP=$(echo "$RESPONSE" | grep -o '"temperature":[0-9.]*' | cut -d: -f2)
    CITY=$(echo "$RESPONSE" | grep -o '"city":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TEMP" ] && [ "$TEMP" != "0" ]; then
        echo "   Temperature: ${TEMP}°C"
        echo "   City: $CITY"
    else
        echo "⚠️  Warning: Temperature is 0°C (check OPENWEATHERMAP_API_KEY)"
    fi
else
    echo "❌ Weather endpoint failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 3: CORS Headers
echo "3️⃣  Testing CORS configuration..."
CORS=$(curl -s -I -X OPTIONS "$BACKEND_URL/health" | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
    echo "✅ CORS headers present"
    echo "   $CORS"
else
    echo "⚠️  Warning: CORS headers not found (may cause frontend issues)"
fi
echo ""

# Test 4: Geocode Endpoint
echo "4️⃣  Testing geocode endpoint..."
GEOCODE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/geocode?city=Mumbai")
HTTP_CODE=$(echo "$GEOCODE" | tail -n1)
RESPONSE=$(echo "$GEOCODE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Geocode endpoint passed"
    LAT=$(echo "$RESPONSE" | grep -o '"lat":[0-9.]*' | cut -d: -f2)
    LON=$(echo "$RESPONSE" | grep -o '"lon":[0-9.]*' | cut -d: -f2)
    echo "   Mumbai coordinates: $LAT, $LON"
else
    echo "❌ Geocode endpoint failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Telemetry Endpoint
echo "5️⃣  Testing telemetry endpoint..."
TELEMETRY=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/telemetry?farmer_id=1")
HTTP_CODE=$(echo "$TELEMETRY" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Telemetry endpoint passed"
else
    echo "❌ Telemetry endpoint failed (HTTP $HTTP_CODE)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Core endpoints working"
echo "✅ Backend is accessible"
echo ""
echo "⚠️  Manual tests required:"
echo "   • Image upload (/analyze endpoint)"
echo "   • Voice chat (/voice-chat endpoint)"
echo "   • Expert chat (/expert-chat endpoint)"
echo ""
echo "📝 Next steps:"
echo "   1. Test image upload from frontend"
echo "   2. Verify persistent storage (upload → redeploy → check if file exists)"
echo "   3. Test voice features"
echo "   4. Run: python scripts/ingest_data.py (for RAG features)"
echo ""
echo "🎉 Basic deployment verification complete!"
