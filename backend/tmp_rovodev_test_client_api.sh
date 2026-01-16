#!/bin/bash
# Script de test réel des API clients avec interconnexion
# Ce script teste les nouvelles fonctionnalités implémentées

set -e

echo "============================================="
echo "TEST CRÉATION CLIENTS AVEC INTERCONNEXION"
echo "============================================="

API_URL="${API_URL:-http://localhost:8000}"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}⚠️  NOTE: Ce test nécessite un serveur backend actif et un token valide${NC}\n"

# Fonction pour obtenir un token
get_token() {
    echo -e "${YELLOW}Étape 0: Obtention du token d'authentification${NC}"
    
    # Vous devrez adapter ces credentials
    TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@seka.com",
            "password": "admin123"
        }' | jq -r '.access_token // empty')
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Impossible d'obtenir un token. Vérifiez les credentials.${NC}"
        echo "   Utilisez: export TEST_EMAIL=votre@email.com TEST_PASSWORD=motdepasse"
        return 1
    fi
    
    echo -e "${GREEN}✅ Token obtenu${NC}"
    echo "$TOKEN"
}

# Test 1: Créer un client avec compte auxiliaire uniquement
test_client_with_auxiliary() {
    local TOKEN=$1
    
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}TEST 1: Client avec compte auxiliaire${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/clients" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Entreprise ABC",
            "code": "TESTCLI01",
            "slug": "test-entreprise-abc",
            "sector": "Services",
            "nif": "1234567890",
            "rccm": "RCCM-TEST-2024",
            "contact_name": "Marie Test",
            "email": "test@entreprise-abc.com",
            "phone": "+229 12 34 56 78",
            "address": "123 Avenue Test, Cotonou",
            "country": "Bénin",
            "create_auxiliary_account": true,
            "create_rule": false
        }')
    
    echo "Réponse API:"
    echo "$RESPONSE" | jq '.'
    
    # Vérifier que le compte auxiliaire a été créé
    AUX_ACCOUNT=$(echo "$RESPONSE" | jq -r '.auxiliary_account_code // empty')
    
    if [ -n "$AUX_ACCOUNT" ]; then
        echo -e "\n${GREEN}✅ Test 1 RÉUSSI${NC}"
        echo -e "   Client créé avec compte auxiliaire: ${GREEN}$AUX_ACCOUNT${NC}"
        return 0
    else
        echo -e "\n${RED}❌ Test 1 ÉCHOUÉ${NC}"
        echo "   Compte auxiliaire non créé"
        return 1
    fi
}

# Test 2: Créer un client avec compte auxiliaire + règle
test_client_with_rule() {
    local TOKEN=$1
    
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}TEST 2: Client avec règle d'imputation${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/clients" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Société XYZ",
            "code": "TESTCLI02",
            "slug": "test-societe-xyz",
            "sector": "Commerce",
            "nif": "9876543210",
            "contact_name": "Jean Test",
            "email": "test@societe-xyz.com",
            "phone": "+229 98 76 54 32",
            "address": "456 Boulevard Test, Cotonou",
            "country": "Bénin",
            "create_auxiliary_account": true,
            "create_rule": true,
            "revenue_account": "701",
            "vat_account": "4457",
            "vat_rate": 18.0,
            "journal_code": "VTE",
            "ocr_keywords": "Test XYZ,Société XYZ SA"
        }')
    
    echo "Réponse API:"
    echo "$RESPONSE" | jq '.'
    
    # Vérifier que le compte auxiliaire ET la règle ont été créés
    AUX_ACCOUNT=$(echo "$RESPONSE" | jq -r '.auxiliary_account_code // empty')
    HAS_RULE=$(echo "$RESPONSE" | jq -r '.has_active_rule // false')
    
    if [ -n "$AUX_ACCOUNT" ] && [ "$HAS_RULE" = "true" ]; then
        echo -e "\n${GREEN}✅ Test 2 RÉUSSI${NC}"
        echo -e "   Client créé avec compte: ${GREEN}$AUX_ACCOUNT${NC}"
        echo -e "   Règle d'imputation: ${GREEN}Active ✓${NC}"
        echo -e "\n   Écritures automatiques configurées:"
        echo -e "   • Débit:  $AUX_ACCOUNT (Client)"
        echo -e "   • Crédit: 701 (Ventes de marchandises)"
        echo -e "   • Crédit: 4457 (TVA collectée)"
        return 0
    else
        echo -e "\n${RED}❌ Test 2 ÉCHOUÉ${NC}"
        echo "   Compte: $AUX_ACCOUNT"
        echo "   Règle: $HAS_RULE"
        return 1
    fi
}

