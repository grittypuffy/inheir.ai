from fastapi import APIRouter, HTTPException, Request, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import os
from openai import AzureOpenAI
from ..config import AppConfig

config: AppConfig = AppConfig()

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatbotRequest(BaseModel):
    query: str
    context: Optional[str] = None

class ChatbotResponse(BaseModel):
    response: str
    source: str
    # Can be "context" or "rag"

@router.post("/chat", response_model=ChatbotResponse)
async def chat(
    req: Request,
    document: Optional[UploadFile],
    query: str,
    context: Optional[str] = None
):
    try:
        client = config.llm

        if context:
            system_message = """You are a helpful assistant that answers questions based on the provided context. 
            If the answer cannot be found in the context, say so. Keep your responses concise and relevant."""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Context: {context}\n\nQuestion: {request.query}"}
            ]

            response = client.chat.completions.create(
                model=config.env.azure_openai_deployment,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )

            return ChatbotResponse(
                response=response.choices[0].message.content,
                source="context"
            )
        else:
            return ChatbotResponse(
                response="RAG-based response",
                source="rag"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 