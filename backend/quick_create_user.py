#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

# Créer un utilisateur directement
user = User(
    email="admin@seka.app",
    hashed_password=get_password_hash("Admin123!"),
    full_name="Admin SEKA",
    is_active=True,
    is_superuser=True,
    role="admin"
)

db.add(user)
db.commit()
db.refresh(user)

print(f"✅ User created: {user.email} (ID: {user.id})")
db.close()
