#!/usr/bin/env python3
"""
Script pour migrer les anciens statuts de documents vers les nouveaux statuts SEKA
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import Settings
settings = Settings()
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_document_status():
    """Migre les statuts de documents de l'ancien format vers le nouveau format SEKA"""
    
    engine = create_engine(settings.database_url)
    
    migrations = [
        # VALIDATED → VALIDEE
        ("UPDATE documents SET status = 'VALIDEE' WHERE status = 'VALIDATED'", 
         "Migration VALIDATED → VALIDEE"),
        
        # Vérifier s'il y a d'autres statuts à migrer
        ("SELECT DISTINCT status FROM documents WHERE status NOT IN ('UPLOADED', 'OCR_PROCESSING', 'OCR_COMPLETED', 'A_TRAITER', 'PRE_TRAITEE', 'VALIDEE', 'REJECTED', 'ARCHIVED')", 
         "Vérification statuts restants"),
    ]
    
    try:
        with engine.connect() as conn:
            for query, description in migrations:
                logger.info(f"Exécution: {description}")
                if query.startswith("SELECT"):
                    result = conn.execute(text(query))
                    rows = result.fetchall()
                    if rows:
                        logger.warning(f"Statuts non migrés trouvés: {rows}")
                    else:
                        logger.info("✅ Tous les statuts sont conformes")
                else:
                    result = conn.execute(text(query))
                    conn.commit()
                    logger.info(f"✅ {description}: {result.rowcount} lignes mises à jour")
                    
    except Exception as e:
        logger.error(f"Erreur lors de la migration: {e}")
        raise
    
    logger.info("✅ Migration des statuts de documents terminée")

if __name__ == "__main__":
    migrate_document_status()
