# ✅ Configuration Automatique Complétée

**Date**: 22 novembre 2025  
**Statut**: ✅ Webhooks configurés automatiquement

---

## 🎯 Ce qui a été fait automatiquement

### 1. ✅ Webhook Stripe Créé

**Détails**:
- **ID**: `we_1SWFnkDwlzzuHiL2LRiSLtI7`
- **URL**: `https://appsmith-seka-production.up.railway.app/api/v1/payments/stripe/webhook`
- **Status**: ✅ Actif (enabled)
- **Mode**: Test
- **Secret**: `whsec_Oqh7XjtlhA8AzJahj804gF4QVkCwvwSw`

**Événements écoutés**:
- ✅ `invoice.payment_succeeded` - Paiement réussi
- ✅ `invoice.payment_failed` - Paiement échoué
- ✅ `customer.subscription.created` - Abonnement créé
- ✅ `customer.subscription.updated` - Abonnement mis à jour
- ✅ `customer.subscription.deleted` - Abonnement annulé

### 2. ✅ Variable d'environnement ajoutée

Le secret webhook a été ajouté à `backend/.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_Oqh7XjtlhA8AzJahj804gF4QVkCwvwSw
```

---

## 📋 Actions Manuelles Requises

### 1. ⚠️ Ajouter le secret à Railway

Allez sur Railway et ajoutez cette variable d'environnement:

```
STRIPE_WEBHOOK_SECRET=whsec_Oqh7XjtlhA8AzJahj804gF4QVkCwvwSw
```

**Comment faire**:
1. Ouvrir Railway Dashboard
2. Sélectionner le service backend
3. Aller dans **Variables**
4. Ajouter `STRIPE_WEBHOOK_SECRET` avec la valeur ci-dessus
5. Redéployer (automatique)

### 2. ⏳ KKiaPay (Configuration manuelle requise)

KKiaPay ne fournit pas d'API pour créer des webhooks. Configuration manuelle:

1. Aller sur [dashboard.kkiapay.me](https://dashboard.kkiapay.me)
2. **Paramètres** → **Webhooks**
3. Ajouter l'URL: `https://appsmith-seka-production.up.railway.app/api/v1/payments/kkiapay/webhook`
4. Activer les notifications pour:
   - ✅ Paiement réussi (SUCCESS)
   - ✅ Paiement échoué (FAILED)
   - ✅ Paiement en attente (PENDING)

---

## 🧪 Tests à Effectuer

### Test Stripe (Mode Test)

1. **Carte de test Stripe**:
   ```
   Numéro: 4242 4242 4242 4242
   Date: N'importe quelle date future
   CVC: N'importe quel 3 chiffres
   ```

2. **Tester un paiement**:
   - Aller sur `https://appsmith-seka-production.up.railway.app/pricing`
   - Sélectionner "Carte Bancaire (Stripe)"
   - Choisir un plan
   - Utiliser la carte de test

3. **Vérifier les logs Railway**:
   ```
   Received Stripe webhook: invoice.payment_succeeded
   Updated subscription status for tenant <uuid>
   ```

### Test KKiaPay

1. Utiliser le mode test de KKiaPay
2. Vérifier que le webhook est bien appelé

---

## 📊 Monitoring

### Vérifier les webhooks Stripe

```bash
curl https://api.stripe.com/v1/webhook_endpoints \
  -u "sk_test_YOUR_STRIPE_SECRET_KEY:"
```

### Logs Railway

Surveiller les logs pour:
- ✅ Réception des webhooks
- ✅ Mise à jour du statut d'abonnement
- ❌ Erreurs de signature (si implémentée)

---

## 🔐 Sécurité (À Implémenter)

### Vérification des signatures Stripe

Le code actuel **n'implémente pas** la vérification des signatures. Pour la production, il faut:

1. Installer `stripe` dans `requirements.txt`
2. Modifier `backend/app/api/v1/routes/payments.py`:

```python
import stripe

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
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
    
    # Traiter l'événement...
```

---

## ✅ Checklist Finale

- [x] Webhook Stripe créé via API
- [x] Secret webhook ajouté à `.env`
- [ ] Secret webhook ajouté à Railway
- [ ] Application redéployée
- [ ] Webhook KKiaPay configuré manuellement
- [ ] Tests de paiement effectués
- [ ] Vérification des signatures implémentée (recommandé)

---

## 🚀 Prochaines Étapes

1. **Ajouter le secret à Railway** (prioritaire)
2. **Configurer KKiaPay** (manuel)
3. **Tester les paiements** en mode test
4. **Implémenter la vérification des signatures** (sécurité)
5. **Passer en mode production** quand tout fonctionne

---

**Note**: Le webhook est actuellement en **mode test**. Pour passer en production:
1. Créer un nouveau webhook avec les clés live de Stripe
2. Mettre à jour `STRIPE_SECRET_KEY` avec la clé live
3. Reconfigurer le webhook avec l'URL de production
