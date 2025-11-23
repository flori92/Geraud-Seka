#!/bin/bash

echo "🚀 Configuration Automatique de Cloudflare pour CORS"
echo "====================================================="
echo ""

# Vérifier si le token est défini
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Token API Cloudflare non défini"
    echo ""
    echo "📋 Instructions :"
    echo ""
    echo "1. Créez un token API sur Cloudflare :"
    echo "   https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    echo "2. Permissions requises :"
    echo "   - Zone.Zone Settings (Edit)"
    echo "   - Zone.WAF (Edit)"
    echo "   - Zone.Firewall Services (Edit)"
    echo ""
    echo "3. Zone : sekagestion.com"
    echo ""
    echo "4. Exportez le token :"
    echo "   export CLOUDFLARE_API_TOKEN='votre_token_ici'"
    echo ""
    echo "5. Relancez ce script :"
    echo "   ./fix_cloudflare_cors.sh"
    echo ""
    echo "📖 Guide détaillé : CLOUDFLARE_AUTO_CONFIG.md"
    exit 1
fi

echo "✅ Token API détecté"
echo ""

# Utiliser le venv du backend pour avoir accès à requests
if [ -f "backend/venv/bin/python3" ]; then
    PYTHON_CMD="backend/venv/bin/python3"
elif [ -f "venv/bin/python3" ]; then
    PYTHON_CMD="venv/bin/python3"
else
    PYTHON_CMD="python3"
fi

echo "🔧 Exécution de la configuration..."
echo ""

$PYTHON_CMD configure_cloudflare.py

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Configuration terminée !"
    echo ""
    echo "🧪 Testez maintenant :"
    echo "   cd backend && ./test_api_access.sh"
    echo ""
    echo "🌐 Puis essayez de vous connecter :"
    echo "   https://www.sekagestion.com/login"
else
    echo ""
    echo "⚠️  La configuration a échoué"
    echo ""
    echo "📖 Consultez le guide manuel : CLOUDFLARE_FIX.md"
fi

exit $exit_code
