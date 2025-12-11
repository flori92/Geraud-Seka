# 🔧 CORRECTIONS - Erreur Upload Documents (422)

## 🐛 PROBLÈMES IDENTIFIÉS

### 1. Erreur 422 - Paramètre manquant
```
POST https://api.sekagestion.com/api/v1/documents/
Status: 422 Unprocessable Entity
```

**Cause :** L'endpoint `/api/v1/documents/` exigeait un paramètre `client_id: UUID` **obligatoire**, mais le frontend ne l'envoyait pas lors de l'upload.

### 2. Champs de modèle incorrects
- Utilisation de `created_by` au lieu de `uploaded_by`
- Utilisation de `date` au lieu de `document_date`
- Champs manquants : `original_filename`, `file_extension`, `ocr_confidence`

### 3. CORS (Non critique)
Les erreurs CORS étaient dues au backend non accessible sur `api.sekagestion.com` en local. CORS déjà correctement configuré.

---

## ✅ CORRECTIONS APPORTÉES

### Fichier: `backend/app/api/v1/routes/documents.py`

#### 1. Paramètre `client_id` rendu optionnel
```python
# AVANT
client_id: UUID,  # Obligatoire

# APRÈS
client_id: Optional[UUID] = None,  # Optionnel
```

#### 2. Correction des champs du modèle Document
```python
# AVANT
doc_in = DocumentCreate(
    filename=file.filename,
    file_path=file_path,
    content_type=file.content_type,
    file_size=file_size,
    client_id=client_id  # Erreur si None
)

# APRÈS
doc_data = {
    "filename": file.filename,
    "original_filename": file.filename,  # ✓ Ajouté
    "file_path": file_path,
    "content_type": file.content_type or "application/octet-stream",
    "file_size": file_size,
    "file_extension": f".{file.filename.split('.')[-1]}",  # ✓ Ajouté
    "status": DocumentStatus.OCR_PROCESSING,
    "tenant_id": current_user.tenant_id,
    "uploaded_by": current_user.id,  # ✓ Corrigé (was: created_by)
}

# Ajouter client_id seulement s'il est fourni
if client_id:
    doc_data["client_id"] = client_id

db_obj = Document(**doc_data)
```

#### 3. Correction du traitement OCR
```python
# AVANT
db_obj.date = ocr_data.get("date")  # Champ n'existe pas

# APRÈS
db_obj.document_date = ocr_data.get("date")  # ✓ Champ correct
db_obj.ocr_data = ocr_data  # ✓ Stocker toutes les données OCR
db_obj.ocr_confidence = ocr_data.get("confidence", 0.0)  # ✓ Score OCR
```

#### 4. Meilleure gestion des erreurs OCR
```python
except Exception as e:
    print(f"OCR Error: {e}")
    # Set status to UPLOADED if OCR fails
    db_obj.status = DocumentStatus.UPLOADED  # ✓ Au lieu de laisser en PROCESSING
    db.commit()
    db.refresh(db_obj)
```

---

## 📊 SCHÉMA MODÈLE DOCUMENT

Voici les champs **requis** vs **optionnels** du modèle `Document` :

### Champs REQUIS (NOT NULL)
```python
- id: UUID (auto-généré)
- filename: String
- original_filename: String
- file_path: String
- status: Enum (default: UPLOADED)
- tenant_id: UUID (FK tenants.id)
- uploaded_by: UUID (FK users.id)
```

### Champs OPTIONNELS
```python
- content_type: String
- file_size: Integer
- file_extension: String
- title: String
- description: Text
- type: Enum (default: OTHER)
- category: Enum (default: OTHER)
- tags: JSON
- reference_number: String
- document_date: Date
- due_date: Date
- amount_ht: Float
- amount_vat: Float
- amount_ttc: Float
- currency: String (default: XOF)
- ocr_data: JSON
- ocr_confidence: Float
- client_id: UUID (FK clients.id) ✓ OPTIONNEL
- supplier_id: UUID
- folder_id: UUID
- ... (autres relations optionnelles)
```

---

## 🧪 TEST APRÈS CORRECTIONS

### Test 1: Upload sans client_id
```bash
curl -X POST http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@facture.pdf"

# ✓ DOIT FONCTIONNER (client_id optionnel)
```

### Test 2: Upload avec client_id
```bash
curl -X POST "http://localhost:8000/api/v1/documents/?client_id=xxx-xxx-xxx" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@facture.pdf"

# ✓ DOIT FONCTIONNER (client_id associé)
```

