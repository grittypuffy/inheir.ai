import json
from datetime import datetime
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from ..config import AppConfig, get_config
from typing import Optional, List
from ..helpers.serializer import serializer

router = APIRouter(tags=["Reporting"])

config: AppConfig = get_config()


@router.post("/create")
async def create_report(
    req: Request,
):
    user_id = req.state.user.get("user_id") or config.env.anonymous_user_id
    report_collection = config.db['report']
    date = str(datetime.now())
    case_details = {"user_id": user_id, "title": title or f"Case - {date}"}
    case_details = CaseDetails(**case_details)
    case_insert_result = await case_details_collection.insert_one(case_details.dict())
    case_id = case_insert_result.inserted_id
    case_id = str(case_inserted_id)



@router.get("/", response_model=CaseMetaResponse)
async def get_cases(req: Request):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        cursor = case_details_collection.find(
            {"user_id": user_id},
            {"_id": 1, "title": 1, "status": 1, "created_at": 1}
        ).sort("created_at", -1)
        cases = []
        async for doc in cursor:
            doc["_id"] = serializer(doc) 
            doc["case_id"] = doc.pop("_id")
            doc["created_at"] = str(doc["created_at"])
            cases.append(CaseResponse(**doc))
        cases_dict = {"cases": cases}
        case_response = CaseMetaResponse(**cases_dict)
        return JSONResponse(
            status_code=200,
            content={
                "cases": cases
            }
        )
        
@router.get("/{case_id}", response_model=Case)
async def get_summary(req: Request, case_id: str):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        case_summary_collection = config.db['case_summary']
        case_doc = await case_details_collection.find_one(
            {"user_id": user_id, "case_id": case_id},
            {"title": 1, "status": 1, "created_at": 1}
        )
        case_doc["created_at"] = str(case_doc["created_at"])
        case_summary_doc = await case_summary_collection.find_one(
            {"case_id": case_id}
        )
        case_summary_doc.pop("_id")
        case_meta_dict = CaseResponse(**case_doc)
        case_summary_dict = CaseSummary(**case_summary_doc)
        case_dict = {
            "meta": case_meta_dict,
            "summary": case_summary_dict           
        }
        case_response = Case(**case_dict)
        return JSONResponse(
            status_code=200,
            content=case_response
        )

@router.post("/{case_id}/resolve")
async def resolve_case(req: Request, case_id: str, remarks: Remarks):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        case_doc = await case_details_collection.find_one_and_update(
            {"user_id": user_id, "case_id": case_id},
            { "$set": { "status": "Resolved" } }
        )

        case_summary_collection = config.db['case_summary']
        case_summary_doc = await case_summary_collection.find_one_and_update(
            {"case_id": case_id},
            {"$set": {"remarks": remarks}}
        )

        return JSONResponse(
            status_code=200
        )


@router.post("/{case_id}/abort")
async def abort_case(req: Request, case_id: str, remarks: Remarks):
    user_id = req.state.user.get("user_id")
    if not user_id:
        return JSONResponse(
            status_code=401,
            content={
                "status": "failed",
                "success": False,
                "reason": "Please sign in."
            }
        )
    else:
        case_details_collection = config.db["case_details"]
        case_doc = await case_details_collection.find_one_and_update(
            {"user_id": user_id, "case_id": case_id},
            { "$set": { "status": "Aborted" } }
        )
        case_summary_collection = config.db['case_summary']
        case_summary_doc = await case_summary_collection.find_one_and_update(
            {"case_id": case_id},
            {"$set": {"remarks": remarks}}
        )

        return JSONResponse(
            status_code=200
        )
