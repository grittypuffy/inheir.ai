from azure.storage.blob import BlobServiceClient, ContainerClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from langchain_openai import AzureChatOpenAI


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