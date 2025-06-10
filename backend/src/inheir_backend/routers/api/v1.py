from fastapi import APIRouter

from ..auth import router as auth_router

router = APIRouter()

# Include all your routers here after importing
router.include_router(auth_router, prefix="/auth")
