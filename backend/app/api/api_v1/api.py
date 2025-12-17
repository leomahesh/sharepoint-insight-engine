from fastapi import APIRouter
from app.api.api_v1.endpoints import dashboard, search, documents, sync, config

api_router = APIRouter()
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
