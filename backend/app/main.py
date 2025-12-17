import sys
import asyncio

# CRITICAL FIX for Playwright on Windows: 
# Must set ProactorEventLoopPolicy before ANY other async code or imports that might init a loop.
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router

app = FastAPI(title="SharePoint Insight Engine API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to SharePoint Insight Engine API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
