"""Service de stockage avec support Cloudflare R2 et fallback local."""

import os
import shutil
from typing import Optional
from uuid import uuid4
from pathlib import Path

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import UploadFile, HTTPException

from app.core.config import get_settings

settings = get_settings()

class StorageService:
    """Service de stockage intelligent avec Cloudflare R2 et fallback local."""
    
    def __init__(self):
        self.local_upload_dir = "uploads"
        self.use_r2 = self._init_r2_client()
        
        if not os.path.exists(self.local_upload_dir):
            os.makedirs(self.local_upload_dir)
    
    def _init_r2_client(self) -> bool:
        """Initialise le client Cloudflare R2."""
        try:
            if not all([
                settings.r2_access_key_id,
                settings.r2_secret_access_key,
                settings.r2_account_id,
                settings.r2_bucket_name
            ]):
                print("⚠️  Configuration R2 incomplète, utilisation du stockage local")
                return False
                
            self.r2_client = boto3.client(
                's3',
                endpoint_url=f'https://{settings.r2_account_id}.r2.cloudflarestorage.com',
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                region_name='auto'
            )
            
            self.r2_client.head_bucket(Bucket=settings.r2_bucket_name)
            print("✅ Connexion Cloudflare R2 réussie")
            return True
            
        except (ClientError, NoCredentialsError) as e:
            print(f"⚠️  Erreur R2: {e}, utilisation du stockage local")
            return False
        except Exception as e:
            print(f"⚠️  Erreur configuration R2: {e}, utilisation du stockage local")
            return False
    
    async def upload_file(
        self, 
        file: UploadFile,
        folder: str = "documents",
        tenant_id: Optional[str] = None
    ) -> dict:
        """
        Upload un fichier vers R2 ou stockage local.
        
        Args:
            file: Fichier à uploader
            folder: Dossier de destination
            tenant_id: ID du tenant pour isolation
            
        Returns:
            dict avec url, key, size, etc.
        """
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nom de fichier manquant")
        
        file_ext = Path(file.filename).suffix.lower()
        if not file_ext:
            file_ext = ".bin"
            
        unique_filename = f"{uuid4()}{file_ext}"
        
        if tenant_id:
            object_key = f"{folder}/{tenant_id}/{unique_filename}"
        else:
            object_key = f"{folder}/{unique_filename}"
        
        file_content = await file.read()
        await file.seek(0)  # Reset pour réutilisation
        
        if self.use_r2:
            return await self._upload_to_r2(object_key, file_content, file)
        else:
            return await self._upload_locally(object_key, file_content, file)
    
    async def _upload_to_r2(self, object_key: str, content: bytes, file: UploadFile) -> dict:
        """Upload vers Cloudflare R2."""
        try:
            self.r2_client.put_object(
                Bucket=settings.r2_bucket_name,
                Key=object_key,
                Body=content,
                ContentType=file.content_type or 'application/octet-stream',
                Metadata={
                    'original_filename': file.filename,
                    'uploaded_by': 'seka_api'
                }
            )
            
            if settings.r2_public_base_url:
                public_url = f"{settings.r2_public_base_url}/{object_key}"
            else:
                public_url = None
            
            return {
                "key": object_key,
                "url": public_url,
                "size": len(content),
                "content_type": file.content_type,
                "storage": "r2",
                "bucket": settings.r2_bucket_name
            }
            
        except ClientError as e:
            print(f"Erreur upload R2: {e}")
            return await self._upload_locally(object_key, content, file)
    
    async def _upload_locally(self, object_key: str, content: bytes, file: UploadFile) -> dict:
        """Upload vers stockage local."""
        file_path = os.path.join(self.local_upload_dir, object_key)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        return {
            "key": object_key,
            "url": f"/uploads/{object_key}",  # URL relative
            "path": file_path,
            "size": len(content),
            "content_type": file.content_type,
            "storage": "local"
        }
    
    async def delete_file(self, key: str) -> bool:
        """Supprime un fichier."""
        if self.use_r2:
            try:
                self.r2_client.delete_object(
                    Bucket=settings.r2_bucket_name,
                    Key=key
                )
                return True
            except ClientError:
                pass
        
        local_path = os.path.join(self.local_upload_dir, key)
        if os.path.exists(local_path):
            os.remove(local_path)
            return True
        
        return False
    
    def get_file_url(self, key: str, use_presigned: bool = True) -> str:
        """Retourne l'URL d'accès à un fichier.
        
        Args:
            key: Clé du fichier dans le stockage
            use_presigned: Si True, génère une URL signée pour R2 (valide 1h)
        """
        if self.use_r2:
            if use_presigned:
                try:
                    presigned_url = self.r2_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': settings.r2_bucket_name,
                            'Key': key
                        },
                        ExpiresIn=3600  # 1 heure
                    )
                    return presigned_url
                except Exception as e:
                    print(f"Erreur génération URL signée: {e}")
                    return f"/api/v1/documents/download/{key}"
            elif settings.r2_public_base_url:
                return f"{settings.r2_public_base_url}/{key}"
        
        return f"/api/v1/documents/download/{key}"
    
    async def get_file_content(self, key: str) -> bytes:
        """Récupère le contenu d'un fichier."""
        if self.use_r2:
            try:
                response = self.r2_client.get_object(
                    Bucket=settings.r2_bucket_name,
                    Key=key
                )
                return response['Body'].read()
            except ClientError as e:
                print(f"Erreur lecture R2: {e}")
                raise
        else:
            local_path = os.path.join(self.local_upload_dir, key)
            if os.path.exists(local_path):
                with open(local_path, 'rb') as f:
                    return f.read()
            raise FileNotFoundError(f"Fichier non trouvé: {key}")
    
    def download_file_sync(self, key: str) -> bytes:
        """Récupère le contenu d'un fichier de manière synchrone (pour les workers)."""
        if self.use_r2:
            try:
                response = self.r2_client.get_object(
                    Bucket=settings.r2_bucket_name,
                    Key=key
                )
                return response['Body'].read()
            except ClientError as e:
                print(f"Erreur lecture R2 sync: {e}")
                raise
        else:
            local_path = os.path.join(self.local_upload_dir, key)
            if os.path.exists(local_path):
                with open(local_path, 'rb') as f:
                    return f.read()
            raise FileNotFoundError(f"Fichier non trouvé: {key}")

storage_service = StorageService()
