from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from typing import Optional, List
from datetime import datetime
from ..models.chat import Chat
from ..config import AppConfig, get_config

config: AppConfig = get_config()


class CaseDetails(BaseModel):
    title: str = "Case"
    user_id: str = config.env.anonymous_user_id
    status: str = "Open" # Open | Resolved | Aborted
    created_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={
            datetime: lambda dt: dt.isoformat(),
        },
    )
    """
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
        }
        allow_population_by_field_name = True
    """

class CaseResponse(BaseModel):
    case_id: str
    title: str
    status: str
    created_at: str


class CaseMetaResponse(BaseModel):
    cases: List[CaseResponse]
    status: str = "success"
    success: str = True
    reason: Optional[str] = None


class ChatMetaResponse(BaseModel):
    chats: List[Chat]
    status: str = "success"
    success: str = True
    reason: Optional[str] = None


class Entity(BaseModel):
    name: str
    entity_type: str
    valid: bool


class Asset(BaseModel):
    name: str
    location: str | None
    asset_type: str
    net_worth: str | None
    coordinates: str | None

class CaseSummary(BaseModel):
    case_id: str
    valid: bool = False
    legitimate: bool = False
    case_type: str = "Dispute"
    entity: Optional[List[Entity]]
    asset: Optional[List[Asset]]
    document: str
    supporting_documents: Optional[List[str]]
    document_content: str
    supporting_document_content: str
    summary: str = ""
    recommendations: List[str] = [""]
    references: Optional[List[str]]
    remarks: Optional[str] = None


class Case(BaseModel):
    meta: CaseResponse
    summary: CaseSummary


class Remarks(BaseModel):
    remarks: Optional[str] = None