#!/bin/bash

echo "🚀 Test des corrections CORS et API Documents"
echo "=============================================="

API_BASE="https://api.sekagestion.com"

echo ""
echo "🧪 1. Test CORS preflight OPTIONS /api/v1/documents/"
echo "----------------------------------------------------"

curl -X OPTIONS "$API_BASE/api/v1/documents/" \
  -H "Origin: https://www.sekagestion.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v \
  -w "\nStatus: %{http_code}\n" \
  2>&1 | grep -E "(HTTP|< |< Access-Control|Status)"

echo ""
echo "🧪 2. Test GET /api/v1/documents/ (vérifier erreur 500)"
echo "------------------------------------------------------"

curl -X GET "$API_BASE/api/v1/documents/" \
  -H "Origin: https://www.sekagestion.com" \
  -H "Content-Type: application/json" \
  -v \
  -w "\nStatus: %{http_code}\n" \
  2>&1 | grep -E "(HTTP|< |< Access-Control|Status|detail)"

echo ""
echo "🧪 3. Test endpoint racine /"
echo "----------------------------"

curl -X GET "$API_BASE/" \
  -H "Origin: https://www.sekagestion.com" \
  -v \
  -w "\nStatus: %{http_code}\n" \
  2>&1 | grep -E "(HTTP|< |< Access-Control|Status|message)"

echo ""
echo "✨ Tests terminés"
