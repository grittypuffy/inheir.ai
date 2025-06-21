import hashlib
import os
from azure.storage.blob import BlobClient
from inheir_backend.config import get_config

config = get_config()

def get_filename_hash(file_name: str, hash_algorithm='sha256', file_extension=""):
    """
    Generate a hashed filename using the given hash algorithm (default: SHA-256).
    """
    hash_func = hashlib.new(hash_algorithm)
    hash_func.update(file_name.encode('utf-8'))
    file_extension = os.path.splitext(file_name)[1]
    hex_digest = hash_func.hexdigest()
    return (f"{hex_digest}{file_extension}", hex_digest)


async def upload_user_file(
    file_content: bytes,
    file_name: str,
    user_id: str,
    case_id: str | None,
    chat_id: str | None,
    case: bool = True
):
    """
    Upload a user file to the user uploads container.
    Accepts raw bytes and metadata (native Azure Function style).
    """
    hashed_filename, digest = get_filename_hash(file_name)

    blob_client: BlobClient = config.uploads.get_blob_client(hashed_filename)

    blob_client.upload_blob(
        file_content,
        overwrite=True,
        metadata={
            "user_id": user_id,
            "filename": file_name,
            "id": digest,
            "case_id": case_id,
            "chat_id": chat_id
        }
    )

    return {"status": "success", "url": f"{config.env.uploads_endpoint}{hashed_filename}"}


async def upload_knowledge_base_file(
    file_content: bytes,
    file_name: str
):
    """
    Upload a file to the knowledge base container (native Azure Function style).
    """
    hashed_filename, digest = get_filename_hash(file_name)

    blob_client: BlobClient = config.knowledge_base.get_blob_client(hashed_filename)

    blob_client.upload_blob(
        file_content,
        overwrite=True,
        metadata={
            "filename": file_name,
            "id": digest
        }
    )

    return {"status": "success", "url": f"{config.env.knowledge_base_endpoint}{hashed_filename}"}


def update_user_metadata(
    hashed_file_name: str,
    case_id: str | None,
    chat_id: str | None
):
    """
    Update metadata for an existing user-uploaded file.
    """
    blob_client: BlobClient = config.uploads.get_blob_client(hashed_file_name)

    properties = blob_client.get_blob_properties()
    prev_metadata = properties.metadata or {}

    updated_metadata = {**prev_metadata, "case_id": case_id, "chat_id": chat_id}

    blob_client.set_blob_metadata(updated_metadata)

    return {"status": "success", "url": f"{config.env.uploads_endpoint}{hashed_file_name}"}