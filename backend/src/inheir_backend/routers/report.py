from bson import ObjectId
from pydantic import BaseModel
import json
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from ..config import AppConfig, get_config
from typing import Optional, List
from ..helpers.serializer import serializer
from ..models.report import Report

router = APIRouter(tags=["Reporting"])

config: AppConfig = get_config()

class Reason(BaseModel):
    reason: Optional[str] = None

@router.post("/create")
async def create_report(
    req: Request,
    report: Report
):
    user_id = config.env.anonymous_user_id
    if req.state.user:
        user_id = req.state.user.get("user_id")
    report_collection = config.db['report']
    report_data = report.dict()
    report_data["user_id"] = user_id

    try:
        result = await report_collection.insert_one(report_data)
        return {
            "message": "Report created successfully",
            "report_id": str(result.inserted_id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.get("/all")
async def get_reports(
    req: Request
):
    if not req.state.user:
        raise HTTPException(status_code=404, detail=f"Page Not found")
    user_role = req.state.user.get("role")
    if user_role != "Admin":
        raise HTTPException(status_code=404, detail=f"Not found")   

    report_collection = config.db['report']
    try:
        cursor = report_collection.find({})
        reports = []
        async for report in cursor:
            report = serializer(report)
            report["id"] = report.pop("_id")
            reports.append(report)
        return {
            "message": "Reports retrieved successfully",
            "data": reports
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reports: {str(e)}")

@router.post("/{report_id}/verify")
async def verify_report(report_id: str, req: Request, body: Reason):
    if not req.state.user:
        raise HTTPException(status_code=404, detail="Not found")
    user_role = req.state.user.get("role")    
    if user_role != "Admin":
        raise HTTPException(status_code=404, detail=f"Not found")   

    report_collection = config.db["report"]

    try:
        result = await report_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"verdict": "Verified", "reason": body.reason}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")

        return {
            "message": "Report marked as Verified",
            "report_id": report_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{report_id}/unverify")
async def unverify_report(report_id: str, req: Request, body: Reason):
    if not req.state.user:
        raise HTTPException(status_code=404, detail="Not found")
    user_role = req.state.user.get("role")    
    if user_role != "Admin":
        raise HTTPException(status_code=404, detail="Not found")

    report_collection = config.db["report"]

    try:
        result = await report_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"verdict": "Not Verified", "reason": body.reason}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Report not found")

        return {
            "message": "Report marked as Verified",
            "report_id": report_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{report_id}")
async def get_report(report_id: str, req: Request):
    if not req.state.user:
        raise HTTPException(status_code=404, detail="Not found")
    
    if not req.state.user.get("role") != "Admin":
        raise HTTPException(status_code=404, detail="Not found")

    report_collection = config.db["report"]

    try:
        report = await report_collection.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        return {
            "message": "Report retrieved successfully",
            "data": serializer(report)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")