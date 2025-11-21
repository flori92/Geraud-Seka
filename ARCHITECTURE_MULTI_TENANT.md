# 🏢 SEKA - Architecture Multi-Tenant SaaS

**Version** : 1.0.0-alpha  
**Type** : SaaS Multi-Tenant avec isolation complète des données

---

## 📐 Modèle Multi-Tenant

### Définitions

**Tenant** = **Une entreprise/cabinet qui souscrit à SEKA**
- Chaque tenant a son propre espace isolé
- Données complètement séparées
- Facturation indépendante
- Configuration personnalisée

**Client** (optionnel) = **Les clients du tenant**
- Un cabinet comptable → ses clients sont des entreprises
- Une PME → peut avoir ses propres clients/fournisseurs
- Structure hiérarchique : Tenant > Client > Données

**User** = **Utilisateur appartenant à un tenant**
- Peut avoir différents rôles (Admin, Collaborateur, etc.)
- Accès limité aux données de son tenant
- Peut accéder à plusieurs clients selon permissions

---

## 🔐 Architecture d'Isolation

### Niveau 1 : Database per Tenant (Futur)
Pour les très gros clients Enterprise :
```
tenant_1.seka.app → database_tenant_1
tenant_2.seka.app → database_tenant_2
```

### Niveau 2 : Schema per Tenant (Moyen terme)
Pour les clients Business/Enterprise :
```
Database: seka_production
├── schema_tenant_1
├── schema_tenant_2
└── schema_tenant_N
```

### Niveau 3 : Row-Level Isolation (Actuel ✅)
Pour tous les plans (Starter, Business) :
```
Database: seka_production
Table: documents
├── id=1, tenant_id=uuid-1, filename="facture.pdf"
├── id=2, tenant_id=uuid-2, filename="invoice.pdf"
└── id=3, tenant_id=uuid-1, filename="devis.pdf"
```

**Chaque requête** est automatiquement filtrée par `tenant_id` :
```sql
SELECT * FROM documents WHERE tenant_id = current_user.tenant_id
```

---

## 🏗️ Modèles de Données Actuels

### Modèle Tenant (Racine)
```python
class Tenant(Base):
    id = UUID  # Identifiant unique du tenant
    name = String  # "Cabinet Dupont" ou "PME SARL"
    slug = String  # "cabinet-dupont" → cabinet-dupont.seka.app
    country = String  # "BJ", "CI", "SN"
    plan = String  # "starter", "business", "enterprise"
    stripe_customer_id = String  # Pour facturation
    is_active = Boolean
    created_at = DateTime
```

### Modèle User (Appartient à un Tenant)
```python
class User(Base):
    id = UUID
    tenant_id = UUID  # 🔑 FK vers Tenant
    email = String
    role = String  # "admin", "accountant", "collaborator"
    is_active = Boolean
```

### Modèle Client (Optionnel, pour cabinets)
```python
class Client(Base):
    id = UUID
    tenant_id = UUID  # 🔑 FK vers Tenant (le cabinet)
    name = String  # "Entreprise ABC"
    slug = String
    # Multi-client au sein d'un tenant
```

### Tous les Autres Modèles
```python
class Document(Base):
    id = UUID
    tenant_id = UUID  # 🔑 Isolation tenant
    client_id = UUID (optional)  # Si c'est un cabinet
    # ... autres champs

class Supplier(Base):
    id = UUID
    tenant_id = UUID  # 🔑 Isolation tenant
    client_id = UUID (optional)
    # ...

# Idem pour : Activity, Product, AccountingEntry, etc.
```

---

## 🔒 Isolation des Données - Implémentation

### Backend Dependencies
```python
# app/core/deps.py

def get_current_user(token: str) -> User:
    """Extrait l'utilisateur du JWT"""
    # Décoder token → user_id
    # Charger user avec tenant_id
    return user

def get_tenant_filter(current_user: User = Depends(get_current_user)):
    """Filtre automatique par tenant"""
    return current_user.tenant_id
```

