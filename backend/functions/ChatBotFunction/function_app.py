import logging
import azure.functions as func
import json
from inheir_backend.config import get_config
from inheir_backend.services.storage import upload_user_file
from inheir_backend.services.rag import search_documents, generate_response
from inheir_backend.models.chat import Chat

from typing import Optional
from uuid import uuid4
from io import BytesIO
from multipart import MultipartParser

config = get_config()

async def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("ChatFunction HTTP trigger received a request.")
    try:
        content_type = req.headers.get('Content-Type')
        if not content_type or 'multipart/form-data' not in content_type:
            return func.HttpResponse("Only multipart/form-data is supported", status_code=400)

        body = await req.get_body()
        parser = MultipartParser(BytesIO(body), content_type)

        query = None
        case_id = None
        file_content = None
        filename = None

        for part in parser.parts():
            if part.name == "query":
                query = part.text()
            elif part.name == "case_id":
                case_id = part.text()
            elif part.name == "document":
                filename = part.filename
                file_content = part.raw

        if not query:
            return func.HttpResponse("Missing required field: query", status_code=400)

        document_url = None

        if file_content and filename and case_id:
            # Upload user document
            uploaded_file = await upload_user_file(
                file=BytesIO(file_content),
                filename=filename,
                user_id=user_id,
                case_id=case_id,
                chat_id=None,
                case=False
            )
            document_url = uploaded_file.get("url")

        final_response = ""
        if case_id:
            case_summary_collection = config.db["case_summary"]
            case_summary_doc = await case_summary_collection.find_one(
                {"case_id": case_id},
                {"document_content": 1, "supporting_document_content": 1}
            )

            if case_summary_doc:
                combined_doc = (case_summary_doc.get("document_content") or "") + "\n" + \
                               (case_summary_doc.get("supporting_document_content") or "")
                documents = [combined_doc]
            else:
                documents = search_documents(query)

        else:
            documents = search_documents(query)

        final_response = generate_response(query, documents) if documents else "No relevant case information found."

        chat_doc = {
            "query": {"role": "user", "content": query},
            "response": {"role": "bot", "content": final_response},
            "case_id": case_id,
            "user_id": user_id,
            "document": document_url
        }

        insert_result = await config.db["chat_history"].insert_one(chat_doc)
        chat_doc["chat_id"] = str(insert_result.inserted_id)
        chat_response = Chat(**chat_doc)

        return func.HttpResponse(
            json.dumps(chat_response.dict()),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.exception("Error in chat function")
        return func.HttpResponse(
            f"Internal Server Error: {str(e)}",
            status_code=500
        )
