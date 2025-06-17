from pydantic import BaseModel
from bson import ObjectId
from typing import Optional, List

from ..config import AppConfig, get_config

config: AppConfig = get_config()


class CaseDetails(BaseModel):
    title: str = "Case"
    user_id: str = config.env.anonymous_user_id
    status: str = "Open" # Open | Resolved | Aborted


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