from pydantic import BaseModel
from typing import Optional
from typing import Literal


class ChatData(BaseModel):
    role: Literal["user", "bot", "system"]
    content: str


class Chat(BaseModel):
    chat_id: str
    user_id: str
    case_id: Optional[str]
    query: ChatData
    response: ChatData
    document: Optional[str]