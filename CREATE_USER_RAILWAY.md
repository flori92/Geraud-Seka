# 👤 Créer un Utilisateur Admin sur Railway

## 🎯 Méthode 1 : Via Railway Dashboard (Recommandé)

1. Allez sur : https://railway.app/project/6544d82c-c677-4678-b2e9-465dfdd4970d

2. Cliquez sur le service **Backend**

3. Cliquez sur **"..."** (menu) → **"Shell"**

4. Dans le shell, exécutez :
   ```bash
   python check_users.py
   ```

5. Si aucun utilisateur, exécutez :
   ```bash
   python quick_create_user.py
   ```

6. Testez la connexion :
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin@seka.app&password=Admin123!"
   ```

## 🎯 Méthode 2 : Via SQL Direct

Si le shell Python ne fonctionne pas, utilisez SQL :

1. Dans Railway Dashboard → Service **Postgres**

2. Onglet **"Data"** ou **"Query"**

3. Exécutez ce SQL :
   ```sql
   -- Vérifier les utilisateurs
   SELECT * FROM users;
   
   -- Si vide, créer un utilisateur (hash du mot de passe "Admin123!")
   INSERT INTO users (email, hashed_password, full_name, is_active, is_superuser, role, created_at, updated_at)
   VALUES (
     'admin@seka.app',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxKVqKqKm',
     'Admin SEKA',
     true,
     true,
     'admin',
     NOW(),
     NOW()
   );
   ```

## 🧪 Test Final

Depuis votre machine :

```bash
curl -X POST https://api.sekagestion.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@seka.app&password=Admin123!"
```

**Résultat attendu :**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

## 📋 Credentials

- **Email**: admin@seka.app
- **Password**: Admin123!

⚠️ **Changez ce mot de passe après la première connexion !**
