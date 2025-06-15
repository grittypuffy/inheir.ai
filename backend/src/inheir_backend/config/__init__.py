import json
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_database
from .environment import EnvVarConfig

from ..helpers.singleton import singleton
from ..helpers.service import get_document_analysis_client, get_storage_client

load_dotenv()


@singleton
class AppConfig:
    def __init__(self):
        self.env: EnvVarConfig = EnvVarConfig()

        # MongoDB database for storage
        self.db: AsyncIOMotorDatabase = get_database(self.env)

        # Storage client for Knowledge base
        self.knowledge_base = get_storage_client(self.env.azure_storage_account_connection_string, self.env.kb_container_name)

        # Storage client for uploads of user documents
        self.uploads = get_storage_client(self.env.azure_storage_account_connection_string, self.env.uploads_container)

        # Document analysis client for document intelligence (extraction of text and other data)
        self.document_analysis_client = get_document_analysis_client(self.env.document_intelligence_endpoint, self.env.document_intelligence_key)


def get_config() -> AppConfig:
    return AppConfig()