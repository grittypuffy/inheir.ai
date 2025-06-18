from src.inheir_backend.config import AppConfig, get_config
from fastapi import UploadFile
from src.inheir_backend.models.upload import FileUploadMetadata
from ..helpers.filename import get_filename_hash
from azure.storage.blob import BlobClient

config: AppConfig = get_config()


async def upload_user_file(file: UploadFile, user_id: str, case_id: str | None, chat_id: str | None, case: bool = True):
    """
    Accept File uploaded from FastAPI endpoint
    """
    file_content = await file.read()
    file_name = file.filename

    # Create a Blob client and upload the file
    hashed_filename, digest = get_filename_hash(file_name)
    
    blob_client: BlobClient = config.uploads.get_blob_client(
        hashed_filename)

    blob_client.upload_blob(
        file_content,
        overwrite=True,
        metadata={
            "user_id": user_id,
            "filename": file_name,
            "id": digest,
            "case_id": case_id,
            "chat_id": chat_id
        })

    # results = ingest_document(
    #    f"{config.env.knowledge_base_endpoint}{hashed_filename}")
    return {"status": "success", "url": f"{config.env.uploads_endpoint}{hashed_filename}"}


async def upload_knowledge_base_file(file: UploadFile):
    """
    Upload file to knowledge base from FastAPI endpoint
    """
    file_content = await file.read()
    file_name = file.filename

    # Create a Blob client and upload the file
    hashed_filename, digest = get_filename_hash(file_name)
    
    blob_client: BlobClient = config.knowledge_base.get_blob_client(
        hashed_filename)

    blob_client.upload_blob(file_content, overwrite=True, metadata={
                            "filename": file_name, "id": digest})

    return {"status": "success", "url": f"{config.env.knowledge_base_endpoint}{hashed_filename}"}


def update_user_metadata(hashed_file_name: str,  case_id: str | None, chat_id: str | None):
    """
    Update user file's metadata
    """
    
    blob_client: BlobClient = config.uploads.get_blob_client(
        hashed_file_name)

    properties = blob_client.get_blob_properties()
    prev_metadata = properties.metadata or {}
    update_metadata = {"case_id": case_id, "chat_id": chat_id}
    updated_metadata = {**prev_metadata, **update_metadata}
    
    blob_client.set_blob_metadata(updated_metadata)

    return {"status": "success", "url": f"{config.env.uploads_endpoint}{hashed_filename}"}
