#!/bin/bash

echo "🔍 Diagnostic Backend SEKA"
echo "=========================="
echo ""

# Test de l'endpoint racine
echo "1️⃣ Test endpoint racine..."
curl -s https://api.sekagestion.com/ | jq . 2>/dev/null || echo "❌ Erreur"
echo ""

# Test de l'endpoint health
echo "2️⃣ Test endpoint health..."
curl -s https://api.sekagestion.com/health | jq . 2>/dev/null || echo "❌ Erreur"
echo ""

# Test de l'endpoint login avec mauvais credentials
echo "3️⃣ Test endpoint login (format)..."
curl -s -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@test.com&password=wrongpass" 2>&1 | head -5
echo ""

echo "=========================="
echo "📋 Actions à vérifier sur Railway:"
echo "1. DATABASE_URL est-elle configurée ?"
echo "2. PostgreSQL est-il déployé et accessible ?"
echo "3. Les migrations ont-elles été exécutées ?"
echo "4. Y a-t-il des utilisateurs dans la base ?"
