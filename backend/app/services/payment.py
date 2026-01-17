"""Service de paiement avec Stripe et KKiaPay."""
from typing import Dict, Any, Optional
import httpx
from decimal import Decimal

from app.core.config import get_settings

settings = get_settings()


class StripeService:
    """Service de paiement Stripe pour cartes bancaires internationales."""
    
    def __init__(self):
        self.secret_key = settings.stripe_secret_key
        self.public_key = settings.stripe_api_key
        self.base_url = "https://api.stripe.com/v1"
    
    async def create_customer(
        self,
        email: str,
        name: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Créer un client Stripe."""
        if not self.secret_key:
            return {"id": "cus_mock", "email": email}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/customers",
                    auth=(self.secret_key, ""),
                    data={
                        "email": email,
                        "name": name,
                        "metadata": metadata or {}
                    }
                )
                return response.json()
        except Exception as e:
            print(f"Erreur Stripe create_customer: {e}")
            return {"id": "cus_mock", "email": email}
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Créer un abonnement Stripe."""
        if not self.secret_key:
            return {"id": "sub_mock", "status": "active"}
        
        try:
            data = {
                "customer": customer_id,
                "items": [{"price": price_id}]
            }
            if trial_days:
                data["trial_period_days"] = trial_days
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/subscriptions",
                    auth=(self.secret_key, ""),
                    data=data
                )
                return response.json()
        except Exception as e:
            print(f"Erreur Stripe create_subscription: {e}")
            return {"id": "sub_mock", "status": "active"}
    
    async def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Annuler un abonnement Stripe."""
        if not self.secret_key:
            return {"id": subscription_id, "status": "canceled"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/subscriptions/{subscription_id}",
                    auth=(self.secret_key, "")
                )
                return response.json()
        except Exception as e:
            print(f"Erreur Stripe cancel_subscription: {e}")
            return {"id": subscription_id, "status": "canceled"}


class KKiaPayService:
    """Service de paiement KKiaPay pour Mobile Money (Afrique)."""
    
    def __init__(self):
        self.public_key = settings.kkiapay_public_key
        self.private_key = settings.kkiapay_private_key
        self.secret = settings.kkiapay_secret
        self.base_url = "https://api.kkiapay.me/api/v1"
    
    async def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Vérifier le statut d'un paiement KKiaPay."""
        if not self.private_key:
            return {"status": "SUCCESS", "transactionId": transaction_id}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/transactions/{transaction_id}",
                    headers={
                        "x-api-key": self.private_key
                    }
                )
                return response.json()
        except Exception as e:
            print(f"Erreur KKiaPay verify_payment: {e}")
            return {"status": "FAILED", "transactionId": transaction_id}
    
    async def create_payment_link(
        self,
        amount: Decimal,
        reason: str,
        callback_url: str
    ) -> Dict[str, Any]:
        """Créer un lien de paiement KKiaPay."""
        if not self.public_key:
            return {
                "url": f"https://kkiapay.me/mock/{amount}",
                "transaction_id": "mock_txn"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/payment-requests",
                    headers={
                        "x-api-key": self.public_key
                    },
                    json={
                        "amount": float(amount),
                        "reason": reason,
                        "callback": callback_url
                    }
                )
                data = response.json()
                return {
                    "url": data.get("url"),
                    "transaction_id": data.get("requestId")
                }
        except Exception as e:
            print(f"Erreur KKiaPay create_payment_link: {e}")
            return {
                "url": f"https://kkiapay.me/mock/{amount}",
                "transaction_id": "mock_txn"
            }
    
    async def get_transactions(self) -> list:
        """Récupérer les transactions depuis l'API KKIAPAY."""
        if not self.private_key:
            # Retourner des données mockées si les clés ne sont pas configurées
            return [
                {
                    "id": "txn_001",
                    "requestId": "REQ_001",
                    "status": "SUCCESS",
                    "amount": 50000,
                    "fees": 250,
                    "currency": "XOF",
                    "reason": "Paiement facture",
                    "phone": "+22912345678",
                    "customer": "Client A",
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:35:00Z",
                    "provider": "orange"
                },
                {
                    "id": "txn_002", 
                    "requestId": "REQ_002",
                    "status": "PENDING",
                    "amount": 25000,
                    "fees": 150,
                    "currency": "XOF",
                    "reason": "Transfert fonds",
                    "phone": "+22987654321",
                    "customer": "Fournisseur B",
                    "created_at": "2024-01-15T14:20:00Z",
                    "updated_at": "2024-01-15T14:20:00Z",
                    "provider": "mtn"
                }
            ]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/transactions",
                    headers={
                        "x-api-key": self.private_key
                    }
                )
                data = response.json()
                return data.get("data", [])
        except Exception as e:
            print(f"Erreur KKiaPay get_transactions: {e}")
            return []


stripe_service = StripeService()
kkiapay_service = KKiaPayService()
