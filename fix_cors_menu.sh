#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║        🔧 RÉSOLUTION PROBLÈME CORS - SEKA GESTION         ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🚨 Problème identifié :${NC}"
echo "   Cloudflare bloque les requêtes API (403 Forbidden)"
echo "   → Empêche la connexion sur www.sekagestion.com"
echo ""
echo -e "${GREEN}✅ Solutions disponibles :${NC}"
echo ""
echo "   1️⃣  Configuration Automatique (RECOMMANDÉ)"
echo "       → Utilise l'API Cloudflare pour tout configurer"
echo "       → Durée : 5 minutes"
echo "       → Nécessite : Token API Cloudflare"
echo ""
echo "   2️⃣  Configuration Manuelle"
echo "       → Via le dashboard Cloudflare"
echo "       → Durée : 10 minutes"
echo "       → Nécessite : Accès au compte Cloudflare"
echo ""
echo "   3️⃣  Bypass Temporaire (pour tester)"
echo "       → Utilise l'URL Railway directe"
echo "       → Durée : 2 minutes"
echo "       → Temporaire uniquement !"
echo ""
echo "   4️⃣  Tester l'API actuelle"
echo "       → Vérifie si le problème est résolu"
echo "       → Durée : 30 secondes"
echo ""
echo "   5️⃣  Afficher la documentation"
echo "       → Guides détaillés"
echo ""
echo "   0️⃣  Quitter"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "Choisissez une option (0-5) : " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🤖 Configuration Automatique${NC}"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        
        if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
            echo -e "${YELLOW}📋 Étapes à suivre :${NC}"
            echo ""
            echo "1. Créez un token API Cloudflare :"
            echo "   https://dash.cloudflare.com/profile/api-tokens"
            echo ""
            echo "2. Permissions requises :"
            echo "   - Zone.Zone Settings (Edit)"
            echo "   - Zone.WAF (Edit)"
            echo "   - Zone.Firewall Services (Edit)"
            echo ""
            echo "3. Zone : sekagestion.com"
            echo ""
            echo "4. Copiez le token et exécutez :"
            echo ""
            echo -e "   ${BLUE}export CLOUDFLARE_API_TOKEN='votre_token_ici'${NC}"
            echo -e "   ${BLUE}./fix_cloudflare_cors.sh${NC}"
            echo ""
            echo "📖 Guide détaillé : CLOUDFLARE_AUTO_CONFIG.md"
        else
            echo -e "${GREEN}✅ Token détecté !${NC}"
            echo ""
            ./fix_cloudflare_cors.sh
        fi
        ;;
    
    2)
        echo ""
        echo -e "${GREEN}🖱️  Configuration Manuelle${NC}"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "📖 Consultez le guide détaillé : CLOUDFLARE_FIX.md"
        echo ""
        echo "Résumé des étapes :"
        echo ""
        echo "1. https://dash.cloudflare.com → sekagestion.com"
        echo "2. Security > Settings :"
        echo "   - Security Level → Medium"
        echo "   - Browser Integrity Check → Off"
        echo "3. Rules > Configuration Rules → Create rule"
        echo "4. Security > WAF → Custom rules → Create rule"
        echo ""
        echo "Ouvrir le guide complet ? (o/n)"
        read -p "> " open_guide
        if [ "$open_guide" = "o" ] || [ "$open_guide" = "O" ]; then
            if command -v open &> /dev/null; then
                open CLOUDFLARE_FIX.md
            elif command -v xdg-open &> /dev/null; then
                xdg-open CLOUDFLARE_FIX.md
            else
                cat CLOUDFLARE_FIX.md
            fi
        fi
        ;;
    
    3)
        echo ""
        echo -e "${YELLOW}🔄 Bypass Temporaire${NC}"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        cd backend
        ./get_railway_url.sh
        cd ..
        ;;
    
    4)
        echo ""
        echo -e "${BLUE}🧪 Test de l'API${NC}"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        cd backend
        ./test_api_access.sh
        cd ..
        echo ""
        echo -e "${YELLOW}Analyse des résultats :${NC}"
        echo ""
        echo "✅ Si vous voyez HTTP/2 200 → Problème résolu !"
        echo "❌ Si vous voyez HTTP/2 403 → Cloudflare bloque encore"
        echo ""
        ;;
    
    5)
        echo ""
        echo -e "${BLUE}📚 Documentation${NC}"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Fichiers disponibles :"
        echo ""
        echo "  📄 SOLUTION_RAPIDE.md"
        echo "     → Guide rapide en français (5 min)"
        echo ""
        echo "  📄 FIX_CORS_README.md"
        echo "     → Guide complet avec toutes les solutions"
        echo ""
        echo "  📄 CLOUDFLARE_AUTO_CONFIG.md"
        echo "     → Configuration automatique détaillée"
        echo ""
        echo "  📄 CLOUDFLARE_FIX.md"
        echo "     → Configuration manuelle détaillée"
        echo ""
        echo "Quel fichier voulez-vous ouvrir ? (1-4, 0 pour annuler)"
        read -p "> " doc_choice
        
        case $doc_choice in
            1) 
                if command -v open &> /dev/null; then
                    open SOLUTION_RAPIDE.md
                else
                    cat SOLUTION_RAPIDE.md
                fi
                ;;
            2) 
                if command -v open &> /dev/null; then
                    open FIX_CORS_README.md
                else
                    cat FIX_CORS_README.md
                fi
                ;;
            3) 
                if command -v open &> /dev/null; then
                    open CLOUDFLARE_AUTO_CONFIG.md
                else
                    cat CLOUDFLARE_AUTO_CONFIG.md
                fi
                ;;
            4) 
                if command -v open &> /dev/null; then
                    open CLOUDFLARE_FIX.md
                else
                    cat CLOUDFLARE_FIX.md
                fi
                ;;
        esac
        ;;
    
    0)
        echo ""
        echo -e "${GREEN}Au revoir ! 👋${NC}"
        echo ""
        exit 0
        ;;
    
    *)
        echo ""
        echo -e "${RED}❌ Option invalide${NC}"
        echo ""
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
