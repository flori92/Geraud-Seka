# 🔧 FIX - Schema Base de Données Production

## 🐛 **PROBLÈME IDENTIFIÉ**

```
column "original_filename" of relation "documents" does not exist
```

Le modèle SQLAlchemy utilise des colonnes qui n'existent pas dans la base de données de production.

---

## ✅ **SOLUTION : Ajouter les colonnes manquantes**

### **Option 1 : Via Railway CLI (Recommandé)**

```bash
railway run bash

# Puis dans le shell Railway:
python -c "
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Ajouter original_filename
    conn.execute(text(\"\"\"
        ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);
    \"\"\"))

    # Copier filename vers original_filename pour les lignes existantes
    conn.execute(text(\"\"\"
        UPDATE documents
        SET original_filename = filename
        WHERE original_filename IS NULL;
    \"\"\"))

    # Rendre la colonne NOT NULL
    conn.execute(text(\"\"\"
        ALTER TABLE documents
        ALTER COLUMN original_filename SET NOT NULL;
    \"\"\"))

    conn.commit()
    print('✅ Migration completed!')
"
```

### **Option 2 : Via Dashboard Railway**

1. Aller sur **Railway Dashboard**
2. Service **PostgreSQL** (database)
3. Onglet **Data**
4. **Query**
5. Exécuter:

```sql
-- Ajouter original_filename
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- Copier filename vers original_filename
UPDATE documents
SET original_filename = filename
WHERE original_filename IS NULL;

-- Rendre NOT NULL
ALTER TABLE documents
ALTER COLUMN original_filename SET NOT NULL;
```

### **Option 3 : Script Python dans Railway**

```bash
railway run python << 'EOF'
from app.db.session import engine
from sqlalchemy import text, inspect

inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('documents')]

print("Colonnes actuelles:", columns)

if 'original_filename' not in columns:
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE documents
            ADD COLUMN original_filename VARCHAR(255);
        """))
        conn.execute(text("""
            UPDATE documents
            SET original_filename = filename;
        """))
        conn.execute(text("""
            ALTER TABLE documents
            ALTER COLUMN original_filename SET NOT NULL;
        """))
        conn.commit()
        print("✅ original_filename added!")
else:
    print("✅ original_filename already exists")
EOF
```

---

## 📋 **COLONNES À VÉRIFIER**

Le modèle `Document` utilise ces colonnes qui doivent exister :

| Colonne | Type | Requis | Description |
|---------|------|--------|-------------|
| `original_filename` | VARCHAR(255) | OUI | Nom original du fichier |
| `file_extension` | VARCHAR(10) | NON | Extension (.pdf, .jpg) |
| `document_date` | DATE | NON | Date du document |
| `ocr_data` | JSON | NON | Données OCR complètes |
| `ocr_confidence` | FLOAT | NON | Score confiance OCR |
| `uploaded_by` | UUID | OUI | Utilisateur ayant uploadé |

### **Vérifier toutes les colonnes manquantes :**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

---

## 🚀 **APRÈS LA MIGRATION**

### 1. Redémarrer le service backend

```bash
railway restart --service seka-backend
```

### 2. Vérifier les logs

```bash
railway logs --service seka-backend
```

### 3. Tester l'upload

https://www.sekagestion.com/documents

---

## 🔄 **POUR ÉVITER CE PROBLÈME À L'AVENIR**

### Créer des migrations Alembic

```bash
cd backend
alembic revision --autogenerate -m "Add original_filename to documents"
alembic upgrade head
```

### Toujours appliquer les migrations en production

Avant chaque déploiement:
```bash
railway run alembic upgrade head
```

---

## 📝 **COMMANDE RAPIDE (Option 1)**

```bash
railway run -- python -c "from app.db.session import engine; from sqlalchemy import text; conn = engine.connect(); conn.execute(text('ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);')); conn.execute(text('UPDATE documents SET original_filename = filename WHERE original_filename IS NULL;')); conn.execute(text('ALTER TABLE documents ALTER COLUMN original_filename SET NOT NULL;')); conn.commit(); print('Done!')"
```

---

**Après cette correction, l'upload devrait fonctionner !**
