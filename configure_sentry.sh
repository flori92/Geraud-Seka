#!/bin/bash

echo "🔍 Configuration Sentry pour SEKA"
echo "=================================="
echo ""

# Vérifier si Sentry CLI est installé
if ! command -v sentry-cli &> /dev/null; then
    echo "❌ Sentry CLI n'est pas installé"
    echo "Installation..."
    npm install -g @sentry/cli
fi

echo "✅ Sentry CLI version: $(sentry-cli --version 2>&1 | head -1)"
echo ""

# Demander les informations
read -p "🔑 Entrez votre Sentry Auth Token: " SENTRY_TOKEN
read -p "🏢 Entrez votre organisation Sentry: " SENTRY_ORG
read -p "📦 Entrez le nom du projet frontend: " SENTRY_PROJECT_FRONTEND
read -p "📦 Entrez le nom du projet backend: " SENTRY_PROJECT_BACKEND
read -p "🔗 Entrez le DSN Sentry frontend: " SENTRY_DSN_FRONTEND
read -p "🔗 Entrez le DSN Sentry backend: " SENTRY_DSN_BACKEND

echo ""
echo "📝 Création du fichier .sentryclirc..."

cat > .sentryclirc << EOF
[auth]
token=${SENTRY_TOKEN}

[defaults]
org=${SENTRY_ORG}
project=${SENTRY_PROJECT_FRONTEND}
EOF

echo "✅ Fichier .sentryclirc créé"
echo ""

# Tester la connexion
echo "🧪 Test de la connexion à Sentry..."
if sentry-cli info > /dev/null 2>&1; then
    echo "✅ Connexion réussie !"
    echo ""
    sentry-cli info
else
    echo "❌ Échec de la connexion. Vérifiez vos credentials."
    exit 1
fi

echo ""
echo "🚀 Configuration des variables Railway..."
echo ""

# Frontend
echo "📦 Configuration du frontend..."
cd frontend
railway variables --set "SENTRY_AUTH_TOKEN=${SENTRY_TOKEN}"
railway variables --set "SENTRY_ORG=${SENTRY_ORG}"
railway variables --set "SENTRY_PROJECT=${SENTRY_PROJECT_FRONTEND}"
railway variables --set "NEXT_PUBLIC_SENTRY_DSN=${SENTRY_DSN_FRONTEND}"
echo "✅ Variables frontend configurées"

echo ""
echo "📦 Configuration du backend..."
cd ../backend
railway link 2>/dev/null || echo "⚠️  Backend non lié à Railway"
railway variables --set "SENTRY_DSN=${SENTRY_DSN_BACKEND}" 2>/dev/null || echo "⚠️  Impossible de configurer le backend"
echo "✅ Variables backend configurées"

cd ..

echo ""
echo "============================================"
echo "✅ Configuration Sentry terminée !"
echo "============================================"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Redéployez le frontend: cd frontend && railway up"
echo "2. Redéployez le backend: cd backend && railway up"
echo "3. Testez en déclenchant une erreur dans l'app"
echo "4. Vérifiez les erreurs sur https://sentry.io"
echo ""
echo "📚 Documentation complète: voir SENTRY_SETUP.md"
echo ""
