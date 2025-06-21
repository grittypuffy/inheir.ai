from azure.storage.blob import BlobServiceClient, ContainerClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from langchain_openai import AzureChatOpenAI
from azure.search.documents import SearchClient
from openai import AzureOpenAI


def get_document_analysis_client(form_recognizer_endpoint: str, form_recognizer_key: str) -> DocumentAnalysisClient:
    document_analysis_client = DocumentAnalysisClient(
        endpoint=form_recognizer_endpoint,
        credential=AzureKeyCredential(form_recognizer_key)
    )
    return document_analysis_client


def get_storage_client(connection_string: str, container_name: str) -> ContainerClient:
    blob_service_client = BlobServiceClient.from_connection_string(
        connection_string)
    container_client: ContainerClient = blob_service_client.get_container_client(
        container_name)
    return container_client


def get_langchain_llm(openai_api_key: str, endpoint: str, deployment: str, api_version: str) -> AzureChatOpenAI:
    llm = AzureChatOpenAI(
        openai_api_key=openai_api_key,
        azure_endpoint=endpoint,
        azure_deployment=deployment,
        api_version=api_version,
        temperature=0.7,
        max_tokens=5000,
        timeout=None,
        max_retries=2,
    )
    return llm


def get_llm(openai_api_key: str, endpoint: str, api_version: str) -> AzureOpenAI:
    llm = AzureOpenAI(
        api_key=openai_api_key,
        azure_endpoint=endpoint,
        api_version=api_version
    )
    return llm



def get_search(index_name: str, api_key: str, ai_search_endpoint: str) -> SearchClient:
    search_client = SearchClient(
        endpoint=ai_search_endpoint, index_name=index_name, credential=AzureKeyCredential(api_key))
    return search_client
