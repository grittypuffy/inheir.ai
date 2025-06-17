from fastapi import APIRouter

from ..auth import router as auth_router
from ..case import router as case_router

router = APIRouter()

# Include all your routers here after importing
router.include_router(auth_router, prefix="/auth")
router.include_router(case_router, prefix="/case")