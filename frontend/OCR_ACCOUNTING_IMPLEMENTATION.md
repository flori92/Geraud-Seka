# 🤖 Implémentation OCR + Règles Comptables + Support Multi-pages

## ✅ Ce qui existe déjà

### 1. OCR Mindee (Amélioré)
**Fichier:** `backend/app/services/ocr.py`

**Fonctionnalités :**
- ✅ Extraction automatique de factures PDF/images
- ✅ **Support multi-pages PDF** (nouveau)
- ✅ Extraction détaillée :
  - Numéro facture, dates
  - Montants HT/TVA/TTC
  - Fournisseur (nom, adresse, SIRET)
  - Client (nom, adresse)
  - **Lignes de facture** (description, quantité, prix unitaire)
  - **Score de confiance par page**
- ✅ Fallback mock si pas de clé API

**Formats supportés :**
- `.pdf` (multi-pages)
- `.jpg`, `.jpeg`, `.png`
- `.tiff`, `.heic`

### 2. Règles Comptables Automatiques (NOUVEAU)

#### Modèle de données
**Fichier:** `backend/app/models/accounting_rules.py`

**Tables créées :**

```sql
-- Règles d'imputation automatique
CREATE TABLE accounting_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255),
    description TEXT,
    priority FLOAT,  -- Plus élevé = prioritaire
    conditions JSON,  -- Conditions de déclenchement
    actions JSON,     -- Actions à effectuer
    auto_apply BOOLEAN,  -- Appliquer automatiquement ou suggérer
    confidence_threshold FLOAT,  -- Seuil minimum
    is_active BOOLEAN
);

-- Historique des classifications (pour ML futur)
CREATE TABLE document_classifications (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    document_id UUID REFERENCES documents(id),
    suggested_debit_account VARCHAR(20),
    suggested_credit_account VARCHAR(20),
    suggested_label VARCHAR(500),
    suggested_vat_rate FLOAT,
    suggested_analytic_code VARCHAR(50),
    confidence_score FLOAT,
    rule_id UUID REFERENCES accounting_rules(id),
    source VARCHAR(50),  -- 'rule', 'ml', 'manual'
    validated BOOLEAN,
    validated_by UUID REFERENCES users(id),
    user_corrections JSON  -- Feedback pour amélioration
);
```

#### Moteur de règles
**Fichier:** `backend/app/services/accounting_rules.py`

**Types de conditions :**
- `supplier_name` - Nom du fournisseur
- `customer_name` - Nom du client
- `amount_range` - Plage de montants
- `reference_pattern` - Pattern de référence
- `description_contains` - Mots-clés dans description
- `document_type` - Type de document

**Opérateurs :**
- `equals`, `contains`, `starts_with`, `ends_with`
- `greater_than`, `less_than`, `between`
- `matches_regex`

**Actions possibles :**
- `assign_account` - Imputer sur des comptes
- `set_vat_rate` - Définir taux TVA
- `suggest_label` - Suggérer libellé
- `assign_analytic_code` - Affecter code analytique
- `auto_validate` - Validation automatique

**Heuristiques par défaut :**
- **Électricité/Eau/Gaz** → Compte 606100 (Fournitures énergétiques)
- **Télécom** → Compte 626000 (Frais postaux et télécommunications)
- **Défaut** → Compte 607000 (Achats de marchandises)

### 3. API Routes (NOUVEAU)
**Fichier:** `backend/app/api/v1/routes/accounting_rules.py`

**Endpoints créés :**

#### Gestion des règles
```
GET    /api/v1/accounting-rules/rules           # Liste des règles
POST   /api/v1/accounting-rules/rules           # Créer règle
PUT    /api/v1/accounting-rules/rules/{id}      # Modifier règle
DELETE /api/v1/accounting-rules/rules/{id}      # Supprimer règle
```

#### Saisie avec OCR
```
POST   /api/v1/accounting-rules/entries/from-document
```
**Workflow complet :**
1. Upload PDF/image (multi-pages supporté)
2. OCR extraction automatique
3. Application des règles comptables
4. Retour de suggestions d'écriture

**Réponse exemple :**
```json
{
  "ocr_data": {
    "reference_number": "FA-2024-001",
    "date": "2024-12-11",
    "amount_ht": 50000,
    "amount_vat": 10000,
    "amount_ttc": 60000,
    "supplier_name": "EDF Côte d'Ivoire",
    "page_count": 2,
    "is_multi_page": true,
    "confidence": 0.95
  },
  "suggestions": {
    "rule_name": "Factures EDF",
    "confidence": 0.98,
    "auto_apply": true,
    "suggested_debit_account": "606100",
    "suggested_credit_account": "401000",
    "suggested_label": "Électricité décembre 2024"
  },
  "proposed_entry": {
    "date": "2024-12-11",
    "reference": "FA-2024-001",
    "lines": [
      {
        "account_code": "606100",
        "label": "Électricité décembre 2024",
        "debit": 50000,
        "credit": 0
      },
      {
        "account_code": "445620",
        "label": "TVA déductible",
        "debit": 10000,
        "credit": 0
      },
      {
        "account_code": "401000",
        "label": "EDF Côte d'Ivoire",
        "debit": 0,
        "credit": 60000
      }
    ],
    "is_balanced": true
  },
  "file_info": {
    "filename": "facture_edf.pdf",
    "page_count": 2,
    "is_multi_page": true
  }
}
```

