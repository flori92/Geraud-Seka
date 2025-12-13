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

# Vérifier les variables Sentry existantes
echo "🔍 Vérification des variables Sentry existantes..."
echo ""

FRONTEND_VARS=""
BACKEND_VARS=""

# Vérifier le frontend
if [ -d "frontend" ]; then
    cd frontend 2>/dev/null
    if railway status > /dev/null 2>&1; then
        echo "📦 Variables Sentry dans le frontend:"
        SENTRY_VARS=$(railway variables 2>/dev/null | grep -i "SENTRY" || echo "")
        if [ -n "$SENTRY_VARS" ]; then
            echo "$SENTRY_VARS"
            FRONTEND_VARS="$SENTRY_VARS"
        else
            echo "   Aucune variable Sentry trouvée"
        fi
    fi
    cd .. 2>/dev/null
fi

# Vérifier le backend
if [ -d "backend" ]; then
    cd backend 2>/dev/null
    if railway status > /dev/null 2>&1; then
        echo ""
        echo "📦 Variables Sentry dans le backend:"
        SENTRY_VARS=$(railway variables 2>/dev/null | grep -i "SENTRY" || echo "")
        if [ -n "$SENTRY_VARS" ]; then
            echo "$SENTRY_VARS"
            BACKEND_VARS="$SENTRY_VARS"
        else
            echo "   Aucune variable Sentry trouvée"
        fi
    fi
    cd .. 2>/dev/null
fi

echo ""
echo "⚠️  IMPORTANT: Railway CLI ne permet pas de supprimer directement les variables."
echo "   Vous devez les supprimer manuellement via l'interface web Railway."
echo ""

# Demander confirmation
read -p "Voulez-vous ouvrir l'interface Railway pour supprimer les variables ? (oui/non): " CONFIRM
if [ "$CONFIRM" = "oui" ] || [ "$CONFIRM" = "OUI" ] || [ "$CONFIRM" = "o" ] || [ "$CONFIRM" = "O" ]; then
    echo ""
    echo "🌐 Ouverture de l'interface Railway..."
    
    # Ouvrir le frontend si des variables existent
    if [ -n "$FRONTEND_VARS" ] && [ -d "frontend" ]; then
        cd frontend 2>/dev/null
        echo "   Ouverture du projet frontend..."
        railway open 2>/dev/null || echo "   ⚠️  Impossible d'ouvrir automatiquement. Allez sur https://railway.app"
        cd .. 2>/dev/null
    fi
    
    # Ouvrir le backend si des variables existent
    if [ -n "$BACKEND_VARS" ] && [ -d "backend" ]; then
        cd backend 2>/dev/null
        echo "   Ouverture du projet backend..."
        railway open 2>/dev/null || echo "   ⚠️  Impossible d'ouvrir automatiquement. Allez sur https://railway.app"
        cd .. 2>/dev/null
    fi
    
    echo ""
    echo "📋 Instructions pour supprimer les variables:"
    echo "   1. Dans l'interface Railway, allez dans l'onglet 'Variables'"
    echo "   2. Trouvez les variables Sentry listées ci-dessus"
    echo "   3. Cliquez sur l'icône de suppression (🗑️) à côté de chaque variable"
    echo "   4. Confirmez la suppression"
    echo ""
else
    echo ""
    echo "📋 Pour supprimer manuellement les variables Sentry:"
    echo "   1. Allez sur https://railway.app"
    echo "   2. Sélectionnez votre projet"
    echo "   3. Allez dans l'onglet 'Variables'"
    echo "   4. Supprimez les variables Sentry listées ci-dessus"
    echo ""
fi

echo "============================================"
echo "✅ Instructions affichées"
echo "============================================"
echo ""
echo "💡 Note importante:"
echo "   - Sentry est déjà désactivé dans le code source"
echo "   - Même si les variables restent sur Railway, Sentry ne s'initialisera pas"
echo "   - Pour une désactivation complète, supprimez quand même les variables"
echo ""
echo "📋 Variables à supprimer sur Railway:"
echo "   Frontend: NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_SENTRY_ENABLED,"
echo "            SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT"
echo "   Backend:  SENTRY_DSN"
echo ""

