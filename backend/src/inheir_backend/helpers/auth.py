import logging
from ..config import AppConfig
import time
from typing import Dict
import jwt
from passlib.hash import bcrypt
from pydantic import BaseModel

config: AppConfig = AppConfig()


class JwtPayload(BaseModel):
    user_id: str
    username: str
    expires: int


def get_hashed_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, hashed_pass: str) -> bool:
    return bcrypt.verify(password, hashed_pass)


def sign_jwt(user_id: str, username: str):
    try:
        payload = JwtPayload(
            user_id=user_id, username=username, expires=int(time.time() + 3600)
        )
        token = jwt.encode(
            payload.dict(), config.env.jwt_secret, algorithm="HS512")
        return (token, payload.expires)
    except Exception as e:
        logging.error(e)


def decode_jwt(token: str) -> dict:
    try:
        decoded_token = jwt.decode(
            token, config.env.jwt_secret, algorithms=["HS512"])
        return (
            decoded_token if int(decoded_token["expires"]) >= int(
                time.time()) else None
        )
    except Exception as e:
        return None


def verify_jwt(token: str) -> bool:
    if decode_jwt(token):
        return True
    return False