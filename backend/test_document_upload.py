#!/usr/bin/env python3
"""
Script de test pour l'upload et l'extraction de documents dans SEKA
Usage: python test_document_upload.py
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Couleurs pour le terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✓{Colors.RESET} {message}")

def print_error(message):
    print(f"{Colors.RED}✗{Colors.RESET} {message}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ{Colors.RESET} {message}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {message}")

def print_header(message):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{message}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

# Variables globales
access_token = None
user_id = None
tenant_id = None

def test_backend_connection():
    """Test 1: Vérifier que le backend est accessible"""
    print_header("TEST 1: Connexion au Backend")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Backend accessible sur {BASE_URL}")
            return True
        else:
            print_error(f"Backend répond avec le code {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Impossible de se connecter au backend: {e}")
        print_warning("Assurez-vous que le backend est démarré avec: cd backend && python -m app.main")
        return False

def login():
    """Test 2: Se connecter et obtenir un token"""
    print_header("TEST 2: Authentification")
    global access_token, user_id, tenant_id

    # Credentials de test (à adapter selon votre base de données)
    credentials = {
        "username": "admin@seka.com",
        "password": "admin123"
    }

    print_info(f"Tentative de connexion avec: {credentials['username']}")

    try:
        response = requests.post(
            f"{API_V1}/auth/login",
            data=credentials,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            user_id = data.get("user", {}).get("id")
            tenant_id = data.get("user", {}).get("tenant_id")

            print_success("Connexion réussie!")
            print_info(f"User ID: {user_id}")
            print_info(f"Tenant ID: {tenant_id}")
            print_info(f"Token: {access_token[:50]}...")
            return True
        else:
            print_error(f"Échec de connexion: {response.status_code}")
            print_error(f"Réponse: {response.text}")
            print_warning("\nCréez un utilisateur de test avec:")
            print_warning("  cd backend")
            print_warning("  python -m alembic upgrade head")
            print_warning("  python scripts/create_admin.py")
            return False
    except Exception as e:
        print_error(f"Erreur lors de la connexion: {e}")
        return False

def check_ocr_config():
    """Test 3: Vérifier la configuration OCR Mindee"""
    print_header("TEST 3: Configuration OCR Mindee")

    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        with open(env_file) as f:
            content = f.read()
            if "MINDEE_API_KEY" in content and "md_" in content:
                print_success("Clé API Mindee configurée dans .env")
                # Extraire la clé (masquée)
                for line in content.split('\n'):
                    if line.startswith('MINDEE_API_KEY'):
                        key = line.split('=')[1].strip()
                        print_info(f"Clé: {key[:10]}...{key[-10:]}")
                return True
            else:
                print_warning("Clé API Mindee non trouvée dans .env")
                print_info("Le système utilisera le mode mock (données simulées)")
                return True
    else:
        print_warning("Fichier .env non trouvé")
        return True

def check_storage_config():
    """Test 4: Vérifier la configuration du stockage"""
    print_header("TEST 4: Configuration Stockage")

    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        with open(env_file) as f:
            content = f.read()
            r2_configured = all(x in content for x in ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID"])

            if r2_configured:
                print_success("Cloudflare R2 configuré")
                print_info("Les fichiers seront stockés sur Cloudflare R2")
            else:
                print_warning("Cloudflare R2 non configuré")
                print_info("Les fichiers seront stockés localement dans: backend/uploads/")

                # Créer le dossier uploads si nécessaire
                uploads_dir = Path(__file__).parent / "uploads"
                uploads_dir.mkdir(exist_ok=True)
                print_success(f"Dossier uploads créé: {uploads_dir}")

            return True
    return True

def create_test_invoice_pdf():
    """Créer une fausse facture PDF pour les tests"""
    from io import BytesIO

    print_header("TEST 5: Préparation Fichier de Test")

    # Vérifier si ReportLab est installé
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)

        # Contenu de la facture
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, 750, "FACTURE TEST SEKA")

        c.setFont("Helvetica", 12)
        c.drawString(100, 720, "Numéro: FAC-2024-001")
        c.drawString(100, 700, "Date: 11/12/2024")
        c.drawString(100, 680, "Échéance: 11/01/2025")

        c.drawString(100, 640, "Fournisseur: Tech Supplies SARL")
        c.drawString(100, 620, "Adresse: 123 Avenue de la République, Dakar")

        c.drawString(100, 580, "Client: SEKA Enterprise")

        c.drawString(100, 540, "Désignation: Ordinateurs portables Dell")
        c.drawString(100, 520, "Quantité: 5")
        c.drawString(100, 500, "Prix unitaire HT: 500 000 XOF")

        c.drawString(100, 460, "Montant HT: 2 500 000 XOF")
        c.drawString(100, 440, "TVA (18%): 450 000 XOF")
        c.drawString(100, 420, "Montant TTC: 2 950 000 XOF")

        c.save()
        buffer.seek(0)

        print_success("Facture PDF générée en mémoire")
        return buffer, "test_invoice.pdf"

    except ImportError:
        print_warning("ReportLab non installé, création d'un fichier texte simple")

        # Créer un fichier texte simple
        content = """