### Protection des Routes
```python
@router.get("/documents/")
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ✅ Filtre automatique par tenant
    documents = db.query(Document).filter(
        Document.tenant_id == current_user.tenant_id
    ).all()
    return documents
```

### Création de Données
```python
@router.post("/documents/")
def create_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ✅ Injecter automatiquement le tenant_id
    document = Document(
        **data.dict(),
        tenant_id=current_user.tenant_id  # Automatique
    )
    db.add(document)
    return document
```

---

## 🌐 Sous-domaines par Tenant

### Structure d'URLs

**Option 1 : Sous-domaine dédié** (Recommandé Enterprise)
```
https://cabinet-dupont.seka.app
https://pme-sarl.seka.app
https://consulting-xyz.seka.app
```

**Option 2 : Path dédié** (Recommandé Starter/Business)
```
https://app.seka.io/cabinet-dupont
https://app.seka.io/pme-sarl
```

**Option 3 : Domaine personnalisé** (Enterprise uniquement)
```
https://erp.cabinet-dupont.com (CNAME → seka.app)
```

### Identification du Tenant

```typescript
// Frontend - Détection automatique
const tenantSlug = window.location.hostname.split('.')[0]
// ou
const tenantSlug = window.location.pathname.split('/')[1]

// Stocké dans le token JWT
{
  "user_id": "uuid",
  "email": "user@example.com",
  "tenant_id": "tenant-uuid",
  "tenant_slug": "cabinet-dupont",
  "role": "admin"
}
```

---

## 📱 Prêt pour Mobile

### API-First Architecture ✅
- Toute la logique en backend
- Frontend = simple consommateur d'API
- Même API pour Web + Mobile + Desktop

### Technologies Mobiles

**Option 1 : React Native** (Recommandé)
```
✅ Partage de code avec Next.js
✅ Performance native
✅ iOS + Android
✅ Même API client (api.ts)
```

**Option 2 : PWA** (Quick Win)
```
✅ Aucun code mobile spécifique
✅ Installation sur mobile
✅ Offline support
✅ Notifications push
```

**Option 3 : Flutter** (Alternative)
```
✅ Performance excellente
✅ UI native
⚠️  Nouveau langage (Dart)
```

### Architecture Mobile
```
Mobile App (React Native/PWA)
    ↓ HTTPS
API Gateway (FastAPI)
    ↓
Multi-Tenant Backend
    ↓
PostgreSQL (Row-level isolation)
```

---

## 💰 Modèle de Facturation SaaS

### Plans Tarifaires

| Plan | Prix/mois | Users | Clients | Storage | Support |
|------|-----------|-------|---------|---------|---------|
| **Starter** | 29€ | 1-3 | 5 | 5GB | Email |
| **Business** | 99€ | 4-15 | 50 | 50GB | Priority |
| **Pro** | 249€ | 16-50 | Illimité | 200GB | Dedicated |
| **Enterprise** | Custom | Illimité | Illimité | Custom | 24/7 |

### Facturation par Tenant
```python
class Tenant(Base):
    # Stripe integration
    stripe_customer_id: str
    stripe_subscription_id: str
    plan: str  # "starter", "business", "pro", "enterprise"
    
    # Usage limits
    max_users: int
    max_clients: int
    max_storage_gb: int
    
    # Billing
    billing_email: str
    next_billing_date: date
    is_trial: bool
    trial_ends_at: datetime
```

### Vérification des Limites
```python
def check_tenant_limits(tenant: Tenant):
    """Vérifie si le tenant peut créer de nouvelles ressources"""
    current_users = count_users(tenant.id)
    if current_users >= tenant.max_users:
        raise HTTPException(
            status_code=402,
            detail="User limit reached. Please upgrade your plan."
        )
```

---

## 🔐 Sécurité Multi-Tenant

### Règles Strictes

1. **JAMAIS de requête sans tenant_id**
   ```python
   # ❌ INTERDIT
   documents = db.query(Document).all()
   
   # ✅ OBLIGATOIRE
   documents = db.query(Document).filter(
       Document.tenant_id == current_user.tenant_id
   ).all()
   ```

