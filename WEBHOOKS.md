# 🔗 Configuration des Webhooks

Ce document explique comment configurer les webhooks pour Stripe et KKiaPay afin de recevoir les notifications de paiement en temps réel.

---

## 🎯 URLs des Webhooks

### Production
- **Stripe** : `https://votre-domaine.railway.app/api/v1/payments/stripe/webhook`
- **KKiaPay** : `https://votre-domaine.railway.app/api/v1/payments/kkiapay/webhook`

### Développement Local
- **Stripe** : `http://localhost:8000/api/v1/payments/stripe/webhook`
- **KKiaPay** : `http://localhost:8000/api/v1/payments/kkiapay/webhook`

---

## 💳 Configuration Stripe

### 1. Accéder au Dashboard Stripe
1. Connectez-vous sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Développeurs** → **Webhooks**

### 2. Créer un Endpoint
1. Cliquez sur **+ Ajouter un endpoint**
2. URL de l'endpoint : `https://votre-domaine.railway.app/api/v1/payments/stripe/webhook`
3. Sélectionnez les événements à écouter :
   - ✅ `invoice.payment_succeeded` - Paiement réussi
   - ✅ `invoice.payment_failed` - Paiement échoué
   - ✅ `customer.subscription.created` - Abonnement créé
   - ✅ `customer.subscription.updated` - Abonnement mis à jour
   - ✅ `customer.subscription.deleted` - Abonnement annulé
   - ✅ `checkout.session.completed` - Session de paiement complétée

### 3. Récupérer le Secret de Signature
1. Après création, copiez le **Signing secret** (commence par `whsec_...`)
2. Ajoutez-le dans vos variables d'environnement Railway :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
   ```

### 4. Tester le Webhook (Local)
Pour tester en local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Rediriger les webhooks vers votre serveur local
stripe listen --forward-to localhost:8000/api/v1/payments/stripe/webhook

# Dans un autre terminal, déclencher un événement de test
stripe trigger invoice.payment_succeeded
```

---

## 📱 Configuration KKiaPay

### 1. Accéder au Dashboard KKiaPay
1. Connectez-vous sur [dashboard.kkiapay.me](https://dashboard.kkiapay.me)
2. Allez dans **Paramètres** → **Webhooks**

### 2. Configurer l'URL de Callback
1. URL de callback : `https://votre-domaine.railway.app/api/v1/payments/kkiapay/webhook`
2. Activez les notifications pour :
   - ✅ Paiement réussi (`SUCCESS`)
   - ✅ Paiement échoué (`FAILED`)
   - ✅ Paiement en attente (`PENDING`)

### 3. Sécurité
KKiaPay utilise votre `KKIAPAY_SECRET` pour signer les requêtes. Assurez-vous qu'il est bien configuré dans Railway :

```
KKIAPAY_PUBLIC_KEY=votre_public_key
KKIAPAY_PRIVATE_KEY=votre_private_key
KKIAPAY_SECRET=votre_secret
```

### 4. Tester le Webhook
Pour tester, effectuez un paiement de test depuis le dashboard KKiaPay ou utilisez leur API de test.

---

## 🔐 Sécurité des Webhooks

### Vérification des Signatures (À Implémenter)

#### Stripe
```python
import stripe
from fastapi import Request, HTTPException

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Traiter l'événement
    if event["type"] == "invoice.payment_succeeded":
        # Logique de traitement
        pass
    
    return {"status": "success"}
```

#### KKiaPay
```python
import hmac
import hashlib

@router.post("/kkiapay/webhook")
async def kkiapay_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("x-kkiapay-signature")
    
    # Vérifier la signature
    expected_signature = hmac.new(
        settings.kkiapay_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event = await request.json()
    
    # Traiter l'événement
    if event.get("status") == "SUCCESS":
        # Logique de traitement
        pass
    
    return {"status": "success"}
```

---

## 📊 Événements Traités

### Stripe

| Événement | Action |
|-----------|--------|
| `invoice.payment_succeeded` | Activer/renouveler l'abonnement du tenant |
| `invoice.payment_failed` | Marquer l'abonnement comme "past_due" |
| `customer.subscription.deleted` | Désactiver l'abonnement |
| `customer.subscription.updated` | Mettre à jour le plan du tenant |

### KKiaPay

| Statut | Action |
|--------|--------|
| `SUCCESS` | Activer l'abonnement du tenant |
| `FAILED` | Notifier l'utilisateur de l'échec |
| `PENDING` | Marquer comme en attente |

---

## 🧪 Tests

### Vérifier que les Webhooks Fonctionnent

1. **Stripe** :
   ```bash
   curl -X POST https://votre-domaine.railway.app/api/v1/payments/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"type": "invoice.payment_succeeded", "data": {"object": {"customer": "cus_test"}}}'
   ```

2. **KKiaPay** :
   ```bash
   curl -X POST https://votre-domaine.railway.app/api/v1/payments/kkiapay/webhook \
     -H "Content-Type: application/json" \
     -d '{"status": "SUCCESS", "transactionId": "test_123"}'
   ```

### Logs
Vérifiez les logs Railway pour confirmer la réception :
```
Received Stripe webhook: invoice.payment_succeeded
Updated subscription status for tenant <uuid>
```

---

## ✅ Checklist de Configuration

- [ ] Webhooks Stripe configurés dans le dashboard
- [ ] Secret de signature Stripe ajouté à Railway
- [ ] Webhooks KKiaPay configurés dans le dashboard
- [ ] Clés KKiaPay ajoutées à Railway
- [ ] Tests de webhooks effectués
- [ ] Vérification des signatures implémentée (recommandé pour production)
- [ ] Logs de monitoring activés

---

**Note** : En production, il est **fortement recommandé** d'implémenter la vérification des signatures pour éviter les requêtes malveillantes.
