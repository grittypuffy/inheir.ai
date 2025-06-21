import json
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_database
from .environment import EnvVarConfig

from helpers.singleton import singleton
from helpers.service import get_document_analysis_client, get_storage_client, get_llm, get_search, get_langchain_llm

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
        self.uploads = get_storage_client(self.env.azure_storage_account_connection_string, self.env.uploads_container_name)

        # Document analysis client for document intelligence (extraction of text and other data)
        self.document_analysis_client = get_document_analysis_client(self.env.document_intelligence_endpoint, self.env.document_intelligence_key)

        # OpenAI LLM for LangChain
        self.langchain_llm = get_langchain_llm(
            self.env.azure_openai_api_key,
            self.env.azure_openai_endpoint,
            self.env.azure_openai_deployment,
            self.env.azure_openai_api_version
        )

        # Normal LLM for working
        self.llm = get_llm(
            self.env.azure_openai_api_key,
            self.env.azure_openai_endpoint,
            self.env.azure_openai_api_version
        )

        # Azure AI Search for performing RAG on legal documents
        self.search = get_search(
            self.env.ai_search_index_name, self.env.ai_search_api_key, self.env.ai_search_endpoint)


def get_config() -> AppConfig:
    return AppConfig()