FACTURE TEST SEKA
=================

Numéro: FAC-2024-001
Date: 11/12/2024
Échéance: 11/01/2025

Fournisseur: Tech Supplies SARL
Adresse: 123 Avenue de la République, Dakar

Client: SEKA Enterprise

Désignation: Ordinateurs portables Dell
Quantité: 5
Prix unitaire HT: 500 000 XOF

Montant HT: 2 500 000 XOF
TVA (18%): 450 000 XOF
Montant TTC: 2 950 000 XOF
"""
        buffer = BytesIO(content.encode())
        print_success("Facture TXT générée en mémoire")
        return buffer, "test_invoice.txt"

def test_upload_document():
    """Test 6: Upload d'un document"""
    print_header("TEST 6: Upload de Document")

    if not access_token:
        print_error("Token non disponible, authentifiez-vous d'abord")
        return None

    # Créer le fichier de test
    file_buffer, filename = create_test_invoice_pdf()

    # Préparer la requête
    files = {
        'file': (filename, file_buffer, 'application/pdf')
    }

    data = {
        'title': 'Facture Test - Ordinateurs Dell',
        'description': 'Facture de test pour le système d\'upload SEKA',
        'category': 'ACCOUNTING',
        'type': 'INVOICE_PURCHASE',
        'tags': json.dumps(['test', 'facture', 'achat'])
    }

    headers = {
        'Authorization': f'Bearer {access_token}'
    }

    print_info(f"Upload du fichier: {filename}")
    print_info(f"Type: {data['type']}")

    try:
        response = requests.post(
            f"{API_V1}/ged/upload",
            files=files,
            data=data,
            headers=headers
        )

        if response.status_code in [200, 201]:
            document = response.json()
            print_success("Document uploadé avec succès!")
            print_info(f"ID Document: {document.get('id')}")
            print_info(f"Statut: {document.get('status')}")
            print_info(f"Taille: {document.get('file_size')} bytes")

            # Vérifier les données OCR
            if document.get('ocr_data'):
                print_success("Données OCR extraites:")
                ocr_data = document.get('ocr_data')
                if isinstance(ocr_data, str):
                    ocr_data = json.loads(ocr_data)
                print(json.dumps(ocr_data, indent=2, ensure_ascii=False))
            else:
                print_warning("Aucune donnée OCR (le traitement peut prendre quelques secondes)")

            return document
        else:
            print_error(f"Échec de l'upload: {response.status_code}")
            print_error(f"Réponse: {response.text}")
            return None

    except Exception as e:
        print_error(f"Erreur lors de l'upload: {e}")
        return None

def test_get_documents():
    """Test 7: Récupération de la liste des documents"""
    print_header("TEST 7: Liste des Documents")

    if not access_token:
        print_error("Token non disponible")
        return []

    headers = {
        'Authorization': f'Bearer {access_token}'
    }

    try:
        response = requests.get(
            f"{API_V1}/ged/",
            headers=headers,
            params={'limit': 10}
        )

        if response.status_code == 200:
            documents = response.json()
            print_success(f"Documents récupérés: {len(documents)}")

            if documents:
                print("\nDerniers documents:")
                for doc in documents[:5]:
                    print(f"  • {doc.get('filename')} - {doc.get('status')} - {doc.get('created_at')}")
            else:
                print_info("Aucun document trouvé")

            return documents
        else:
            print_error(f"Échec: {response.status_code}")
            return []

    except Exception as e:
        print_error(f"Erreur: {e}")
        return []

