#!/bin/bash

echo "🔍 Testing API Access and CORS Configuration"
echo "=============================================="
echo ""

# Test 1: Basic connectivity
echo "1️⃣ Testing basic connectivity to api.sekagestion.com..."
curl -I https://api.sekagestion.com/ 2>&1 | head -n 20
echo ""

# Test 2: Health endpoint
echo "2️⃣ Testing /health endpoint..."
curl -I https://api.sekagestion.com/health 2>&1 | head -n 20
echo ""

# Test 3: CORS preflight request
echo "3️⃣ Testing CORS preflight (OPTIONS) from www.sekagestion.com..."
curl -X OPTIONS https://api.sekagestion.com/api/v1/auth/login \
  -H "Origin: https://www.sekagestion.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control|< Allow)"
echo ""

# Test 4: Actual login request with CORS headers
echo "4️⃣ Testing actual POST request with CORS headers..."
curl -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Origin: https://www.sekagestion.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control|< Content-Type)"
echo ""

# Test 5: Check Railway deployment
echo "5️⃣ Checking Railway deployment status..."
echo "Please check Railway logs manually at:"
echo "https://railway.app/dashboard"
echo ""

echo "✅ Test complete!"
echo ""
echo "📋 Next steps:"
echo "1. If you see 403 errors, check Cloudflare settings"
echo "2. If you see 'Access-Control-Allow-Origin' headers, CORS is working"
echo "3. Check Railway logs for backend startup messages"
