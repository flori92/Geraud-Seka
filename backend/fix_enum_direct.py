#!/usr/bin/env python3
"""
Script direct pour mettre à jour l'enum PostgreSQL sans Alembic
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import Settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_document_enum():
    """Met à jour directement l'enum PostgreSQL"""
    
    settings = Settings()
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as conn:
            # 1. Vérifier l'enum actuel
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'documentstatus')
                ORDER BY enumlabel;
            """))
            current_values = [row[0] for row in result.fetchall()]
            logger.info(f"Valeurs actuelles de l'enum: {current_values}")
            
            # 2. Mettre à jour les documents avec l'ancien statut
            if 'VALIDATED' in current_values and 'VALIDEE' not in current_values:
                # D'abord ajouter les nouvelles valeurs à l'enum
                logger.info("Ajout des nouveaux statuts à l'enum...")
                new_values = ['A_TRAITER', 'PRE_TRAITEE', 'VALIDEE']
                
                for value in new_values:
                    try:
                        conn.execute(text(f"ALTER TYPE documentstatus ADD VALUE '{value}'"))
                        conn.commit()
                        logger.info(f"✅ Ajouté: {value}")
                    except Exception as e:
                        if "already exists" not in str(e):
                            logger.warning(f"Impossible d'ajouter {value}: {e}")
                
                # 3. Mettre à jour les documents existants
                logger.info("Migration des statuts de documents...")
                result = conn.execute(text("""
                    UPDATE documents 
                    SET status = 'VALIDEE' 
                    WHERE status = 'VALIDATED'
                """))
                conn.commit()
                logger.info(f"✅ {result.rowcount} documents migrés de VALIDATED → VALIDEE")
                
            else:
                logger.info("✅ L'enum contient déjà les bonnes valeurs ou n'a pas besoin de migration")
                
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour: {e}")
        raise
    
    logger.info("✅ Migration terminée avec succès")

if __name__ == "__main__":
    fix_document_enum()
