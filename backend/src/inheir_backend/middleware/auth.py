import jwt
from typing import Dict, Optional, Callable
from ..config import AppConfig
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

config = AppConfig()


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Response]
    ) -> Response:
        if not (
            request.url.path.startswith("/docs")
            or request.url.path.startswith("/openapi.json")
            or request.url.path.startswith("/api/v1/auth")
        ):
            token: Optional[str] = request.cookies.get("token")
            if token is not None:
                try:
                    payload = jwt.decode(
                        token, config.env.jwt_secret, algorithms=["HS512"])
                    request.state.user = payload
                    response = await call_next(request)
                    return response

                except jwt.ExpiredSignatureError:
                    request.state.user = None
                    return JSONResponse(
                        status_code=401, content={"status": "failed", "message": "JWT token has expired"})

                except jwt.PyJWTError:
                    request.state.user = None
                    return JSONResponse(
                        status_code=401, content={"status": "failed", "message": "JWT token is invalid"})

            request.state.user = None
            response = await call_next(request)
            return response
        request.state.user = None
        response = await call_next(request)
        return response