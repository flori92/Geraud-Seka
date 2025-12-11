# 🚨 ACTION URGENTE - Fixer le Schema Base de Données

## ⚠️ **PROBLÈME**

Le backend plante à l'upload avec l'erreur :
```
column "original_filename" of relation "documents" does not exist
```

## ✅ **SOLUTION (5 minutes)**

### **ÉTAPE 1 : Ouvrir Railway Dashboard**

👉 https://railway.app/project/6544d82c-c677-4678-b2e9-465dfdd4970d

### **ÉTAPE 2 : Accéder à la base de données**

1. Cliquez sur le service **PostgreSQL** (database)
2. Onglet **"Data"**
3. Cliquez sur **"Query"**

### **ÉTAPE 3 : Exécuter ce SQL**

Copiez-collez et exécutez :

```sql
-- Ajouter la colonne original_filename
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- Copier filename vers original_filename pour les lignes existantes
UPDATE documents
SET original_filename = filename
WHERE original_filename IS NULL OR original_filename = '';

-- Rendre la colonne NOT NULL
ALTER TABLE documents
ALTER COLUMN original_filename SET NOT NULL;

-- Vérifier que ça a fonctionné
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents' AND column_name = 'original_filename';
```

**Résultat attendu :**
```
column_name        | data_type      | is_nullable
original_filename  | character varying | NO
```

### **ÉTAPE 4 : Redémarrer le backend**

1. Retournez à l'onglet **"Deployments"** du service **seka-backend**
2. Cliquez sur **"Restart"**
3. Attendez 30 secondes

### **ÉTAPE 5 : Tester**

👉 https://www.sekagestion.com/documents

- Uploadez un fichier
- ✅ **Doit fonctionner maintenant !**

---

## 🔧 **SI ÇA NE FONCTIONNE PAS**

### Vérifier les logs Railway :

```bash
railway logs --service seka-backend | grep -i "error\|original_filename"
```

### OU via Dashboard :
1. Service **seka-backend**
2. Onglet **"Logs"**
3. Chercher "original_filename"

---

## 📝 **EXPLICATION**

Le code backend a été mis à jour pour utiliser `original_filename`, mais la colonne n'existait pas dans la base de données de production.

Cette commande SQL ajoute la colonne manquante.

---

## ⏱️ **TEMPS TOTAL : ~5 minutes**

1. Ouvrir Railway → 1 min
2. Exécuter SQL → 1 min
3. Redémarrer backend → 2 min
4. Tester → 1 min

---

## ✅ **APRÈS CE FIX**

Tous les problèmes seront résolus :
- ✅ Upload fonctionnel
- ✅ Extraction OCR
- ✅ Génération écritures comptables

**Le système sera 100% opérationnel !** 🚀
