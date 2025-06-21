import os
import logging
import mimetypes
import json
from datetime import datetime
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_community.callbacks import get_openai_callback
from config import get_config, AppConfig

config: AppConfig = get_config()


def process_upload_document(file_path: str):
    """
    Process the document from the given file path using Azure Form Recognizer (Document Intelligence).

    :param file_path: Path to the file (local or URL to the Blob).
    :return: Extracted content from the document.
    """

    file_name = file_path.split("/")[-1]
    blob_client = config.uploads.get_blob_client(file_name)
    properties = blob_client.get_blob_properties()
    content_type, _ = mimetypes.guess_type(file_path)

    metadata = properties.metadata
    filename = metadata.get("filename")
    blob_id = metadata.get("id")

    # Process the document using Azure Document Intelligence (Form Recognizer)
    try:
        if content_type in ["application/pdf", "image/png", "image/jpeg"]:
            poller = config.document_analysis_client.begin_analyze_document_from_url(
                "prebuilt-layout", file_path)
            result = poller.result()

            # Loop through the pages and extract text lines
            extracted_text = []
            for page in result.pages:
                for line in page.lines:
                    extracted_text.append(line.content)

            # Return the extracted content as a list of lines
            return "\n".join(extracted_text)
        elif content_type == "text/plain":
            blob_data = blob_client.download_blob().readall().decode("utf-8")
            return  blob_data
        else:
            return None
    except Exception as e:
        logging.error(f"Error processing the document: {e}")
        return None



def process_document(file_path: str):
    """
    Process the document from the given file path using Azure Form Recognizer (Document Intelligence).

    :param file_path: Path to the file (local or URL to the Blob).
    :return: Extracted content from the document.
    """

    file_name = file_path.split("/")[-1]
    blob_client = config.knowledge_base.get_blob_client(file_name)
    properties = blob_client.get_blob_properties()
    content_type, _ = mimetypes.guess_type(file_path)

    metadata = properties.metadata
    filename = metadata.get("filename")
    blob_id = metadata.get("id")

    # Process the document using Azure Document Intelligence (Form Recognizer)
    try:
        if content_type in ["application/pdf", "image/png", "image/jpeg"]:
            poller = config.document_analysis_client.begin_analyze_document_from_url(
                "prebuilt-layout", file_path)
            result = poller.result()

            # Loop through the pages and extract text lines
            extracted_text = []
            for page in result.pages:
                for line in page.lines:
                    extracted_text.append(line.content)

            # Return the extracted content as a list of lines
            return {"id": blob_id, "updated": str(datetime.now()), "content": "\n".join(extracted_text), "metadata_file_path": file_path, "metadata_filename": filename}
        elif content_type == "text/plain":
            blob_data = blob_client.download_blob().readall().decode("utf-8")
            return {"id": blob_id, "content": blob_data, "username": username, "metadata_file_path": file_path, "metadata_filename": filename}
        else:
            return None
    except Exception as e:
        logging.error(f"Error processing the document: {e}")
        return None


def ingest_document(file_path: str):
    """
    Ingest the document from the given file path by processing and uploading it to the RAG container.

    :param file_path: Path to the file (local or URL to the Blob).
    :return: The status of the ingestion process.
    """
    processed_content = process_document(file_path)
    if processed_content:
        index_result = config.search.upload_documents([processed_content])
        return {"status": "error", "message": "Failed to process the document."}

    else:
        return {"status": "error", "message": "Failed to process the document."}


def search_documents(query: str):
    results = config.search.search(
        search_text=query,
        # query_type="semantic",
        top=3
    )
    documents = []
    for result in results:
        documents.append(result["content"])
    return documents if documents else None


def generate_response(query, documents):
    document_string = "\n".join(documents)
    prompt = f"""
    With the following context and documents provided:
    {document_string}
    answer the query:
    {query}
    """

    # Initialize communication with the Azure OpenAI model
    try:
        # Format prompt for the model
        with get_openai_callback() as cb:
            output = config.llm.invoke(prompt)
            ret = output.content.strip()
    except Exception as e:
        raise Exception(f"Error during prompt classification: {str(e)}")

    return ret


def process_query(query: str):
    """
    Process the user query by searching for relevant documents and generating a response.

    :param query: The user query.
    :return: The response generated based on the query and documents.
    """
    documents = search_documents(query)
    if documents:
        response = generate_response(query, documents)
        return {"response": response}
    else:
        return {"response": "Sorry, there are no relevant documents found for the query."}
