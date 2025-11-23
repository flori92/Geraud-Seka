#!/bin/bash

echo "🔧 Configuration Railway Backend"
echo "================================"
echo ""

# Aller dans le dossier backend
cd backend

echo "1️⃣ Vérification du service actuel..."
railway status
echo ""

echo "2️⃣ Liste des variables d'environnement..."
railway variables | grep -E "DATABASE|POSTGRES" || echo "❌ Aucune variable DATABASE trouvée"
echo ""

echo "================================"
echo "📋 Configuration manuelle requise:"
echo ""
echo "Sur Railway Dashboard (https://railway.app):"
echo "1. Vérifiez que PostgreSQL est déployé"
echo "2. Allez dans le service Backend"
echo "3. Variables → Ajoutez:"
echo "   DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo ""
echo "Ou utilisez la commande:"
echo "   cd backend"
echo "   railway link (sélectionnez le service backend)"
echo "   railway variables --set 'DATABASE_URL=\${{Postgres.DATABASE_URL}}'"