def test_validate_document(document_id):
    """Test 8: Validation d'un document et génération d'écritures"""
    print_header("TEST 8: Validation Document et Génération Écritures")

    if not access_token:
        print_error("Token non disponible")
        return False

    validation_data = {
        "date": "2024-12-11",
        "supplier_name": "Tech Supplies SARL",
        "total_amount": 2950000.00,
        "tax_amount": 450000.00,
        "description": "Achat ordinateurs portables Dell x5",
        "account_number": "601000",
        "journal_code": "ACH"
    }

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    print_info(f"Validation du document: {document_id}")
    print_info(f"Montant TTC: {validation_data['total_amount']:,.0f} XOF")
    print_info(f"TVA: {validation_data['tax_amount']:,.0f} XOF")

    try:
        response = requests.post(
            f"{API_V1}/documents/{document_id}/validate",
            json=validation_data,
            headers=headers
        )

        if response.status_code in [200, 201]:
            result = response.json()
            print_success("Document validé!")

            entries = result.get('accounting_entries', [])
            if entries:
                print_success(f"{len(entries)} écritures comptables générées:")
                for entry in entries:
                    debit = entry.get('debit_amount', 0)
                    credit = entry.get('credit_amount', 0)
                    account = entry.get('account_number')
                    label = entry.get('label')

                    if debit > 0:
                        print(f"  • Débit {account}: {debit:,.0f} XOF - {label}")
                    if credit > 0:
                        print(f"  • Crédit {account}: {credit:,.0f} XOF - {label}")

            return True
        else:
            print_error(f"Échec de validation: {response.status_code}")
            print_error(f"Réponse: {response.text}")
            return False

    except Exception as e:
        print_error(f"Erreur: {e}")
        return False

def test_search_documents():
    """Test 9: Recherche de documents"""
    print_header("TEST 9: Recherche de Documents")

    if not access_token:
        print_error("Token non disponible")
        return

    search_data = {
        "search_query": "facture",
        "filters": {
            "category": "ACCOUNTING",
            "type": "INVOICE_PURCHASE"
        }
    }

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    print_info(f"Recherche: '{search_data['search_query']}'")

    try:
        response = requests.post(
            f"{API_V1}/ged/search",
            json=search_data,
            headers=headers
        )

        if response.status_code == 200:
            results = response.json()
            print_success(f"Résultats trouvés: {len(results)}")

            for doc in results[:3]:
                print(f"  • {doc.get('filename')} - {doc.get('type')}")
        else:
            print_error(f"Échec: {response.status_code}")

    except Exception as e:
        print_error(f"Erreur: {e}")

def test_stats():
    """Test 10: Statistiques documents"""
    print_header("TEST 10: Statistiques Documents")

    if not access_token:
        print_error("Token non disponible")
        return

    headers = {
        'Authorization': f'Bearer {access_token}'
    }

    try:
        response = requests.get(
            f"{API_V1}/ged/stats/overview",
            headers=headers
        )

        if response.status_code == 200:
            stats = response.json()
            print_success("Statistiques récupérées:")
            print(f"  • Total documents: {stats.get('total_documents', 0)}")
            print(f"  • Taille totale: {stats.get('total_size_formatted', '0 B')}")
            print(f"  • Uploads récents (7j): {stats.get('recent_uploads', 0)}")
            print(f"  • En attente validation: {stats.get('pending_validation', 0)}")

            by_status = stats.get('by_status', {})
            if by_status:
                print("\n  Par statut:")
                for status, count in by_status.items():
                    print(f"    - {status}: {count}")
        else:
            print_error(f"Échec: {response.status_code}")

    except Exception as e:
        print_error(f"Erreur: {e}")

def main():
    """Fonction principale - exécute tous les tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║         SEKA - TEST UPLOAD & EXTRACTION DOCUMENTS          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}\n")

    # Test 1: Backend
    if not test_backend_connection():
        print_error("\n❌ Impossible de continuer sans backend")
        return

    # Test 2: Authentification
    if not login():
        print_error("\n❌ Impossible de continuer sans authentification")
        return

    # Test 3: Configuration OCR
    check_ocr_config()

    # Test 4: Configuration Storage
    check_storage_config()

    # Test 6: Upload
    document = test_upload_document()

    # Test 7: Liste
    documents = test_get_documents()

    # Test 8: Validation (si upload réussi)
    if document and document.get('id'):
        test_validate_document(document['id'])

    # Test 9: Recherche
    test_search_documents()

    # Test 10: Stats
    test_stats()

    print(f"\n{Colors.BOLD}{Colors.GREEN}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║                  TESTS TERMINÉS ✓                          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}\n")

if __name__ == "__main__":
    main()
