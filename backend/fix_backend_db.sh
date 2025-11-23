#!/bin/bash

echo "🔧 Fix Backend Database - Railway"
echo "=================================="
echo ""

echo "1️⃣ Test de connexion à la base de données..."
railway run python test_db_connection.py
echo ""

echo "=================================="
echo ""
read -p "La connexion fonctionne-t-elle ? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "2️⃣ Exécution des migrations..."
    railway run python migrate.py
    echo ""
    
    echo "3️⃣ Création de l'utilisateur admin..."
    railway run python create_admin_user.py
    echo ""
    
    echo "=================================="
    echo "✅ Configuration terminée!"
    echo ""
    echo "🧪 Testez maintenant:"
    echo ""
    echo "curl -X POST https://api.sekagestion.com/api/v1/auth/login \\"
    echo "  -H 'Content-Type: application/x-www-form-urlencoded' \\"
    echo "  -d 'username=admin@seka.app&password=Admin123!'"
    echo ""
else
    echo ""
    echo "❌ Problème de connexion détecté"
    echo ""
    echo "📋 Vérifiez sur Railway Dashboard:"
    echo "1. PostgreSQL est déployé"
    echo "2. DATABASE_URL = \${{Postgres.DATABASE_URL}}"
    echo "3. Le backend est lié au service PostgreSQL"
    echo ""
    echo "Puis relancez ce script."
fi
