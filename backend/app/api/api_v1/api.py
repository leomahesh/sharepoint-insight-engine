from app.api.api_v1.endpoints import dashboard, search, documents, sync, config, studio, status, notebook, drive, folders

api_router = APIRouter()
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
api_router.include_router(studio.router, prefix="/studio", tags=["studio"])
api_router.include_router(status.router, prefix="/ingestion", tags=["ingestion"])
api_router.include_router(notebook.router, prefix="/notebook", tags=["notebook"])
api_router.include_router(drive.router, prefix="/drive", tags=["drive"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
