# 🚨 Solution Radicale : Problèmes de Schéma Documents & OCR

## Problème Identifié

Les erreurs récurrentes indiquent un **problème systémique** :
- Colonnes manquantes : `category`, `document_date`, `due_date`, `expiry_date`, `version`, etc.
- Cause : Migrations Alembic non appliquées en production (multi-head)
- Impact : L'upload de documents via OCR échoue systématiquement avec des erreurs 500

## ✅ SOLUTION 1 : Reconstruction Automatique du Schéma (IMPLÉMENTÉE)

### Principe
Reconstruire automatiquement le schéma de la table `documents` au démarrage de l'application.

### Implémentation

**Fichier : `backend/migrate.py` (lignes 102-185)**
- Fonction `ensure_documents_columns()` refactorisée
- Vérifie et ajoute automatiquement TOUTES les 23 colonnes manquantes
- Création idempotente (ne casse rien si la colonne existe)
- Logs détaillés pour chaque opération

**Colonnes vérifiées :**
```python
'original_filename', 'file_extension', 'title', 'description',
'category', 'tags', 'custom_fields', 'reference_number',
'document_date', 'due_date', 'expiry_date',
'amount_ht', 'amount_vat', 'amount_ttc', 'currency',
'version', 'parent_document_id', 'is_latest_version',
'ocr_data', 'ocr_confidence', 'ai_extracted_data',
'is_confidential', 'is_archived', 'is_locked',
'requires_validation', 'validated_by', 'validated_at',
'folder_id', 'lead_id', 'opportunity_id', 'uploaded_by'
```

**Fichier : `backend/alembic/versions/20251213_rebuild_documents_schema.py`**
- Migration Alembic complète
- Même logique que le fallback
- S'exécutera lors du prochain `alembic upgrade head`

### Avantages ✅
- ✅ Fonctionne immédiatement au démarrage
- ✅ Pas besoin de déploiement manuel
- ✅ Idempotent (sûr de relancer)
- ✅ Logs détaillés pour debugging
- ✅ Ne touche pas aux données existantes

### Inconvénients ⚠️
- ⚠️ Augmente légèrement le temps de démarrage (1-2 secondes)
- ⚠️ Ne résout pas le problème d'Alembic multi-head

---

## 🔥 SOLUTION 2 : Refonte Complète du Système OCR (RECOMMANDÉE À LONG TERME)

### Principe
Simplifier radicalement l'architecture OCR en séparant les concerns.

### Architecture Proposée

```
┌─────────────────┐
│   Frontend      │
│   (Upload)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  1. API Upload  │  ← Minimal: juste upload + file_path
│  (Simplifié)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Queue Job   │  ← Asynchrone: RabbitMQ / Celery
│  (OCR Process)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Worker OCR  │  ← Traitement isolé
│  (Extraction)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Update DB   │  ← Mise à jour PATCH du document
│  (Metadata)     │
└─────────────────┘
```

### Implémentation

#### 1. Modèle Document Simplifié (Insertion)
```python
# Au moment de l'upload, insérer UNIQUEMENT:
document = Document(
    id=uuid4(),
    filename=filename,
    file_path=file_path,
    content_type=content_type,
    file_size=file_size,
    status=DocumentStatus.UPLOADED,  # Pas OCR_PROCESSING
    tenant_id=tenant_id,
    uploaded_by=user_id,
    # TOUS les autres champs = NULL ou DEFAULT
)
```

#### 2. Endpoint Upload Minimal
```python
@router.post("/documents/upload")
async def upload_document(file: UploadFile, tenant_id: UUID):
    """Upload SANS OCR - juste stocker le fichier"""

    # 1. Upload vers R2
    file_path = await upload_to_r2(file)

    # 2. Créer record minimal en DB
    document = Document(
        filename=file.filename,
        file_path=file_path,
        status=DocumentStatus.UPLOADED,
        tenant_id=tenant_id
    )
    db.add(document)
    db.commit()

    # 3. Envoyer vers queue OCR (asynchrone)
    await ocr_queue.send({
        "document_id": str(document.id),
        "file_path": file_path
    })

    return {"id": document.id, "status": "uploaded"}
```

