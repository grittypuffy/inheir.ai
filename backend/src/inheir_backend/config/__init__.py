import json
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_database
from .environment import EnvVarConfig

from ..helpers.singleton import singleton
from ..helpers.service import get_document_analysis_client
from ..helpers.service import get_text_analysis_client
from ..helpers.service import get_storage_client
from ..helpers.service import get_llm
from ..helpers.service import get_search
from ..helpers.service import get_langchain_llm

from azure.storage.blob import ContainerClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from langchain_openai import AzureChatOpenAI
from azure.search.documents import SearchClient
from openai import AzureOpenAI
from azure.ai.textanalytics import TextAnalyticsClient

load_dotenv()


@singleton
class AppConfig:
    def __init__(self):
        self.env: EnvVarConfig = EnvVarConfig()

        # MongoDB database for storage
        self.db: AsyncIOMotorDatabase = get_database(self.env)

        # Storage client for Knowledge base
        self.knowledge_base: ContainerClient = get_storage_client(self.env.azure_storage_account_connection_string, self.env.kb_container_name)

        # Storage client for uploads of user documents
        self.uploads: ContainerClient = get_storage_client(self.env.azure_storage_account_connection_string, self.env.uploads_container_name)

        # Document analysis client for document intelligence (extraction of text and other data)
        self.document_analysis_client: DocumentAnalysisClient = get_document_analysis_client(self.env.document_intelligence_endpoint, self.env.document_intelligence_key)

        # OpenAI LLM for LangChain
        self.langchain_llm: AzureChatOpenAI = get_langchain_llm(
            self.env.azure_openai_api_key,
            self.env.azure_openai_endpoint,
            self.env.azure_openai_deployment,
            self.env.azure_openai_api_version
        )

        # Normal LLM for working
        self.llm: AzureOpenAI = get_llm(
            self.env.azure_openai_api_key,
            self.env.azure_openai_endpoint,
            self.env.azure_openai_api_version
        )

        # Azure AI Search for performing RAG on legal documents
        self.search: SearchClient = get_search(
            self.env.ai_search_index_name, self.env.ai_search_api_key, self.env.ai_search_endpoint)

        # Text Analytics Client
        self.text_analytics_client: TextAnalyticsClient = get_text_analysis_client(self.env.document_intelligence_endpoint, self.env.document_intelligence_key)


def get_config() -> AppConfig:
    return AppConfig()