2. **Validation tenant_id sur UPDATE/DELETE**
   ```python
   @router.delete("/documents/{id}")
   def delete_document(id: UUID, current_user: User = Depends(...)):
       doc = db.query(Document).filter(
           Document.id == id,
           Document.tenant_id == current_user.tenant_id  # 🔑 Sécurité
       ).first()
       if not doc:
           raise HTTPException(404, "Not found")
       db.delete(doc)
   ```

3. **Middleware de vérification**
   ```python
   # À implémenter
   @app.middleware("http")
   async def verify_tenant_access(request: Request, call_next):
       if request.user:
           request.state.tenant_id = request.user.tenant_id
       return await call_next(request)
   ```

4. **Tests de sécurité**
   ```python
   def test_tenant_isolation():
       """Vérifie qu'un user ne peut pas voir les données d'un autre tenant"""
       tenant_1_doc = create_doc(tenant_id=1)
       tenant_2_user = create_user(tenant_id=2)
       
       response = client.get(
           f"/documents/{tenant_1_doc.id}",
           headers={"Authorization": f"Bearer {tenant_2_user.token}"}
       )
       assert response.status_code == 404  # Pas trouvé = sécurité OK
   ```

---

## 📊 Dashboard par Tenant

Chaque tenant voit uniquement ses données :

```python
@router.get("/dashboard/stats")
def get_stats(current_user: User = Depends(...)):
    tenant_id = current_user.tenant_id
    
    return {
        "total_documents": count(Document, tenant_id),
        "total_clients": count(Client, tenant_id),
        "revenue_month": sum(Invoice, tenant_id, month=current),
        "active_users": count(User, tenant_id, is_active=True)
    }
```

---

## 🚀 Workflow d'Onboarding

### Inscription Nouveau Tenant

1. **Step 1 : Création compte**
   ```
   POST /api/v1/auth/register
   {
     "tenant_name": "Cabinet Dupont",
     "tenant_slug": "cabinet-dupont",
     "email": "admin@cabinet-dupont.fr",
     "password": "***"
   }
   ```

2. **Step 2 : Création automatique**
   - Tenant créé
   - User admin créé
   - Lien vers Tenant
   - Email de bienvenue
   - Redirection vers sous-domaine

3. **Step 3 : Setup initial**
   - Guide d'onboarding
   - Import données (optionnel)
   - Invitation équipe
   - Configuration facturation

---

## 🔄 Migration & Imports

### Import depuis autre logiciel
```python
@router.post("/import/sage")
async def import_sage(
    file: UploadFile,
    current_user: User = Depends(...),
    background_tasks: BackgroundTasks
):
    """Import données Sage dans l'espace du tenant"""
    background_tasks.add_task(
        import_sage_data,
        file=file,
        tenant_id=current_user.tenant_id  # 🔑 Isolation
    )
    return {"status": "importing"}
```

---

## ✅ Checklist Multi-Tenant

### Actuel (Done ✅)
- [x] Modèle Tenant
- [x] tenant_id sur tous les modèles
- [x] Filtrage basique par tenant
- [x] JWT avec tenant_id

### À Renforcer (Cette Semaine)
- [ ] Middleware tenant verification
- [ ] Tests isolation complète
- [ ] Vérification limites plan
- [ ] Facturation Stripe par tenant
- [ ] Sous-domaines dynamiques

### Mobile (Prochaines Semaines)
- [ ] API mobile-optimisée
- [ ] React Native app
- [ ] ou PWA avec offline
- [ ] Synchronisation

---

## 🎯 Conclusion

**SEKA est architecturé en SaaS multi-tenant complet :**

✅ Isolation données par `tenant_id`  
✅ Chaque abonné a son espace  
✅ Facturation indépendante  
✅ Scalable (millions de tenants)  
✅ Sécurisé (row-level isolation)  
✅ Prêt pour mobile (API-first)  

**Prochaine étape : Renforcer la sécurité et ajouter la gestion des plans/facturation.**
