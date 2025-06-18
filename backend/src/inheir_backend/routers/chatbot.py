from fastapi import APIRouter, HTTPException
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
    source: str  # "context" or "rag"

@router.post("/chat", response_model=ChatbotResponse)
async def chat(request: ChatbotRequest):
    try:
        # Initialize Azure OpenAI client
        client = AzureOpenAI(
            api_key=config.env.azure_openai_api_key,
            api_version=config.env.azure_openai_api_version,
            azure_endpoint=config.env.azure_openai_endpoint
        )

        if request.context:
            # Context-aware response
            system_message = """You are a helpful assistant that answers questions based on the provided context. 
            If the answer cannot be found in the context, say so. Keep your responses concise and relevant."""
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Context: {request.context}\n\nQuestion: {request.query}"}
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
            # RAG-based response
            # This will be handled by your friend's RAG implementation
            # For now, we'll return a placeholder
            return ChatbotResponse(
                response="RAG-based response",
                source="rag"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 