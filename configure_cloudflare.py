#!/usr/bin/env python3
"""
Script pour configurer automatiquement Cloudflare pour résoudre les problèmes CORS.

Ce script va :
1. Créer une Configuration Rule pour désactiver les protections sur api.sekagestion.com
2. Créer une WAF Custom Rule pour autoriser les requêtes API
3. Ajuster les paramètres de sécurité globaux

Prérequis :
- Un token API Cloudflare avec les permissions :
  * Zone.Zone Settings (Edit)
  * Zone.WAF (Edit)
  * Zone.Page Rules (Edit)
"""

import os
import sys
import requests
import json
from typing import Optional

# Configuration
CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"
ZONE_NAME = "sekagestion.com"
API_SUBDOMAIN = "api.sekagestion.com"


class CloudflareConfigurator:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        self.zone_id: Optional[str] = None

    def get_zone_id(self) -> bool:
        """Récupère l'ID de la zone Cloudflare."""
        print(f"🔍 Recherche de la zone '{ZONE_NAME}'...")
        
        url = f"{CLOUDFLARE_API_BASE}/zones"
        params = {"name": ZONE_NAME}
        
        response = requests.get(url, headers=self.headers, params=params)
        
        if response.status_code != 200:
            print(f"❌ Erreur lors de la récupération de la zone: {response.text}")
            return False
        
        data = response.json()
        
        if not data.get("success") or not data.get("result"):
            print(f"❌ Zone '{ZONE_NAME}' non trouvée")
            return False
        
        self.zone_id = data["result"][0]["id"]
        print(f"✅ Zone trouvée: {self.zone_id}")
        return True

    def update_security_level(self) -> bool:
        """Ajuste le niveau de sécurité global."""
        print("\n🔧 Configuration du niveau de sécurité...")
        
        url = f"{CLOUDFLARE_API_BASE}/zones/{self.zone_id}/settings/security_level"
        payload = {"value": "medium"}
        
        response = requests.patch(url, headers=self.headers, json=payload)
        
        if response.status_code == 200 and response.json().get("success"):
            print("✅ Niveau de sécurité réglé sur 'Medium'")
            return True
        else:
            print(f"⚠️  Impossible de modifier le niveau de sécurité: {response.text}")
            return False

    def disable_browser_check(self) -> bool:
        """Désactive Browser Integrity Check."""
        print("\n🔧 Désactivation de Browser Integrity Check...")
        
        url = f"{CLOUDFLARE_API_BASE}/zones/{self.zone_id}/settings/browser_check"
        payload = {"value": "off"}
        
        response = requests.patch(url, headers=self.headers, json=payload)
        
        if response.status_code == 200 and response.json().get("success"):
            print("✅ Browser Integrity Check désactivé")
            return True
        else:
            print(f"⚠️  Impossible de désactiver Browser Check: {response.text}")
            return False

    def create_waf_rule(self) -> bool:
        """Crée une règle WAF pour autoriser les requêtes API."""
        print("\n🔧 Création de la règle WAF pour l'API...")
        
        url = f"{CLOUDFLARE_API_BASE}/zones/{self.zone_id}/rulesets/phases/http_request_firewall_custom/entrypoint"
        
        # D'abord, récupérons le ruleset existant
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            existing_ruleset = response.json().get("result", {})
            existing_rules = existing_ruleset.get("rules", [])
        else:
            existing_rules = []
        
        # Vérifier si la règle existe déjà
        rule_exists = any(
            rule.get("description") == "Allow API Requests - Auto-configured"
            for rule in existing_rules
        )
        
        if rule_exists:
            print("ℹ️  La règle WAF existe déjà")
            return True
        
        # Créer la nouvelle règle
        new_rule = {
            "action": "skip",
            "action_parameters": {
                "ruleset": "current"
            },
            "expression": f'(http.host eq "{API_SUBDOMAIN}")',
            "description": "Allow API Requests - Auto-configured",
            "enabled": True
        }
        
        # Ajouter la règle au début de la liste
        all_rules = [new_rule] + existing_rules
        
        payload = {
            "rules": all_rules
        }
        
        response = requests.put(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201] and response.json().get("success"):
            print(f"✅ Règle WAF créée pour {API_SUBDOMAIN}")
            return True
        else:
            print(f"⚠️  Impossible de créer la règle WAF: {response.text}")
            return False

    def create_configuration_rule(self) -> bool:
        """Crée une Configuration Rule pour l'API."""
        print("\n🔧 Création de la Configuration Rule...")
        
        # Note: Les Configuration Rules utilisent le phase http_config_settings
        url = f"{CLOUDFLARE_API_BASE}/zones/{self.zone_id}/rulesets/phases/http_config_settings/entrypoint"
        
        # Récupérer le ruleset existant
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            existing_ruleset = response.json().get("result", {})
            existing_rules = existing_ruleset.get("rules", [])
        else:
            existing_rules = []
        
        # Vérifier si la règle existe déjà
        rule_exists = any(
            rule.get("description") == "API CORS Configuration - Auto-configured"
            for rule in existing_rules
        )
        
        if rule_exists:
            print("ℹ️  La Configuration Rule existe déjà")
            return True
        
        # Créer la nouvelle règle
        new_rule = {
            "action": "set_config",
            "action_parameters": {
                "bic": False,
                "security_level": "essentially_off"
            },
            "expression": f'(http.host eq "{API_SUBDOMAIN}")',
            "description": "API CORS Configuration - Auto-configured",
            "enabled": True
        }
        
        all_rules = [new_rule] + existing_rules
        
        payload = {
            "rules": all_rules
        }
        
        response = requests.put(url, headers=self.headers, json=payload)
        
        if response.status_code in [200, 201] and response.json().get("success"):
            print(f"✅ Configuration Rule créée pour {API_SUBDOMAIN}")
            return True
        else:
            print(f"⚠️  Impossible de créer la Configuration Rule: {response.text}")
            # Ce n'est pas critique si ça échoue
            return True

    def run(self) -> bool:
        """Exécute toutes les configurations."""
        print("=" * 60)
        print("🚀 Configuration automatique de Cloudflare pour CORS")
        print("=" * 60)
        
        if not self.get_zone_id():
            return False
        
        success = True
        
        # Ces opérations ne sont pas critiques
        self.update_security_level()
        self.disable_browser_check()
        
        # Ces opérations sont critiques
        if not self.create_waf_rule():
            success = False
        
        self.create_configuration_rule()
        
        print("\n" + "=" * 60)
        if success:
            print("✅ Configuration terminée avec succès!")
            print("\n📋 Prochaines étapes:")
            print("1. Attendez 1-2 minutes pour que les changements se propagent")
            print("2. Testez avec: cd backend && ./test_api_access.sh")
            print("3. Essayez de vous connecter sur https://www.sekagestion.com/login")
        else:
            print("⚠️  Configuration terminée avec des avertissements")
            print("Vérifiez manuellement le tableau de bord Cloudflare")
        print("=" * 60)
        
        return success


def main():
    print("\n🔐 Configuration Cloudflare pour résoudre les problèmes CORS\n")
    
    # Récupérer le token API
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    
    if not api_token:
        print("❌ Variable d'environnement CLOUDFLARE_API_TOKEN non définie\n")
        print("📋 Pour obtenir un token API Cloudflare:")
        print("1. Allez sur https://dash.cloudflare.com/profile/api-tokens")
        print("2. Cliquez sur 'Create Token'")
        print("3. Utilisez le template 'Edit zone DNS' ou créez un token personnalisé avec:")
        print("   - Zone.Zone Settings (Edit)")
        print("   - Zone.WAF (Edit)")
        print("   - Zone.Firewall Services (Edit)")
        print("4. Sélectionnez la zone 'sekagestion.com'")
        print("5. Créez le token et copiez-le")
        print("\n6. Exportez-le:")
        print("   export CLOUDFLARE_API_TOKEN='votre_token_ici'")
        print("\n7. Relancez ce script:")
        print("   python3 configure_cloudflare.py")
        return 1
    
    configurator = CloudflareConfigurator(api_token)
    success = configurator.run()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