### Test 3: Vérifier les champs
```bash
curl -X GET http://localhost:8000/api/v1/documents/ \
  -H "Authorization: Bearer $TOKEN"

# Vérifier que le document a:
# - filename ✓
# - original_filename ✓
# - file_extension ✓
# - uploaded_by ✓
# - document_date (si OCR réussi) ✓
# - ocr_data (si OCR réussi) ✓
# - status: OCR_COMPLETED ou UPLOADED ✓
```

---

## 🚀 REDÉMARRAGE BACKEND

Après ces corrections, redémarrez le backend :

```bash
# Arrêter le backend (Ctrl+C)

# Redémarrer
cd backend
python -m app.main

# Vérifier santé
curl http://localhost:8000/health
# Réponse: {"status":"healthy"}
```

---

## ✅ WORKFLOW COMPLET CORRIGÉ

```
1. Frontend: Upload fichier (sans client_id) ✓
   ↓
2. Backend: POST /api/v1/documents/
   - Paramètre client_id optionnel ✓
   - Upload vers Cloudflare R2 ✓
   - Création Document avec tous les champs requis ✓
   ↓
3. Backend: Traitement OCR Mindee
   - Extraction données ✓
   - Mise à jour document_date, amounts, etc. ✓
   - Stockage ocr_data complet ✓
   - Status → OCR_COMPLETED ✓
   ↓
4. Frontend: Affichage document
   - Données OCR visibles ✓
   - Bouton "Valider" actif ✓
   ↓
5. Validation: POST /api/v1/documents/{id}/validate
   - Génération écritures comptables ✓
   - Status → VALIDATED ✓
```

---

## 📝 NOTES IMPORTANTES

1. **client_id est maintenant optionnel** : Les documents peuvent être uploadés sans association client, puis liés plus tard si besoin.

2. **Champs du modèle Document** : Respecter exactement les noms des colonnes :
   - `uploaded_by` (NOT `created_by`)
   - `document_date` (NOT `date`)
   - `original_filename` (requis)
   - `file_extension` (optionnel mais recommandé)

3. **Gestion d'erreurs OCR** : Si l'OCR échoue, le document reste en status `UPLOADED` au lieu de rester bloqué en `OCR_PROCESSING`.

4. **Données OCR complètes** : Le champ `ocr_data` contient maintenant toutes les données extraites par Mindee, pas seulement certains champs.

---

## 🎯 PROCHAINS TESTS

1. **Test local** :
   ```bash
   cd backend
   python test_document_upload.py
   ```

2. **Test interface** :
   - Frontend: http://localhost:3000
   - Page Documents
   - Glisser-déposer une facture
   - Vérifier que l'upload fonctionne (pas d'erreur 422)

3. **Test production** :
   - Déployer sur Railway/Heroku
   - Tester avec https://www.sekagestion.com
   - Vérifier CORS fonctionne

---

## 🔄 CHANGEMENTS REQUIS FRONTEND (si nécessaire)

Le frontend n'a **PAS** besoin de modifications car :
- Il n'envoie déjà pas `client_id` (d'où l'erreur 422)
- L'endpoint accepte maintenant l'upload sans ce paramètre

**Optionnel** : Si vous voulez permettre l'association client à l'upload :
```typescript
// frontend/src/lib/api.ts
export async function uploadDocument(
  file: File,
  accessToken: string,
  clientId?: string  // Optionnel
) {
  const formData = new FormData();
  formData.append('file', file);

  const url = clientId
    ? `/api/v1/documents/?client_id=${clientId}`
    : `/api/v1/documents/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return response.json();
}
```

---

## ✨ RÉSUMÉ

| Problème | Solution | Status |
|----------|----------|--------|
| Erreur 422 (client_id manquant) | Paramètre rendu optionnel | ✅ Corrigé |
| Champ `created_by` incorrect | Changé en `uploaded_by` | ✅ Corrigé |
| Champ `date` incorrect | Changé en `document_date` | ✅ Corrigé |
| Champs manquants | Ajoutés `original_filename`, `file_extension`, `ocr_data`, `ocr_confidence` | ✅ Corrigé |
| Erreur OCR bloque le document | Status → UPLOADED si échec | ✅ Corrigé |
| CORS bloque requêtes | Déjà configuré correctement | ℹ️ Non critique en local |

**L'upload de documents devrait maintenant fonctionner sans erreur 422 !** 🎉
