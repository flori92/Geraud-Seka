#!/bin/bash
# Script de démarrage avec migration automatique des statuts

echo "🔄 Vérification et migration des statuts de documents..."

# Exécuter la migration des statuts
python migrate_production_status.py

if [ $? -eq 0 ]; then
    echo "✅ Migration des statuts réussie"
else
    echo "⚠️ Erreur lors de la migration, mais démarrage continué"
fi

echo "🚀 Démarrage de l'application SEKA..."

# Démarrer l'application normale
exec "$@"
