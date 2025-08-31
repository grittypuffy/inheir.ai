from fastapi import APIRouter, HTTPException, Request, UploadFile, Form, File
from pydantic import BaseModel
from typing import Optional
import logging
from openai import AzureOpenAI
from ..config import AppConfig
from ..services.rag import search_documents
from ..models.chat import Chat
from langchain.prompts import ChatPromptTemplate
from langchain.chains.llm import LLMChain
from langchain_core.output_parsers import StrOutputParser
from operator import itemgetter
from ..services.storage import upload_user_file

config: AppConfig = AppConfig()

router = APIRouter(tags=["Chatbot"])


chatbot_case_template = """\
You are a legal assistant analyzing a legal case document to answer a user query.

Context:
{chunk}

User query:
{query}

Answer in plain English with clear reasoning.
"""

chatbot_law_template = """\
You are a helpful legal assistant that answers a query with relevant law data \
and worldwide legal regulations, policies and laws. If no data is provided, answer \
using publicly available knowledge, especially by trying to understand the nationality behind the query \
to answer based on that country's laws and regulations to maintain fairness. \
Always aim to help the user as best as you can. Keep your responses concise and relevant.

Here's the query:
{{ query }}

Guidelines:
- Use plain English.
- Give generic answers if needed.
"""

chatbot_case_prompt_template = ChatPromptTemplate.from_template(chatbot_case_template)
chatbot_law_prompt_template = ChatPromptTemplate.from_template(chatbot_law_template)

def chunk_text(text: str, max_chunk_size: int = 1000):
    return [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]

@router.post("/chat", response_model=Chat)
async def chat(
    req: Request,
    document: Optional[UploadFile] = File(default=None),
    query: str = Form(...),
    case_id: Optional[str] = Form(None),
):
    user_id = config.env.anonymous_user_id 
    if req.state.user:
        user_id = req.state.user.get("user_id")

    try:
        client = config.langchain_llm
        document_url = None

        # Handle uploaded document
        if document and case_id:
            user_document = await upload_user_file(document, user_id=user_id, case_id=case_id, chat_id=None, case=False)
            document_url = user_document.get("url")

        search_results = search_documents(query)
        logging.info(f"Search results content: {search_results}")

        # If case_id is present, fetch and chunk the case content
        if case_id:
            case_summary_collection = config.db["case_summary"]
            case_summary_doc = await case_summary_collection.find_one(
                {"case_id": case_id},
                {"document_content": 1, "supporting_document_content": 1}
            )

            output_parser = StrOutputParser()
            rag_prompt = ChatPromptTemplate.from_template(chatbot_case_template)

            response_chunks = []
            if case_summary_doc:
                combined_doc = (case_summary_doc.get("document_content") or "") + "\n" + \
                               (case_summary_doc.get("supporting_document_content") or "")
                chunks = chunk_text(combined_doc)

                for chunk in chunks:
                    rag_chain = (
                        {
                            "chunk": itemgetter("chunk"),
                            "query": itemgetter("query"),
                        }
                        | rag_prompt
                        | client
                        | output_parser
                    )
                    result = rag_chain.invoke({"chunk": chunk, "query": query})
                    response_chunks.append(result)

            final_response = "\n\n".join(response_chunks) if response_chunks else "No relevant case information found."

        else:
            chain = LLMChain(
                llm=client,
                prompt=chatbot_law_prompt_template
            )
            result = chain.invoke({"query": query})
            final_response = result.get("text", "No response generated.")

        chat_history_doc = {
            "query": {
                "role": "user",
                "content": query
            },
            "response": {
                "role": "bot",
                "content": final_response
            },
            "case_id": case_id,
            "user_id": user_id,
            "document": document_url
        }
        chat_insert_result = await config.db["chat_history"].insert_one(chat_history_doc)
        chat_history_doc["chat_id"] = str(chat_insert_result.inserted_id)
        chat_history = Chat(**chat_history_doc)

        return chat_history

    except Exception as e:
        logging.exception("Error occurred in /chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))
