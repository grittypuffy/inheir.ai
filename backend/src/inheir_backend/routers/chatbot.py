from fastapi import APIRouter, HTTPException, Request, UploadFile, Form, File
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
from openai import AzureOpenAI
from ..config import AppConfig
from ..services.rag import search_documents
from ..models.chat import Chat
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from ..services.storage import upload_user_file
from langchain.chains.llm import LLMChain


config: AppConfig = AppConfig()

router = APIRouter(tags=["Chatbot"])

class ChatbotRequest(BaseModel):
    query: str
    context: Optional[str] = None

chatbot_system_template = """
You are a helpful legal assistant that answers a query with relevant law data and worldwide legal regulations, \
policies and laws, if no data or document is provided, answer using \
worldwide policies and laws and publicly available knowledge, especially by trying to understand the nationality behind the query.
to answer based on that country's laws and regulations to maintain fairness.\
Always aim to help the user as best as you can. Keep your responses concise and relevant."""
chatbot_user_template = """\
### Law:
{{ law }}

### Document:
{{ document }}

### Supporting document:
{{ supporting_documents }}

### Query
{{ query }}

Guidelines:
- Use plain English.
- Give generic answers if needed.
"""

chatbot_case_prompt_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(chatbot_system_template),
    HumanMessagePromptTemplate.from_template(chatbot_user_template)
])

chatbot_law_system_template = """\
You are a helpful legal assistant that answers a query with relevant law data \
and worldwide legal regulations, policies and laws. If no data is provided, answer\
using worldwide policies and laws and publicly available knowledge, especially by trying\
to understand the nationality behind the query. \
to answer based on that country's laws and regulations to maintain fairness.\
Always aim to help the user as best as you can. Keep your responses concise and relevant.
"""
chatbot_law_user_template = """\
### Law:
{{ law }}

### Query
{{ query }}

Guidelines:
- Use plain English.
- Give generic answers if needed.
"""

chatbot_law_prompt_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(chatbot_law_system_template),
    HumanMessagePromptTemplate.from_template(chatbot_law_user_template)
])


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
        if document and case_id:
            user_document = await upload_user_file(document, user_id=user_id, case_id=case_id, chat_id=None, case=False)
            document_url = user_document.get("url")
        search_results = search_documents(query)
        search_result_content = """\
If no specific legal documents are available, assume globally recognized principles:\
property can be acquired through inheritance, purchase, or gift.\
Marital property laws often provide spouses rights to jointly owned property\
and protection in case of separation or death. Legal systems vary, but fairness\
and spousal rights are common legal principles.\
"""
        if search_results:
            search_result_content = "\n\n".join(search_results)
        logging.info("Search results content:", search_results)
        if case_id:
            case_summary_collection = config.db["case_summary"]
            case_summary_doc = await case_summary_collection.find_one(
                {"case_id": case_id},
                {"document_content": 1, "supporting_document_content": 1}
            )
            chain = LLMChain(
                llm=client,
                prompt=chatbot_case_prompt_template
            )
            logging.info("Chain:", chain)
            chain_info = {
                "law": search_result_content,
                "document": "No documents provided, use general knowledge",
                "supporting_documents": "No documents provided, use general knowledge",
                "query": query
            }
            if case_summary_doc is not None:
                chain_info = {
                    "law": search_result_content,
                    "document": case_summary_doc.get("document_content") or "No documents provided, use general knowledge",
                    "supporting_documents": case_summary_doc.get("supporting_document_content") or "No documents provided, use general knowledge",
                    "query": query
                }
            logging.info("Chain info:", chain_info)
            response = chain.invoke(chain_info)
            chat_history_doc = {
                "query": {
                    "role": "user",
                    "content": query
                },
                "response": {
                    "role": "bot",
                    "content": response.get("text")
                },
                "case_id": case_id,
                "user_id": user_id,
                "document": document_url
            } 
            chat_insert_result = await config.db["chat_history"].insert_one(chat_history_doc)
            chat_history_doc["chat_id"] = str(chat_insert_result.inserted_id)
            chat_history = Chat(**chat_history_doc)
            return chat_history
        else:
            chain = LLMChain(
                llm=client,
                prompt=chatbot_law_prompt_template
            )
            chain_info = {
                "law": search_result_content,
                "query": query
            }
            response = chain.invoke(chain_info)
            chat_history_doc = {
                "query": {
                    "role": "user",
                    "content": query
                },
                "response": {
                    "role": "bot",
                    "content": response.get("text")
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
        raise HTTPException(status_code=500, detail=str(e)) 