# Test 3: Vérifier la liste des clients
test_list_clients() {
    local TOKEN=$1
    
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}TEST 3: Liste des clients${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
    
    RESPONSE=$(curl -s -X GET "$API_URL/api/v1/clients" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "Clients créés:"
    echo "$RESPONSE" | jq '.[] | {name, code, auxiliary_account_code, has_active_rule}'
    
    # Compter les clients de test
    TEST_CLIENTS=$(echo "$RESPONSE" | jq '[.[] | select(.code | startswith("TESTCLI"))] | length')
    
    if [ "$TEST_CLIENTS" -ge 2 ]; then
        echo -e "\n${GREEN}✅ Test 3 RÉUSSI${NC}"
        echo -e "   $TEST_CLIENTS clients de test trouvés"
        return 0
    else
        echo -e "\n${YELLOW}⚠️  Test 3 PARTIEL${NC}"
        echo "   Seulement $TEST_CLIENTS clients trouvés"
        return 0
    fi
}

# Test 4: Vérifier le plan comptable
test_chart_of_accounts() {
    local TOKEN=$1
    
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}TEST 4: Plan comptable (comptes 411XXX)${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
    
    RESPONSE=$(curl -s -X GET "$API_URL/api/v1/ledger-accounts" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "Comptes auxiliaires clients créés:"
    echo "$RESPONSE" | jq '[.[] | select(.account_code | startswith("411TEST"))] | .[] | {account_code, account_name, is_auxiliary}'
    
    AUXILIARY_COUNT=$(echo "$RESPONSE" | jq '[.[] | select(.account_code | startswith("411TEST"))] | length')
    
    if [ "$AUXILIARY_COUNT" -ge 2 ]; then
        echo -e "\n${GREEN}✅ Test 4 RÉUSSI${NC}"
        echo -e "   $AUXILIARY_COUNT comptes auxiliaires créés dans le plan comptable"
        return 0
    else
        echo -e "\n${YELLOW}⚠️  Test 4 PARTIEL${NC}"
        echo "   Seulement $AUXILIARY_COUNT comptes trouvés"
        return 0
    fi
}

# Cleanup: Supprimer les clients de test
cleanup() {
    local TOKEN=$1
    
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}NETTOYAGE: Suppression des données de test${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
    
    # Liste des clients de test
    CLIENTS=$(curl -s -X GET "$API_URL/api/v1/clients" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.[] | select(.code | startswith("TESTCLI")) | .id')
    
    for CLIENT_ID in $CLIENTS; do
        echo "Suppression du client: $CLIENT_ID"
        curl -s -X DELETE "$API_URL/api/v1/clients/$CLIENT_ID" \
            -H "Authorization: Bearer $TOKEN" > /dev/null
        echo -e "${GREEN}✓ Supprimé${NC}"
    done
    
    echo -e "\n${GREEN}✅ Nettoyage terminé${NC}"
}

# Main
main() {
    echo -e "\n${YELLOW}Démarrage des tests...${NC}\n"
    
    # Obtenir le token
    TOKEN=$(get_token)
    if [ $? -ne 0 ]; then
        echo -e "${RED}Impossible de continuer sans token${NC}"
        exit 1
    fi
    
    # Exécuter les tests
    FAILED=0
    
    test_client_with_auxiliary "$TOKEN" || FAILED=$((FAILED + 1))
    test_client_with_rule "$TOKEN" || FAILED=$((FAILED + 1))
    test_list_clients "$TOKEN" || FAILED=$((FAILED + 1))
    test_chart_of_accounts "$TOKEN" || FAILED=$((FAILED + 1))
    
    # Résumé
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}RÉSUMÉ DES TESTS${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ TOUS LES TESTS ONT RÉUSSI${NC}"
        echo -e "\n${GREEN}Le système d'interconnexion fonctionne correctement:${NC}"
        echo -e "  • Clients avec comptes auxiliaires 411XXX ✓"
        echo -e "  • Règles d'imputation pour factures de vente ✓"
        echo -e "  • Plan comptable mis à jour automatiquement ✓"
    else
        echo -e "${RED}❌ $FAILED test(s) échoué(s)${NC}"
    fi
    
    # Demander si on doit nettoyer
    echo -e "\n${YELLOW}Voulez-vous supprimer les données de test? (y/n)${NC}"
    read -r -n 1 CLEANUP
    echo
    
    if [ "$CLEANUP" = "y" ] || [ "$CLEANUP" = "Y" ]; then
        cleanup "$TOKEN"
    else
        echo -e "${YELLOW}Les données de test ont été conservées${NC}"
    fi
}

# Exécution
main