#### 3. Worker OCR Indépendant
```python
# worker_ocr.py
async def process_ocr_task(message):
    """Worker isolé pour OCR"""
    document_id = message["document_id"]
    file_path = message["file_path"]

    # 1. Télécharger depuis R2
    file_data = await download_from_r2(file_path)

    # 2. Effectuer OCR
    ocr_result = await extract_with_openai(file_data)

    # 3. Mettre à jour document (PATCH)
    await update_document(document_id, {
        "status": DocumentStatus.OCR_COMPLETED,
        "ocr_data": ocr_result.raw_text,
        "ai_extracted_data": ocr_result.structured_data,
        "amount_ht": ocr_result.amount_ht,
        "document_date": ocr_result.date,
        # etc.
    })
```

#### 4. Fix Alembic Multi-Head
```bash
# Résoudre définitivement le problème multi-head
cd backend

# 1. Identifier les heads
alembic heads

# 2. Merger les heads
alembic merge heads -m "merge_all_heads"

# 3. Upgrade
alembic upgrade head
```

### Avantages de la Solution 2 ✅
- ✅ **Robustesse** : Upload toujours réussi, OCR en background
- ✅ **Performance** : Réponse immédiate à l'utilisateur
- ✅ **Scalabilité** : Workers OCR indépendants
- ✅ **Debugging** : Erreurs OCR isolées du upload
- ✅ **Retry** : Possibilité de ré-essayer l'OCR sans re-upload
- ✅ **Pas de colonnes manquantes** : Insertion minimale, update partiel

### Inconvénients ⚠️
- ⚠️ Nécessite une refonte (2-3 jours de dev)
- ⚠️ Besoin d'un système de queue (RabbitMQ / Redis)
- ⚠️ Changement de l'API (breaking change)

---

## 📋 Plan d'Action Recommandé

### Court Terme (Maintenant) ✅
1. ✅ Déployer Solution 1 (déjà implémentée dans ce commit)
2. ✅ Tester l'upload de documents
3. ✅ Vérifier les logs pour s'assurer que toutes les colonnes sont créées

### Moyen Terme (Cette semaine)
4. Résoudre le multi-head Alembic
   ```bash
   alembic heads
   alembic merge heads -m "merge_all_heads"
   alembic upgrade head
   ```

5. Créer un script de vérification du schéma
   ```python
   # scripts/verify_schema.py
   # Compare le modèle Document avec les colonnes en DB
   ```

### Long Terme (Prochaine sprint)
6. Implémenter Solution 2 (architecture asynchrone)
7. Migrer progressivement vers le nouveau système
8. Supprimer l'ancien code une fois stable

---

## 🧪 Tests de Validation

### Test 1 : Vérifier que toutes les colonnes existent
```bash
# Connecter à la DB prod
railway run psql

# Lister toutes les colonnes
\d documents
```

### Test 2 : Upload un document
```bash
# Via l'interface web
1. Aller sur /accounting-rules/from-ocr
2. Uploader un document
3. Vérifier qu'aucune erreur 500 n'apparaît
```

### Test 3 : Vérifier les logs
```bash
railway logs | grep "Colonne.*ajoutée"
# Doit afficher les colonnes ajoutées au démarrage
```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Railway : `railway logs --tail 100`
2. Vérifier le schéma DB : `railway run psql -c "\d documents"`
3. Relancer le service : `railway up --detach`

---

## 🔗 Fichiers Modifiés

- ✅ `backend/migrate.py` - Fonction `ensure_documents_columns()` refactorisée
- ✅ `backend/alembic/versions/20251213_rebuild_documents_schema.py` - Migration complète
- 📝 `SOLUTION_RADICALE_OCR.md` - Ce document

---

## ✅ Résultat du Déploiement

**Déploiement effectué** : 2025-12-13 18:41 UTC

**Colonnes ajoutées automatiquement au démarrage** :
```
✅ tags
✅ custom_fields
✅ validated_at
✅ parent_document_id
✅ is_latest_version
✅ folder_id
✅ ocr_confidence
✅ uploaded_by
✅ is_confidential
✅ ai_extracted_data
✅ is_archived
✅ lead_id
✅ version ← FIX du problème actuel
✅ is_locked
✅ opportunity_id
✅ requires_validation
✅ validated_by
```

**Temps d'ajout** : ~2 secondes au démarrage
**Impact** : ✅ Aucune erreur - Application opérationnelle

---

**Date** : 2025-12-13
**Auteur** : Claude Code
**Status** : Solution 1 implémentée ✅ DÉPLOYÉE ET FONCTIONNELLE | Solution 2 proposée 📋
