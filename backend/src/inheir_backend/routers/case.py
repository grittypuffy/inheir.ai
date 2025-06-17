from datetime import datetime
from fastapi import APIRouter, Request, UploadFile
from ..config import AppConfig, get_config
from ..models.case import CaseDetails
from typing import Optional, List

router = APIRouter()

config: AppConfig = get_config()

@router.post("/create")
async def create_case(
    req: Request,
    document: UploadFile,
    supporting_documents: List[UploadFile],
    title: Optional[str] = "",
    address: Optional[str] = ""
):
    user_id = req.state.user.get("user_id") or config.env.anonymous_user_id
    case_details_collection = config.db['case_details']
    case_summary_collection = config.db['case_summary']
    date = str(datetime.now())
    case_details = {"user_id": user_id, "title": title or f"Case - {date}"}
    case_details = CaseDetails(**case_details)
    case_inserted_id = await case_details_collection.insert_one(case_details.dict())
    case_inserted_id = case_insert_result.inserted_id

    
    case_summary = CaseSummary(**case_details)
    case_summary_id = await case_summary_collection.insert_one(case_details.dict())
    