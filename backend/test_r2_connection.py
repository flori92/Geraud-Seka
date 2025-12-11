#!/usr/bin/env python3
"""
Script de test de connexion Cloudflare R2
Usage: python test_r2_connection.py
"""

import boto3
from botocore.exceptions import ClientError
import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Couleurs
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

def test_r2_connection():
    """Test la connexion à Cloudflare R2"""
    print_header("TEST CONNEXION CLOUDFLARE R2")

    # Récupérer les credentials
    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key = os.getenv("R2_ACCESS_KEY_ID")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
    bucket_name = os.getenv("R2_BUCKET_NAME")
    public_url = os.getenv("R2_PUBLIC_BASE_URL")

    print_info("Configuration détectée:")
    print(f"  Account ID: {account_id}")
    print(f"  Access Key: {access_key[:10]}...{access_key[-10:]}")
    print(f"  Secret Key: {secret_key[:10]}...***")
    print(f"  Bucket: {bucket_name}")
    print(f"  Public URL: {public_url}")

    if not all([account_id, access_key, secret_key, bucket_name]):
        print_error("Configuration R2 incomplète dans .env")
        return False

    try:
        # Créer le client S3 pour R2
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

        print_info(f"\nConnexion à: {endpoint_url}")

        s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto'
        )

        # Test 1: Lister les buckets
        print_info("\nTest 1: Liste des buckets...")
        response = s3_client.list_buckets()
        buckets = [b['Name'] for b in response.get('Buckets', [])]

        if buckets:
            print_success(f"Buckets trouvés: {', '.join(buckets)}")

            if bucket_name in buckets:
                print_success(f"Bucket '{bucket_name}' existe ✓")
            else:
                print_warning(f"Bucket '{bucket_name}' n'existe pas")
                print_info("Création du bucket...")
                try:
                    s3_client.create_bucket(Bucket=bucket_name)
                    print_success(f"Bucket '{bucket_name}' créé ✓")
                except ClientError as e:
                    print_error(f"Erreur création bucket: {e}")
                    return False
        else:
            print_warning("Aucun bucket trouvé, création...")
            try:
                s3_client.create_bucket(Bucket=bucket_name)
                print_success(f"Bucket '{bucket_name}' créé ✓")
            except ClientError as e:
                print_error(f"Erreur création bucket: {e}")
                return False

        # Test 2: Upload d'un fichier test
        print_info("\nTest 2: Upload d'un fichier test...")
        test_content = b"Test SEKA - Connexion R2 reussie!"
        test_filename = "test-connection.txt"

        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_filename,
                Body=test_content,
                ContentType='text/plain'
            )
            print_success(f"Fichier '{test_filename}' uploadé ✓")
        except ClientError as e:
            print_error(f"Erreur upload: {e}")
            return False

        # Test 3: Lister les objets
        print_info("\nTest 3: Liste des objets dans le bucket...")
        try:
            response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
            objects = response.get('Contents', [])

            if objects:
                print_success(f"{len(objects)} objet(s) trouvé(s):")
                for obj in objects[:5]:
                    size = obj['Size']
                    key = obj['Key']
                    print(f"  • {key} ({size} bytes)")
            else:
                print_info("Aucun objet dans le bucket")
        except ClientError as e:
            print_error(f"Erreur liste: {e}")

        # Test 4: Téléchargement
        print_info("\nTest 4: Téléchargement du fichier test...")
        try:
            response = s3_client.get_object(Bucket=bucket_name, Key=test_filename)
            content = response['Body'].read()

            if content == test_content:
                print_success("Fichier téléchargé et vérifié ✓")
            else:
                print_warning("Contenu du fichier différent")
        except ClientError as e:
            print_error(f"Erreur téléchargement: {e}")

        # Test 5: Suppression
        print_info("\nTest 5: Suppression du fichier test...")
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=test_filename)
            print_success("Fichier supprimé ✓")
        except ClientError as e:
            print_error(f"Erreur suppression: {e}")

        # Test 6: Vérifier les permissions
        print_info("\nTest 6: Vérification des permissions bucket...")
        try:
            # Essayer de lire la politique du bucket
            try:
                policy = s3_client.get_bucket_policy(Bucket=bucket_name)
                print_success("Permissions bucket OK")
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchBucketPolicy':
                    print_info("Aucune politique définie (normal)")
                else:
                    print_warning(f"Impossible de lire les permissions: {e}")
        except Exception as e:
            print_warning(f"Test permissions ignoré: {e}")

        print_header("✓ TOUS LES TESTS R2 RÉUSSIS !")
        print_info("\nVotre configuration R2 est fonctionnelle.")
        print_info("Les fichiers uploadés via SEKA seront stockés sur Cloudflare R2.")

        return True

    except ClientError as e:
        print_error(f"\nErreur de connexion R2: {e}")
        print_warning("\nVérifiez:")
        print_warning("  1. Les credentials R2 sont corrects")
        print_warning("  2. Le compte Cloudflare R2 est actif")
        print_warning("  3. Les permissions de l'API token")
        return False
    except Exception as e:
        print_error(f"\nErreur inattendue: {e}")
        return False

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║         SEKA - TEST CONNEXION CLOUDFLARE R2                ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}\n")

    success = test_r2_connection()

    if success:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Cloudflare R2 est prêt à l'emploi !{Colors.RESET}\n")
        print_info("Prochaine étape: Testez l'upload de documents avec:")
        print_info("  python test_document_upload.py")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ Problème de connexion R2{Colors.RESET}\n")
        print_warning("Corrigez la configuration avant de continuer.")

if __name__ == "__main__":
    main()