#### Validation et feedback
```
POST   /api/v1/accounting-rules/entries/validate-classification
```
Enregistre les corrections utilisateur pour améliorer les règles futures.

## 🎨 Frontend à créer

### Page : Saisie avec OCR
**Route suggérée :** `/accounting/entries/from-ocr`

**Composants requis :**

1. **Upload Zone**
   - Drag & drop PDF/images
   - Indicateur multi-pages
   - Prévisualisation

2. **Résultats OCR**
   - Données extraites affichées
   - Score de confiance
   - Nombre de pages traitées
   - Possibilité d'éditer chaque champ

3. **Suggestions Règles**
   - Règle appliquée (nom + confiance)
   - Comptes suggérés
   - Libellé suggéré
   - Bouton "Accepter" / "Modifier"

4. **Éditeur d'écriture**
   - Grille de saisie des lignes
   - Validation équilibrage
   - Bouton "Enregistrer"

### Page : Gestion des règles
**Route suggérée :** `/settings/accounting-rules`

**Fonctionnalités :**
- Liste des règles (priorité, active/inactive)
- Créer nouvelle règle (wizard)
- Modifier règle
- Tester règle sur documents historiques
- Statistiques (taux d'application, corrections)

## 📊 Exemples de règles

### Règle 1 : Factures EDF
```json
{
  "name": "Factures EDF",
  "priority": 100,
  "conditions": [
    {
      "type": "supplier_name",
      "operator": "contains",
      "value": "edf"
    }
  ],
  "actions": [
    {
      "type": "assign_account",
      "debit_account": "606100",
      "credit_account": "401000"
    },
    {
      "type": "suggest_label",
      "label_template": "Électricité {date}"
    },
    {
      "type": "set_vat_rate",
      "vat_rate": 0.20
    }
  ],
  "auto_apply": true,
  "confidence_threshold": 0.9
}
```

### Règle 2 : Frais de mission (montant)
```json
{
  "name": "Frais de mission",
  "priority": 50,
  "conditions": [
    {
      "type": "amount_range",
      "operator": "between",
      "value": "0,500000"
    },
    {
      "type": "description_contains",
      "operator": "contains",
      "value": "mission|déplacement|voyage"
    }
  ],
  "actions": [
    {
      "type": "assign_account",
      "debit_account": "625000",
      "credit_account": "401000"
    },
    {
      "type": "assign_analytic_code",
      "analytic_code": "MISSION"
    }
  ],
  "auto_apply": false,
  "confidence_threshold": 0.7
}
```

## 🔧 Intégration Frontend

### Exemple d'utilisation API

```typescript
// Upload et traitement OCR avec règles
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_URL}/api/v1/accounting-rules/entries/from-document`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    }
  );

  const result = await response.json();
  
  // Afficher les résultats OCR
  setOcrData(result.ocr_data);
  
  // Afficher les suggestions
  setSuggestions(result.suggestions);
  
  // Pré-remplir l'écriture
  setEntryLines(result.proposed_entry.lines);
  
  // Indicateur multi-pages
  if (result.file_info.is_multi_page) {
    showNotification(`PDF de ${result.file_info.page_count} pages traité`);
  }
};
```

## ✅ Avantages de cette implémentation

1. **Gain de temps :** Saisie automatique à partir de PDF
2. **Multi-pages :** Traite les factures complexes
3. **Règles personnalisables :** Chaque entreprise définit ses règles
4. **Apprentissage :** Historique des corrections pour amélioration
5. **Confiance :** Score de confiance pour chaque suggestion
6. **Éditable :** L'utilisateur peut toujours corriger
7. **Comme Pennylane :** Même UX que les leaders du marché

## 📝 Migration requise

```bash
# Créer migration Alembic
cd backend
alembic revision -m "add accounting rules and classifications"

# Ajouter les tables dans la migration :
# - accounting_rules
# - document_classifications
```

## 🚀 Prochaines étapes

1. ✅ Modèles créés
2. ✅ Services créés
3. ✅ API routes créées
4. ⏳ Migration BDD à créer
5. ⏳ Frontend "Saisie avec OCR" à créer
6. ⏳ Frontend "Gestion des règles" à créer
7. ⏳ Tests utilisateurs

## 💡 Améliorations futures

- **ML personnalisé :** Apprendre des corrections utilisateur
- **OCR custom :** Modèle entraîné sur factures africaines
- **Validation automatique :** Si confiance > 95%
- **Batch processing :** Traiter plusieurs PDF en une fois
- **Export FEC :** Compatible avec l'export réglementaire
