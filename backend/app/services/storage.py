import shutil
import os
from uuid import uuid4
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

class StorageService:
    def __init__(self):
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

    async def upload_file(self, file: UploadFile) -> str:
        """
        Upload a file to storage (local for now, R2 later).
        Returns the file path/url.
        """
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "tmp"
        filename = f"{uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

storage_service = StorageService()
