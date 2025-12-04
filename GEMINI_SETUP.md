# Configuration Google Gemini pour SEKA Chat

## 🔑 Obtenir la Clé API Gemini

### Étape 1: Accéder à Google AI Studio
1. Va sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connecte-toi avec ton compte Google
3. Clique sur **"Get API Key"** ou **"Create API Key"**

### Étape 2: Créer la Clé
1. Sélectionne ou crée un projet Google Cloud
2. La clé sera générée automatiquement
3. **Format de la clé**: `AIzaSy...` (commence toujours par `AIzaSy`)

### Étape 3: Copier la Clé
⚠️ **IMPORTANT**: Copie la clé immédiatement, elle ne sera plus affichée !

---

## 🔧 Configuration Backend

### Option 1: Variable d'Environnement (Recommandé)

**Sur Railway** :
1. Va dans ton projet Railway
2. Clique sur **Variables**
3. Ajoute une nouvelle variable :
   - **Nom**: `GEMINI_API_KEY`
   - **Valeur**: `AIzaSy...` (ta clé)
4. Redéploie l'application

**En local** :
```bash
# backend/.env
GEMINI_API_KEY=AIzaSy...
```

### Option 2: Fichier .env
```bash
cd backend
echo "GEMINI_API_KEY=AIzaSy..." >> .env
```

---

## ✅ Vérification

### 1. Tester l'API Gemini
```bash
curl https://api.sekagestion.com/api/v1/chat/status
```

**Réponse attendue** :
```json
{
  "status": "online",
  "version": "2.0",
  "features": ["rule-based", "multilingual", "gemini-ai"],
  "ai_enabled": true
}
```

### 2. Tester le Chat
```bash
curl -X POST https://api.sekagestion.com/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quels sont les tarifs de SEKA ?"
  }'
```

**Réponse attendue** :
```json
{
  "response": "SEKA propose 3 plans...",
  "timestamp": "2025-12-04T23:00:00",
  "ai_powered": true
}
```

---

## 🎯 Fonctionnalités Gemini

### Ce que Gemini Apporte

✅ **Réponses Intelligentes**
- Compréhension du contexte
- Réponses personnalisées
- Ton professionnel en français

✅ **Mémoire Conversationnelle**
- Se souvient des 5 derniers messages
- Conversations cohérentes
- Suivi du contexte

✅ **Connaissances SEKA**
- Modules et fonctionnalités
- Tarifs et plans
- Support et contact
- Sécurité et conformité

✅ **Fallback Automatique**
- Si Gemini échoue → réponses basiques
- Pas d'interruption de service
- Toujours disponible

---

## 📊 Comparaison Gemini vs OpenAI

| Critère | Gemini | OpenAI |
|---------|--------|--------|
| **Prix** | Gratuit (60 req/min) | Payant ($0.002/1K tokens) |
| **Limite gratuite** | 60 requêtes/min | Aucune |
| **Qualité** | Excellent | Excellent |
| **Français** | Natif | Natif |
| **Latence** | ~1-2s | ~1-2s |
| **Contexte** | 30K tokens | 4K-128K tokens |

**Recommandation** : Gemini est parfait pour SEKA (gratuit + performant)

---

## 🔒 Sécurité

### Bonnes Pratiques

✅ **Ne jamais commit la clé API**
```bash
# .gitignore
.env
*.env
```

✅ **Utiliser des variables d'environnement**
```python
import os
api_key = os.getenv("GEMINI_API_KEY")
```

✅ **Limiter les permissions**
- Clé API uniquement pour Gemini
- Pas d'accès Google Cloud complet

✅ **Rotation régulière**
- Changer la clé tous les 3-6 mois
- Révoquer les anciennes clés

---

## 🐛 Dépannage

### Problème: "GEMINI_API_KEY not found"

**Solution** :
```bash
# Vérifier la variable
echo $GEMINI_API_KEY

# Si vide, l'ajouter
export GEMINI_API_KEY=AIzaSy...
```

### Problème: "API key not valid"

**Solutions** :
1. Vérifier que la clé commence par `AIzaSy`
2. Vérifier qu'il n'y a pas d'espaces
3. Régénérer une nouvelle clé

### Problème: "Quota exceeded"

**Solutions** :
1. Attendre 1 minute (limite: 60 req/min)
2. Passer à un plan payant si nécessaire
3. Le fallback s'active automatiquement

### Problème: "ai_powered: false"

**Causes** :
- Clé API non configurée
- Erreur Gemini (fallback activé)
- Package `google-generativeai` non installé

**Solution** :
```bash
pip install google-generativeai==0.8.3
```

---

## 📝 Notes Importantes

### Credentials OAuth vs API Key

⚠️ **ATTENTION: Ne pas confondre** :

**OAuth Credentials (Client ID/Secret)** :
- Pour authentification Google (Sign in with Google)
- Pour accès aux services Google (Drive, Calendar, etc.)
- Format: `XXXXX.apps.googleusercontent.com` et `GOCSPX-...`

**PAS pour Gemini API !**

**Pour Gemini, tu as besoin de** :
- Une clé API Gemini (format: `AIzaSy...`)
- Obtenue sur [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 🚀 Déploiement

### 1. Installer les dépendances
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurer la clé
```bash
# Railway
railway variables set GEMINI_API_KEY=AIzaSy...

# Local
echo "GEMINI_API_KEY=AIzaSy..." >> .env
```

### 3. Redémarrer
```bash
# Railway redéploie automatiquement

# Local
uvicorn app.main:app --reload
```

### 4. Tester
```bash
curl https://api.sekagestion.com/api/v1/chat/status
```

---

## ✅ Checklist de Configuration

- [ ] Obtenir clé API Gemini sur Google AI Studio
- [ ] Ajouter `GEMINI_API_KEY` dans Railway
- [ ] Installer `google-generativeai==0.8.3`
- [ ] Redéployer le backend
- [ ] Tester `/chat/status` → `ai_enabled: true`
- [ ] Tester `/chat/message` → `ai_powered: true`
- [ ] Vérifier les réponses intelligentes

---

## 🎉 Résultat Final

Une fois configuré, le chatbot SEKA :
- ✅ Répond intelligemment en français
- ✅ Comprend le contexte SEKA
- ✅ Se souvient des conversations
- ✅ Fallback automatique si erreur
- ✅ 100% gratuit (60 req/min)

**Le chatbot est maintenant propulsé par l'IA !** 🚀
