#!/bin/bash
# Test script to verify CORS configuration

echo "🧪 Testing CORS Configuration"
echo "=============================="

# Test 1: Check if backend is reachable
echo ""
echo "1️⃣ Testing backend health endpoint..."
curl -i https://api.sekagestion.com/health

# Test 2: Test CORS preflight request from www.sekagestion.com
echo ""
echo "2️⃣ Testing CORS preflight (OPTIONS) request..."
curl -i -X OPTIONS https://api.sekagestion.com/api/v1/auth/login \
  -H "Origin: https://www.sekagestion.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test 3: Test actual POST request with CORS headers
echo ""
echo "3️⃣ Testing actual POST request with Origin header..."
curl -i -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Origin: https://www.sekagestion.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test 4: Check root endpoint for configuration
echo ""
echo "4️⃣ Checking backend configuration..."
curl -i https://api.sekagestion.com/ \
  -H "Origin: https://www.sekagestion.com"

echo ""
echo "=============================="
echo "✅ Test complete. Check the responses above for CORS headers:"
echo "   - Access-Control-Allow-Origin: https://www.sekagestion.com"
echo "   - Access-Control-Allow-Credentials: true"
echo "   - Access-Control-Allow-Methods: *"
