#!/bin/bash

echo "🔴 Désactivation de Sentry sur Railway"
echo "======================================"
echo ""

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installation..."
    echo "npm install -g @railway/cli"
    echo ""
    echo "Ou installez-le depuis: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI détecté"
echo ""

# Demander confirmation
read -p "⚠️  Voulez-vous supprimer toutes les variables Sentry sur Railway ? (oui/non): " CONFIRM
if [ "$CONFIRM" != "oui" ] && [ "$CONFIRM" != "OUI" ] && [ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "📦 Désactivation du frontend..."
cd frontend 2>/dev/null || echo "⚠️  Répertoire frontend non trouvé, continuons..."

# Supprimer les variables Sentry du frontend
echo "Suppression de NEXT_PUBLIC_SENTRY_DSN..."
railway variables --delete "NEXT_PUBLIC_SENTRY_DSN" 2>/dev/null && echo "✅ NEXT_PUBLIC_SENTRY_DSN supprimée" || echo "⚠️  Variable non trouvée ou déjà supprimée"

echo "Suppression de NEXT_PUBLIC_SENTRY_ENABLED..."
railway variables --delete "NEXT_PUBLIC_SENTRY_ENABLED" 2>/dev/null && echo "✅ NEXT_PUBLIC_SENTRY_ENABLED supprimée" || echo "⚠️  Variable non trouvée ou déjà supprimée"

echo "Suppression de SENTRY_AUTH_TOKEN..."
railway variables --delete "SENTRY_AUTH_TOKEN" 2>/dev/null && echo "✅ SENTRY_AUTH_TOKEN supprimée" || echo "⚠️  Variable non trouvée ou déjà supprimée"

echo "Suppression de SENTRY_ORG..."
railway variables --delete "SENTRY_ORG" 2>/dev/null && echo "✅ SENTRY_ORG supprimée" || echo "⚠️  Variable non trouvée ou déjà supprimée"

echo "Suppression de SENTRY_PROJECT..."
railway variables --delete "SENTRY_PROJECT" 2>/dev/null && echo "✅ SENTRY_PROJECT supprimée" || echo "⚠️  Variable non trouvée ou déjà supprimée"

cd .. 2>/dev/null

echo ""
echo "📦 Désactivation du backend..."
cd backend 2>/dev/null || echo "⚠️  Répertoire backend non trouvé, continuons..."

# Supprimer les variables Sentry du backend
echo "Suppression de SENTRY_DSN..."
railway variables --delete "SENTRY_DSN" 2>/dev/null && echo "✅ SENTRY_DSN supprimée" || echo "⚠️  Variable non trouvée ou déjà supprimée"

cd .. 2>/dev/null

echo ""
echo "============================================"
echo "✅ Désactivation Sentry terminée !"
echo "============================================"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Redéployez le frontend: cd frontend && railway up"
echo "2. Redéployez le backend: cd backend && railway up"
echo "3. Vérifiez que Sentry ne s'initialise plus dans les logs"
echo ""
echo "💡 Note: Les variables d'environnement ont été supprimées."
echo "   Sentry est également désactivé dans le code source."
echo ""

