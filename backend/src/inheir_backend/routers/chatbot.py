from fastapi import APIRouter, HTTPException, Request, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import os
from openai import AzureOpenAI
from ..config import AppConfig
from ..services.rag import search_documents


config: AppConfig = AppConfig()

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatbotRequest(BaseModel):
    query: str
    context: Optional[str] = None

class ChatbotResponse(BaseModel):
    response: str
    source: str # Can be "context" or "rag"

chatbot_system_template = """You are a helpful assistant that answers questions based on provided legal documents, provided legal and supporting documents with relevant law data, if no relevant data say so. Keep your responses concise and relevant."""
chatbot_user_template = """\
### Law:
{{{{ law }}}}

### Document:
{{{{ document }}}}

### Supporting document:
{{{{ supporting_documents }}}}

Guidelines:
- Use plain English.
"""

chatbot_case_prompt_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(chatbot_system_template),
    HumanMessagePromptTemplate.from_template(chatbot_user_template)
])

chatbot_law_system_template = """You are a helpful assistant that answers questions based on provided law data, if no relevant data say so. Keep your responses concise and relevant."""
chatbot_law_user_template = """\
### Law:
{{{{ law }}}}

Guidelines:
- Use plain English.
"""

chatbot_law_prompt_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(chatbot_law_system_template),
    HumanMessagePromptTemplate.from_template(chatbot_law_user_template)
])


@router.post("/chat", response_model=ChatbotResponse)
async def chat(
    req: Request,
    document: Optional[UploadFile],
    query: str,
    case_id: Optional[str] = None,
    context: Optional[str] = None
):
    user_id = config.env.anonymous_user_id
    if req.state.user:
        user_id = req.state.user.get("user_id")

    try:
        client = config.llm

        if context:            
            messages = [
                {"role": "system", "content": chatbot_system_template},
                {"role": "user", "content": f"Context: {context}\n\nQuestion: {request.query}"}
            ]

            response = client.chat.completions.create(
                model=config.env.azure_openai_deployment,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )
            chat_history_doc = {
                "query": {
                    "role": user,
                    "content": query
                },
                "response": {
                    "role": "bot",
                    "content": response.choices[0].messages.content
                },
                "case_id": case_id,
                "user_id": user_id
            } 

            chat_insert_result = await config.db["chat_history"].insert_one(chat_history_doc)
            return ChatbotResponse(
                response=response.choices[0].message.content,
                source="context"
            )

        else:
            search_results = search_documents(query)
            search_result_content = "\n\n".join(search_results)
            langchain_client = config.langchain_llm
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
                chain_info = {
                    "law": search_result_content,
                    "document": "",
                    "supporting_documents": ""
                }
                if case_summary_doc is not None:
                    chain_info = {
                        "law": search_result_content,
                        "document": case_summary_doc.get("document_content") or "",
                        "supporting_documents": case_summary_doc.get("supporting_document_content") or ""
                    }

                response = chain.invoke(chain_info)
                chat_history_doc = {
                    "query": {
                        "role": user,
                        "content": query
                    },
                    "response": {
                        "role": "bot",
                        "content": response.get("text")
                    },
                    "case_id": case_id,
                    "user_id": user_id
                } 
                chat_insert_result = await config.db["chat_history"].insert_one(chat_history_doc)

                return ChatbotResponse(
                    response=response,
                    source="rag"
                )
            else:
                chain - LLMChain(
                    llm=client,
                    prompt=chatbot_law_prompt_template
                )
                chain_info = {
                    "law": search_result_content
                }
                response = chain.invoke(chain_info)
                chat_history_doc = {
                    "query": {
                        "role": user,
                        "content": query
                    },
                    "response": {
                        "role": "bot",
                        "content": response.get("text")
                    },
                    "case_id": case_id,
                    "user_id": user_id
                } 
                chat_insert_result = await config.db["chat_history"].insert_one(chat_history_doc)
                return ChatbotResponse(
                    response=response,
                    source="rag"                
                )
            

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 