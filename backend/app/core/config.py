from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SharePoint Insight Engine"
    API_V1_STR: str = "/api/v1"
    
    # Azure AD / SharePoint Configuration
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    SHAREPOINT_SITE_URL: str = "https://skylineuniversity-my.sharepoint.com/people?source=waffle"
    
    # AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None # Keeping for backward compat if needed, but prioritizing Gemini

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
