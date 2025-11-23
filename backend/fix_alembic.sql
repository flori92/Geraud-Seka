-- Fix Alembic migrations - Marquer les migrations comme exécutées
-- Exécutez ce SQL dans Railway Postgres Query

-- 1. Vérifier l'état actuel
SELECT * FROM alembic_version;

-- 2. Si la table est vide ou a une mauvaise version, la corriger
-- D'abord, supprimer l'ancienne version si elle existe
DELETE FROM alembic_version;

-- 3. Insérer la version actuelle (head)
-- Remplacez 'XXXXX' par la dernière version de migration
-- Pour trouver la version, regardez dans backend/alembic/versions/
INSERT INTO alembic_version (version_num) VALUES ('head');

-- 4. Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 5. Si la table users n'existe pas, les migrations n'ont pas été appliquées
-- Dans ce cas, supprimez toutes les tables et relancez les migrations
