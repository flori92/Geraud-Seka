#!/bin/bash
# Script de démarrage avec migration automatique des statuts

echo "🔄 Vérification et migration des statuts de documents..."

# Exécuter la migration des statuts
python migrate_production_status.py

# Vérifier le code de retour
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Migration des statuts réussie"
elif [ $MIGRATION_EXIT_CODE -eq 1 ]; then
    echo "⚠️ Erreur lors de la migration, tentative de correction..."
    # Si la migration échoue, essayer de réparer l'enum directement
    python -c "
import psycopg2
import os
from psycopg2 import sql

database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/seka')
if database_url.startswith('postgresql+psycopg://'):
    database_url = database_url.replace('postgresql+psycopg://', 'postgresql://')

try:
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Forcer l'ajout des valeurs manquantes
    cursor.execute(\"SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'documentstatus')\")
    current = [row[0] for row in cursor.fetchall()]
    
    for value in ['A_TRAITER', 'PRE_TRAITEE', 'VALIDEE']:
        if value not in current:
            try:
                cursor.execute(sql.SQL('ALTER TYPE documentstatus ADD VALUE {}').format(sql.Literal(value)))
                print(f'✅ Ajouté: {value}')
            except Exception as e:
                print(f'⚠️ Impossible d\\'ajouter {value}: {e}')
    
    conn.commit()
    print('✅ Enum corrigé')
except Exception as e:
    print(f'❌ Erreur correction enum: {e}')
finally:
    if 'conn' in locals():
        conn.close()
"
else
    echo "❌ Erreur inattendue lors de la migration (code: $MIGRATION_EXIT_CODE)"
fi

echo "🚀 Démarrage de l'application SEKA..."

# Démarrer l'application normale
exec "$@"
