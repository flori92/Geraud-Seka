#!/bin/bash
# Script d'audit complet des tables et colonnes de la base de données SEKA
# Non-interactif - génère un rapport complet

set -e

echo "🔍 AUDIT COMPLET DE LA BASE DE DONNÉES SEKA"
echo "=========================================="
echo ""

# Connexion à la base de données de production
DB_URL="postgresql://postgres:MguTEKRaWdtJbjsheadNcOduNENWEVbJ@gondola.proxy.rlwy.net:44873/railway"

echo "📊 TABLES PRÉSENTES:"
echo "-------------------"

# Lister toutes les tables
psql "$DB_URL" -t -c "
SELECT
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
" | while read -r line; do
    if [ ! -z "$line" ]; then
        echo "  $line"
    fi
done

echo ""
echo "📋 DÉTAIL DES COLONNES PAR TABLE:"
echo "---------------------------------"

# Pour chaque table, lister les colonnes
psql "$DB_URL" -t -c "
SELECT
    t.table_name,
    c.column_name,
    c.data_type ||
        CASE
            WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')'
            WHEN c.numeric_precision IS NOT NULL THEN '(' || c.numeric_precision ||
                CASE WHEN c.numeric_scale IS NOT NULL AND c.numeric_scale > 0 THEN ',' || c.numeric_scale ELSE '' END || ')'
            ELSE ''
        END AS data_type,
    CASE WHEN c.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
" | while read -r table_name column_name data_type nullable default; do
    if [ ! -z "$table_name" ]; then
        if [ "$table_name" != "$current_table" ]; then
            echo ""
            echo "📄 Table: $table_name"
            current_table="$table_name"
        fi
        default_display=""
        if [ "$default" != "" ] && [ "$default" != "NULL" ]; then
            default_display=" DEFAULT $default"
        fi
        echo "  - $column_name: $data_type $nullable$default_display"
    fi
done

echo ""
echo "🔗 CONTRAINTES DE CLÉS ÉTRANGÈRES:"
echo "----------------------------------"

psql "$DB_URL" -t -c "
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
" | while read -r table_name column_name foreign_table foreign_column constraint; do
    if [ ! -z "$table_name" ]; then
        echo "  $table_name.$column_name -> $foreign_table.$foreign_column ($constraint)"
    fi
done

echo ""
echo "📊 STATISTIQUES GÉNÉRALES:"
echo "-------------------------"

# Statistiques générales
psql "$DB_URL" -t -c "
SELECT
    'Nombre de tables' as metric,
    COUNT(*) as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT
    'Nombre total de colonnes',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public'
UNION ALL
SELECT
    'Taille totale de la base',
    pg_size_pretty(pg_database_size(current_database()));
" | while read -r metric value; do
    echo "  $metric: $value"
done

echo ""
echo "✅ AUDIT TERMINÉ"
echo "=================="
echo "Rapport généré le $(date)"