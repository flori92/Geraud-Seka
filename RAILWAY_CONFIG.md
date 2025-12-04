# Configuration Railway - SEKA Backend

## 🚀 Variables d'Environnement à Configurer

### 1. Accéder aux Variables
1. Va sur [Railway Dashboard](https://railway.app)
2. Sélectionne le projet **SEKA Backend**
3. Clique sur l'onglet **Variables**

---

## 🔑 Variables Requises

### Google Gemini AI (NOUVEAU ✨)
```
GEMINI_API_KEY=AIzaSyCWOeMr1bijjsJwXRXFPbsfsRH6JHQ-eqU
```

### Database
```
DATABASE_URL=postgresql://...
```
*(Déjà configuré automatiquement par Railway)*

### JWT Authentication
```
SECRET_KEY=votre-secret-key-securisee
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### AWS S3 (Documents)
```
AWS_ACCESS_KEY_ID=votre-aws-access-key
AWS_SECRET_ACCESS_KEY=votre-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=seka-documents
```

### Mindee OCR
```
MINDEE_API_KEY=votre-mindee-api-key
```

### Stripe (Paiements)
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
```

### KKiaPay (Mobile Money)
```
KKIAPAY_PUBLIC_KEY=votre-kkiapay-public-key
KKIAPAY_PRIVATE_KEY=votre-kkiapay-private-key
```

### Sentry (Monitoring)
```
SENTRY_DSN=votre-sentry-dsn
```

### Resend (Emails)
```
RESEND_API_KEY=re_...
```

---

## ✅ Étapes de Configuration Gemini

### 1. Ajouter la Variable
```bash
# Dans Railway Variables
Nom: GEMINI_API_KEY
Valeur: AIzaSyCWOeMr1bijjsJwXRXFPbsfsRH6JHQ-eqU
```

### 2. Redéployer
Railway redéploiera automatiquement après l'ajout de la variable.

### 3. Vérifier
```bash
# Tester le status
curl https://api.sekagestion.com/api/v1/chat/status

# Réponse attendue:
{
  "status": "online",
  "version": "2.0",
  "features": ["rule-based", "multilingual", "gemini-ai"],
  "ai_enabled": true  ← Doit être true
}
```

### 4. Tester le Chat
```bash
curl -X POST https://api.sekagestion.com/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, quels sont les modules de SEKA ?"
  }'

# Réponse attendue:
{
  "response": "Bonjour ! SEKA propose plusieurs modules...",
  "timestamp": "2025-12-04T23:00:00",
  "ai_powered": true  ← Doit être true (IA activée)
}
```

---

## 📊 Vérification des Logs

### Voir les Logs Railway
1. Va dans ton projet Railway
2. Clique sur **Deployments**
3. Sélectionne le dernier déploiement
4. Consulte les logs

### Logs à Vérifier
```
✅ "Gemini service initialized successfully"
✅ "Chat endpoint ready with AI support"
❌ "GEMINI_API_KEY not found" → Variable manquante
❌ "Gemini initialization failed" → Clé invalide
```

---

## 🔧 Dépannage

### Problème: ai_enabled: false

**Causes possibles:**
1. Variable `GEMINI_API_KEY` non configurée
2. Clé API invalide
3. Package `google-generativeai` non installé

**Solutions:**
```bash
# 1. Vérifier la variable dans Railway
# 2. Vérifier que requirements.txt contient:
google-generativeai==0.8.3

# 3. Forcer un redéploiement
git commit --allow-empty -m "Force redeploy"
git push origin master
```

### Problème: Quota exceeded

**Solution:**
- Limite gratuite: 60 requêtes/minute
- Attendre 1 minute
- Le fallback s'active automatiquement

---

## 📝 Notes Importantes

### Sécurité
- ✅ Ne jamais commit la clé API dans le code
- ✅ Utiliser uniquement les variables d'environnement
- ✅ Rotation de clé tous les 3-6 mois

### Performance
- Gemini répond en ~1-2 secondes
- Fallback automatique si erreur
- Pas d'interruption de service

### Coûts
- **Gemini**: 100% gratuit (60 req/min)
- **Railway**: Selon usage (DB, compute)
- **Autres services**: Selon plans

---

## ✅ Checklist de Déploiement

- [ ] Ajouter `GEMINI_API_KEY` dans Railway Variables
- [ ] Vérifier `requirements.txt` contient `google-generativeai==0.8.3`
- [ ] Pousser les changements sur GitHub
- [ ] Railway redéploie automatiquement
- [ ] Tester `/chat/status` → `ai_enabled: true`
- [ ] Tester `/chat/message` → `ai_powered: true`
- [ ] Vérifier les logs Railway
- [ ] Tester plusieurs questions au chatbot

---

## 🎉 Résultat Final

Une fois configuré, le chatbot SEKA:
- ✅ Répond intelligemment avec Gemini AI
- ✅ Comprend le contexte SEKA
- ✅ Se souvient des conversations
- ✅ Fallback automatique si erreur
- ✅ 100% gratuit et performant

**Le chatbot est maintenant propulsé par l'IA !** 🤖✨
