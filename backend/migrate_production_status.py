#!/usr/bin/env python3
"""
Script de migration pour la production Railway
Migre les statuts de documents de VALIDATED → VALIDEE
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2 import sql
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_url():
    """Récupère l'URL de la base de données depuis les variables d'environnement"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Fallback pour le développement local
        database_url = "postgresql+psycopg://postgres:postgres@localhost:5432/seka"
    
    # Convertit SQLAlchemy URL en psycopg2 URL
    if database_url.startswith('postgresql+psycopg://'):
        database_url = database_url.replace('postgresql+psycopg://', 'postgresql://')
    
    return database_url

def migrate_production_status():
    """Migration pour la production Railway"""
    
    database_url = get_db_url()
    logger.info(f"Connexion à la base de données: {database_url.split('@')[1] if '@' in database_url else 'local'}")
    
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        cursor = conn.cursor()
        
        # 1. Vérifier l'enum actuel
        cursor.execute("""
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'documentstatus')
            ORDER BY enumlabel;
        """)
        current_values = [row[0] for row in cursor.fetchall()]
        logger.info(f"Valeurs actuelles de l'enum: {current_values}")
        
        # 2. Ajouter les nouveaux statuts si nécessaire
        new_values = ['A_TRAITER', 'PRE_TRAITEE', 'VALIDEE']
        for value in new_values:
            if value not in current_values:
                try:
                    cursor.execute(sql.SQL("ALTER TYPE documentstatus ADD VALUE {}").format(
                        sql.Literal(value)
                    ))
                    logger.info(f"✅ Ajouté: {value}")
                except Exception as e:
                    if "already exists" not in str(e):
                        logger.warning(f"Impossible d'ajouter {value}: {e}")
        
        # Commit après l'ajout des valeurs d'enum
        conn.commit()
        logger.info("✅ Nouvelles valeurs d'enum commitées")
        
        # 3. Compter les documents avec l'ancien statut
        cursor.execute("SELECT COUNT(*) FROM documents WHERE status = 'VALIDATED'")
        validated_count = cursor.fetchone()[0]
        logger.info(f"Documents avec statut VALIDATED: {validated_count}")
        
        # 4. Mettre à jour les documents
        if validated_count > 0:
            cursor.execute("""
                UPDATE documents 
                SET status = 'VALIDEE' 
                WHERE status = 'VALIDATED'
            """)
            logger.info(f"✅ {validated_count} documents migrés de VALIDATED → VALIDEE")
        else:
            logger.info("✅ Aucun document à migrer")
        
        # 5. Vérifier d'autres tables qui pourraient utiliser l'enum
        tables_to_check = ['document_classifications']
        for table in tables_to_check:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE status = 'VALIDATED'")
                count = cursor.fetchone()[0]
                if count > 0:
                    cursor.execute(f"""
                        UPDATE {table} 
                        SET status = 'VALIDEE' 
                        WHERE status = 'VALIDATED'
                    """)
                    logger.info(f"✅ {count} lignes migrées dans {table}")
            except Exception as e:
                logger.info(f"Table {table} non trouvée ou pas de colonne status: {e}")
        
        conn.commit()
        logger.info("✅ Migration terminée avec succès")
        
    except Exception as e:
        logger.error(f"Erreur lors de la migration: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate_production_status()
