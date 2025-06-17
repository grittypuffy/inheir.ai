import asyncio
import os
import re
import time
import datetime
from typing import List, Annotated

from fastapi import APIRouter, Response, Request, Cookie
from fastapi.responses import JSONResponse

from ..config import AppConfig, get_config
from ..models.auth import SignInRequest, SignUpRequest, Token
from ..helpers.auth import get_hashed_password, verify_password, sign_jwt, decode_jwt


router = APIRouter(tags=["Authentication"])

config: AppConfig = get_config()


@router.get("/{username}/valid")
async def check_username_availability(username: str):
    try:
        user = await config.db["user"].find_one({"username": username})
        if user:
            return JSONResponse(
                status_code=409,
                content={
                    "status": "failed",
                    "message": "Username is not available",
                    "available": False
                }
            )
        else:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "message": "Username is available",
                    "available": True
                }
            )
    except Exception:
        return JSONResponse(
            status_code=500,
            content={
                "status": "failed",
                "message": "An internal error occured",
                "available": None
            }
        )


@router.post("/sign_up")
async def sign_up(payload: SignUpRequest):
    try:
        user = await config.db["user"].find_one({"username": payload.username})
        if user:
            return JSONResponse(
                status_code=409,
                content={
                    "status": "failed",
                    "message": "User already exists"
                }
            )
        password = get_hashed_password(payload.password)

        try:
            data = SignUpRequest(
                username=payload.username,
                email=payload.email,
                password=password,
                full_name=payload.full_name.title()
            )
        except Exception as e:
            return JSONResponse({
                "status": "failed",
                "message": f"Invalid field details. Error: {e.json()}"
            }, status_code=422)
        user_data = data.__dict__
        await config.db["user"].insert_one(user_data)
        return {
            "status": "success",
            "message": "User successfully created"
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "failed",
                "message": f"Error while creating user {e}"
            },
        )


@router.post("/sign_in")
async def sign_in(payload: SignInRequest, response: Response):
    try:
        user = await config.db["user"].find_one({"username": payload.username})
        if not user:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "failed",
                    "message": "User does not exist on the system",
                },
            )
        valid_password = verify_password(
            payload.password, user.get("password"))
        if not valid_password:
            return JSONResponse(
                status_code=403,
                content={
                    "status": "failed",
                    "message": "Username or password does not match",
                },
            )
        payload = sign_jwt(str(user.get("_id")), payload.username)
        response.set_cookie(
            key="token",
            value=payload[0],
            samesite="none",
            expires=datetime.datetime.now(
                datetime.UTC) + datetime.timedelta(seconds=1800),
            httponly=True,
            secure=True,
        )
        return {
            "status": "success",
            "message": "Authentication successful"
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "failed",
                "message": f"Error while signing in {e}"}
        )


@router.post("/sign_out")
async def sign_out(response: Response):
    try:
        response.delete_cookie(
            "token",
            # domain=config.env.cookie_domain,
            secure=True,
            httponly=True,
            samesite="none"
        )
        response.status_code = 200
        return {"status": "success", "message": "Logged out successfully"}

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "failed",
                "message": f"Error while logging out {e}"
            },
        )