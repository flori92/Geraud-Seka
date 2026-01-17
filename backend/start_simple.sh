#!/bin/bash
# Script de démarrage simple avec migration

echo "🔄 Démarrage SEKA avec migration..."

# Exécuter la migration en arrière-plan
python migrate_production_status.py &
MIGRATION_PID=$!

# Attendre un peu que la migration commence
sleep 5

# Démarrer l'application principale
echo "🚀 Démarrage de l'application FastAPI..."
exec ./start.sh
