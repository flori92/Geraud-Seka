#!/usr/bin/env python3
"""
Script d'urgence pour réparer la base de données en production
Utilisé si le serveur ne démarre pas après la migration
"""

import psycopg2
import os
import logging
from psycopg2 import sql

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_url():
    """Récupérer l'URL de la base de données depuis les variables d'environnement"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Essayer les autres variables possibles
        database_url = os.getenv('POSTGRES_URL') or os.getenv('DATABASE_URI')
    
    if not database_url:
        raise ValueError("Aucune URL de base de données trouvée dans les variables d'environnement")
    
    # Convertir psycopg2+ en psycopg si nécessaire
    if database_url.startswith('postgresql+psycopg://'):
        database_url = database_url.replace('postgresql+psycopg://', 'postgresql://')
    
    return database_url

def emergency_enum_fix():
    """Réparation d'urgence de l'enum documentstatus"""
    try:
        database_url = get_database_url()
        logger.info(f"Connexion à la base de données...")
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # 1. Vérifier l'état actuel de l'enum
        cursor.execute("""
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'documentstatus')
            ORDER BY enumlabel
        """)
        current_values = [row[0] for row in cursor.fetchall()]
        logger.info(f"Valeurs actuelles de l'enum: {current_values}")
        
        # 2. Ajouter les valeurs manquantes
        required_values = ['A_TRAITER', 'PRE_TRAITEE', 'VALIDEE']
        added_values = []
        
        for value in required_values:
            if value not in current_values:
                try:
                    cursor.execute(sql.SQL("ALTER TYPE documentstatus ADD VALUE {}").format(
                        sql.Literal(value)
                    ))
                    added_values.append(value)
                    logger.info(f"✅ Ajouté: {value}")
                except Exception as e:
                    logger.error(f"❌ Impossible d'ajouter {value}: {e}")
        
        # 3. Commit des changements d'enum
        if added_values:
            conn.commit()
            logger.info(f"✅ Commit réussi pour les valeurs: {added_values}")
        
        # 4. Migration des documents avec l'ancien statut
        cursor.execute("SELECT COUNT(*) FROM documents WHERE status = 'VALIDATED'")
        validated_count = cursor.fetchone()[0]
        logger.info(f"Documents avec statut VALIDATED: {validated_count}")
        
        if validated_count > 0:
            cursor.execute("""
                UPDATE documents 
                SET status = 'VALIDEE' 
                WHERE status = 'VALIDATED'
            """)
            updated_count = cursor.rowcount
            logger.info(f"✅ {updated_count} documents migrés de VALIDATED vers VALIDEE")
        
        # 5. Commit final
        conn.commit()
        logger.info("✅ Réparation terminée avec succès")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la réparation: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def check_server_health():
    """Vérifier si le serveur peut démarrer"""
    try:
        database_url = get_database_url()
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Test simple
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        if result and result[0] == 1:
            logger.info("✅ Base de données accessible")
            
            # Vérifier si l'enum est cohérent
            cursor.execute("""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'documentstatus')
            """)
            enum_values = [row[0] for row in cursor.fetchall()]
            
            required = ['A_TRAITER', 'PRE_TRAITEE', 'VALIDEE']
            missing = [v for v in required if v not in enum_values]
            
            if missing:
                logger.warning(f"⚠️ Valeurs manquantes dans l'enum: {missing}")
                return False
            else:
                logger.info("✅ Enum documentstatus est correct")
                return True
        else:
            logger.error("❌ Base de données inaccessible")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erreur de vérification: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚨 Script d'urgence SEKA - Réparation base de données")
    print("=" * 50)
    
    # 1. Vérifier l'état actuel
    print("\n1️⃣ Vérification de l'état du serveur...")
    if check_server_health():
        print("✅ Le serveur semble fonctionnel")
        exit(0)
    
    # 2. Réparation d'urgence
    print("\n2️⃣ Réparation d'urgence de l'enum...")
    if emergency_enum_fix():
        print("✅ Réparation réussie")
        print("\n🚀 Le serveur devrait maintenant pouvoir démarrer")
    else:
        print("❌ Réparation échouée")
        print("📞 Contactez l'administrateur système")
        exit(1)
