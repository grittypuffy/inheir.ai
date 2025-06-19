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
