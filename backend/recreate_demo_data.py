#!/usr/bin/env python3
"""
Script pour recréer les données de démo perdues
"""

from app.db.session import engine
from sqlalchemy import text
import uuid
import sys

def recreate_demo_data():
    try:
        with engine.connect() as conn:
            # Commencer une transaction
            trans = conn.begin()

            print('🚀 Recréation des données de démo...')

            # 1. Créer un client de démo
            client_id = str(uuid.uuid4())
            tenant_id = 'e535cad9-f944-43e2-9c41-9a5b3cca2a6a'  # ID du tenant existant

            # Vérifier si le client existe déjà
            result = conn.execute(text('SELECT id FROM clients WHERE name = :name AND tenant_id = :tenant_id'),
                                 {'name': 'Seka Demo Client', 'tenant_id': tenant_id})
            existing_client = result.fetchone()

            if existing_client:
                print('ℹ️  Client démo existe déjà')
                client_id = str(existing_client[0])
            else:
                # Créer le client avec les bonnes colonnes
                conn.execute(text('''
                    INSERT INTO clients (
                        id, name, slug, code, sector, nif, rccm, contact_name, email, phone,
                        address, country, tenant_id, created_at, updated_at,
                        auxiliary_account_code, collective_account_code, default_revenue_account
                    ) VALUES (
                        :id, :name, :slug, :code, :sector, :nif, :rccm, :contact_name, :email, :phone,
                        :address, :country, :tenant_id, NOW(), NOW(),
                        :auxiliary_code, :collective_code, :revenue_account
                    )
                '''), {
                    'id': client_id,
                    'name': 'Seka Demo Client',
                    'slug': 'seka-demo-client',
                    'code': 'CLI-DEMO',
                    'sector': 'Services',
                    'nif': '1234567890123',
                    'rccm': 'RC-ABC-09876',
                    'contact_name': 'Géraud DE SOUZA',
                    'email': 'contact@sekademo.com',
                    'phone': '+229 97000000',
                    'address': 'Cotonou, Bénin',
                    'country': 'Bénin',
                    'tenant_id': tenant_id,
                    'auxiliary_code': '411100',
                    'collective_code': '411',
                    'revenue_account': '701100'
                })
                print('✅ Client démo créé')

            # 2. Créer quelques documents de test
            doc1_id = str(uuid.uuid4())
            doc2_id = str(uuid.uuid4())

            documents_data = [
                {
                    'id': doc1_id,
                    'filename': 'facture_demo_001.pdf',
                    'original_filename': 'facture_demo_001.pdf',
                    'file_path': '/uploads/demo/facture_demo_001.pdf',
                    'content_type': 'application/pdf',
                    'file_size': 245760,
                    'status': 'VALIDEE',
                    'type': 'INVOICE_SALES',
                    'title': 'Facture Demo 001',
                    'amount_ttc': 150000.00,
                    'currency': 'XOF',
                    'client_id': client_id,
                    'tenant_id': tenant_id,
                    'uploaded_by': '70708a26-8896-45f5-bb6d-39a2ebb0b450'  # Admin user ID
                },
                {
                    'id': doc2_id,
                    'filename': 'recu_demo_002.pdf',
                    'original_filename': 'recu_demo_002.pdf',
                    'file_path': '/uploads/demo/recu_demo_002.pdf',
                    'content_type': 'application/pdf',
                    'file_size': 189440,
                    'status': 'VALIDEE',
                    'type': 'RECEIPT',
                    'title': 'Reçu Demo 002',
                    'amount_ttc': 75000.00,
                    'currency': 'XOF',
                    'client_id': client_id,
                    'tenant_id': tenant_id,
                    'uploaded_by': '70708a26-8896-45f5-bb6d-39a2ebb0b450'  # Admin user ID
                }
            ]

            for doc_data in documents_data:
                conn.execute(text('''
                    INSERT INTO documents (
                        id, filename, original_filename, file_path, content_type, file_size,
                        status, type, title, amount_ttc, currency,
                        client_id, tenant_id, uploaded_by, created_at, updated_at
                    ) VALUES (
                        :id, :filename, :original_filename, :file_path, :content_type, :file_size,
                        :status, :type, :title, :amount_ttc, :currency,
                        :client_id, :tenant_id, :uploaded_by, NOW(), NOW()
                    )
                '''), doc_data)

            print('✅ Documents de démo créés')

            # 3. Créer des entrées de doublons pour tester la détection
            conn.execute(text('''
                INSERT INTO document_duplicates (
                    id, new_document_id, existing_document_id, detection_reason, 
                    tenant_id, created_at, updated_at
                ) VALUES (
                    :id, :new_doc_id, :existing_doc_id, :reason,
                    :tenant_id, NOW(), NOW()
                )
            '''), {
                'id': str(uuid.uuid4()),
                'new_doc_id': doc1_id,
                'existing_doc_id': doc2_id,
                'reason': 'SAME_INVOICE_NUMBER',
                'tenant_id': tenant_id
            })

            print('✅ Données de doublons créées')

            # Valider la transaction
            trans.commit()
            print('\n🎉 Toutes les données de démo ont été recréées avec succès!')

    except Exception as e:
        print(f'❌ Erreur lors de la recréation des données: {e}')
        if 'trans' in locals():
            trans.rollback()
        sys.exit(1)

if __name__ == "__main__":
    recreate_demo_data()