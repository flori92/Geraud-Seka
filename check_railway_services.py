#!/usr/bin/env python3
"""
Script pour vérifier les services Railway et leur configuration
"""

import subprocess
import json

print("🔍 Vérification des services Railway")
print("=" * 50)
print()

# ID du projet (extrait de l'URL Railway)
PROJECT_ID = "6544d82c-c677-4678-b2e9-465dfdd4970d"

print(f"📦 Projet: {PROJECT_ID}")
print()

print("📋 Instructions pour configurer le backend:")
print()
print("1. Allez sur Railway Dashboard:")
print(f"   https://railway.app/project/{PROJECT_ID}")
print()
print("2. Vérifiez les services:")
print("   ✅ seka-frontend (déjà configuré)")
print("   ❓ seka-backend (à vérifier)")
print("   ❓ Postgres (à vérifier)")
print()
print("3. Si le backend existe, configurez DATABASE_URL:")
print("   - Cliquez sur 'seka-backend'")
print("   - Onglet 'Variables'")
print("   - Ajoutez: DATABASE_URL = ${{Postgres.DATABASE_URL}}")
print()
print("4. Si PostgreSQL n'existe pas:")
print("   - Cliquez '+ New'")
print("   - Database → PostgreSQL")
print("   - Attendez le déploiement")
print()
print("5. Redéployez le backend:")
print("   - Dans le service backend, cliquez 'Deploy'")
print()
print("=" * 50)
print()
print("🧪 Test après configuration:")
print()
print("./backend/check_backend.sh")
print()
