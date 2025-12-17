#!/bin/bash

# Script de démarrage pour Railway
echo "🚀 Démarrage de SEKA Backend..."

# Vérification des variables d'environnement critiques
if [ -z "$PORT" ]; then
    echo "❌ Variable PORT non définie, utilisation du port 8000 par défaut"
    export PORT=8000
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Variable DATABASE_URL non définie"
fi

echo "📡 Port d'écoute: $PORT"
echo "🗄️  Base de données: ${DATABASE_URL:0:30}..."

if [ "$SEKA_RUN_WORKER" = "1" ] || [ "$SEKA_RUN_WORKER" = "true" ]; then
    echo "⚙️  Mode worker (Celery) activé"
    if [ "$SKIP_MIGRATIONS" = "1" ] || [ "$SKIP_MIGRATIONS" = "true" ]; then
        echo "⚠️  SKIP_MIGRATIONS est défini — on saute l'exécution des migrations"
    else
        echo "🔄 Exécution des migrations de base de données..."
        python3 migrate.py

        if [ $? -eq 0 ]; then
            echo "✅ Migrations terminées avec succès"
        else
            echo "❌ Échec des migrations, arrêt du démarrage"
            exit 1
        fi
    fi

    echo "🌟 Lancement du worker Celery..."
    exec celery -A app.worker.celery_app.celery_app worker --loglevel=info
fi

# Exécuter les migrations automatiquement au démarrage (peut être sautées avec SKIP_MIGRATIONS=1)
if [ "$SKIP_MIGRATIONS" = "1" ] || [ "$SKIP_MIGRATIONS" = "true" ]; then
    echo "⚠️  SKIP_MIGRATIONS est défini — on saute l'exécution des migrations"
else
    echo "🔄 Exécution des migrations de base de données..."
    python3 migrate.py

    if [ $? -eq 0 ]; then
        echo "✅ Migrations terminées avec succès"
    else
        echo "❌ Échec des migrations, arrêt du démarrage"
        exit 1
    fi
fi

# Démarrage de l'API
echo "🌟 Lancement de l'API SEKA..."
# Force redeploy Sam 13 déc 2025 10:49:25 CET
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
