import os
import io
import logging
from typing import List, Dict, Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

logger = logging.getLogger(__name__)

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'

class GoogleDriveService:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.creds = None
        self.service = None
        self.token_path = os.path.join(self.base_dir, TOKEN_FILE)
        self.creds_path = os.path.join(self.base_dir, CREDENTIALS_FILE)

    def is_authenticated(self) -> bool:
        """Check if we have valid credentials or a refreshable token."""
        if os.path.exists(self.token_path):
            try:
                creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
                return creds.valid or (creds.expired and creds.refresh_token)
            except Exception:
                return False
        return False

    def authenticate(self) -> bool:
        """
        Authenticate with Google Drive API.
        This triggers a local browser flow if credentials are not valid.
        Returns True if successful.
        """
        creds = None
        
        if os.path.exists(self.token_path):
            try:
                creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            except Exception as e:
                logger.error(f"Error loading token: {e}")
                creds = None

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    logger.warning(f"Failed to refresh token: {e}")
                    creds = None
            
            if not creds:
                if not os.path.exists(self.creds_path):
                    logger.error(f"Credentials file not found at {self.creds_path}")
                    raise FileNotFoundError(f"Credentials file not found at {self.creds_path}. Please place 'credentials.json' in the backend directory.")
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(self.creds_path, SCOPES)
                    # run_local_server will open a browser window
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    logger.error(f"Failed OAuth flow: {e}")
                    raise e
            
            # Save the credentials for the next run
            try:
                with open(self.token_path, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                logger.error(f"Failed to save token: {e}")

        self.creds = creds
        self.service = build('drive', 'v3', credentials=creds)
        logger.info("Google Drive Service authenticated successfully.")
        return True

    def list_files(self, folder_id: str = None, page_size: int = 100) -> List[Dict]:
        """
        List files in a specific folder. 
        If folder_id is None, lists from 'root'.
        """
        if not self.service:
            self.authenticate()
        
        # 'root' is the alias for the top-level folder in My Drive
        target_folder = folder_id if folder_id else 'root'
        
        # Query: Not trashed AND parent is target_folder
        query = f"'{target_folder}' in parents and trashed = false"
        
        try:
            results = self.service.files().list(
                q=query,
                pageSize=page_size,
                fields="nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)",
                orderBy="folder, name"
            ).execute()
            items = results.get('files', [])
            return items
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            raise e

    def download_file(self, file_id: str, file_name: str, destination_folder: str) -> str:
        """
        Download a file from Drive to a local destination folder.
        Returns the absolute path of the downloaded file.
        """
        if not self.service:
            self.authenticate()

        try:
            request = self.service.files().get_media(fileId=file_id)
            
            # Ensure destination exists
            if not os.path.exists(destination_folder):
                os.makedirs(destination_folder, exist_ok=True)
                
            file_path = os.path.join(destination_folder, file_name)
            
            # Handle duplicate names if necessary (overwrite for now)
            fh = io.FileIO(file_path, 'wb')
            downloader = MediaIoBaseDownload(fh, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
                # logger.info(f"Download {int(status.progress() * 100)}%.")
            
            logger.info(f"Downloaded {file_name} to {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Error downloading file {file_id}: {e}")
            raise e
