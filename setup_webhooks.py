#!/usr/bin/env python3
"""
Script pour configurer automatiquement les webhooks Stripe et KKiaPay
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
RAILWAY_DOMAIN = "appsmith-seka-production.up.railway.app"  # À ajuster selon votre domaine Railway

def setup_stripe_webhook():
    """Configure le webhook Stripe"""
    print("🔧 Configuration du webhook Stripe...")
    
    url = "https://api.stripe.com/v1/webhook_endpoints"
    
    webhook_url = f"https://{RAILWAY_DOMAIN}/api/v1/payments/stripe/webhook"
    
    data = {
        "url": webhook_url,
        "enabled_events[]": [
            "invoice.payment_succeeded",
            "invoice.payment_failed",
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted",
            "checkout.session.completed",
        ],
        "description": "SEKA Enterprise - Production Webhook"
    }
    
    try:
        response = requests.post(
            url,
            auth=(STRIPE_SECRET_KEY, ""),
            data=data
        )
        
        if response.status_code == 200:
            result = response.json()
            webhook_secret = result.get("secret")
            print(f"✅ Webhook Stripe créé avec succès!")
            print(f"📍 URL: {webhook_url}")
            print(f"🔑 Webhook Secret: {webhook_secret}")
            print(f"\n⚠️  IMPORTANT: Ajoutez cette variable à Railway:")
            print(f"   STRIPE_WEBHOOK_SECRET={webhook_secret}")
            return True
        else:
            print(f"❌ Erreur Stripe: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception lors de la configuration Stripe: {e}")
        return False


def list_stripe_webhooks():
    """Liste les webhooks Stripe existants"""
    print("\n📋 Webhooks Stripe existants:")
    
    url = "https://api.stripe.com/v1/webhook_endpoints"
    
    try:
        response = requests.get(
            url,
            auth=(STRIPE_SECRET_KEY, "")
        )
        
        if response.status_code == 200:
            result = response.json()
            webhooks = result.get("data", [])
            
            if not webhooks:
                print("   Aucun webhook configuré")
            else:
                for webhook in webhooks:
                    print(f"\n   ID: {webhook['id']}")
                    print(f"   URL: {webhook['url']}")
                    print(f"   Status: {'✅ Actif' if webhook.get('status') == 'enabled' else '❌ Inactif'}")
                    print(f"   Événements: {len(webhook.get('enabled_events', []))}")
            return True
        else:
            print(f"❌ Erreur: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def test_webhook_endpoint():
    """Teste que l'endpoint webhook est accessible"""
    print("\n🧪 Test de l'endpoint webhook...")
    
    webhook_url = f"https://{RAILWAY_DOMAIN}/api/v1/payments/stripe/webhook"
    
    try:
        # Test simple avec un payload vide (devrait retourner 400 ou 200)
        response = requests.post(
            webhook_url,
            json={"type": "test"},
            timeout=5
        )
        
        if response.status_code in [200, 400, 422]:
            print(f"✅ Endpoint accessible (status: {response.status_code})")
            return True
        else:
            print(f"⚠️  Endpoint retourne: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout - L'endpoint ne répond pas")
        return False
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False


def main():
    print("=" * 60)
    print("🚀 Configuration des Webhooks SEKA Enterprise")
    print("=" * 60)
    
    if not STRIPE_SECRET_KEY:
        print("❌ STRIPE_SECRET_KEY non trouvée dans .env")
        sys.exit(1)
    
    print(f"\n🌐 Domaine Railway: {RAILWAY_DOMAIN}")
    
    # 1. Tester l'endpoint
    if not test_webhook_endpoint():
        print("\n⚠️  L'endpoint webhook n'est pas accessible.")
        print("   Assurez-vous que l'application est déployée sur Railway.")
        response = input("\n   Continuer quand même? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # 2. Lister les webhooks existants
    list_stripe_webhooks()
    
    # 3. Demander confirmation
    print("\n" + "=" * 60)
    response = input("Créer un nouveau webhook Stripe? (y/N): ")
    
    if response.lower() == 'y':
        if setup_stripe_webhook():
            print("\n✅ Configuration terminée avec succès!")
            print("\n📝 Prochaines étapes:")
            print("   1. Copiez le STRIPE_WEBHOOK_SECRET ci-dessus")
            print("   2. Ajoutez-le dans Railway → Variables")
            print("   3. Redéployez l'application")
        else:
            print("\n❌ Échec de la configuration")
            sys.exit(1)
    else:
        print("\n⏭️  Configuration annulée")
    
    print("\n" + "=" * 60)
    print("Note: KKiaPay nécessite une configuration manuelle via leur dashboard")
    print("      Voir WEBHOOKS.md pour les instructions")
    print("=" * 60)


if __name__ == "__main__":
    main()
