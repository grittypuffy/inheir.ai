from fastapi import APIRouter

from ..auth import router as auth_router
from ..case import router as case_router
from ..gis import router as gis_router
from ..chatbot import router as chatbot_router
from ..chatbot import router as report_router

router = APIRouter()

# Include all your routers here after importing
router.include_router(auth_router, prefix="/auth")
router.include_router(case_router, prefix="/case")
router.include_router(gis_router, prefix="/gis")
router.include_router(chatbot_router, prefix="/chatbot")
router.include_router(report_router, prefix="/report")
