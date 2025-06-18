from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

from ..config import AppConfig, get_config

config: AppConfig = get_config()


class CaseDetails(BaseModel):
    title: str = "Case"
    user_id: str = config.env.anonymous_user_id
    status: str = "Open" # Open | Resolved | Aborted
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
        }
        allow_population_by_field_name = True

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
    valid: bool
    legitimate: bool
    case_type: str
    entity: Optional[List[Entity]]
    asset: Optional[List[Asset]]
    document: str
    supporting_documents: Optional[List[str]]
    summary: str
    recommendations: List[str]
    references: Optional[List[str]]

class Case(BaseModel):
    meta: CaseResponse
    summary: CaseSummary