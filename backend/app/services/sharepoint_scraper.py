import asyncio
from playwright.async_api import async_playwright, Page, BrowserContext
from bs4 import BeautifulSoup
import logging
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SharePointScraper:
    def __init__(self, start_url: str):
        self.start_url = start_url
        self.browser_context: BrowserContext = None
        self.page: Page = None

    async def start_browser(self, headless: bool = False):
        """
        Launches the browser. 
        headless=False allows the user to see the login screen and interact.
        """
        p = await async_playwright().start()
        browser = await p.chromium.launch(headless=headless)
        self.browser_context = await browser.new_context()
        self.page = await self.browser_context.new_page()
        logger.info("Browser launched.")

    async def login_and_wait(self):
        """
        Navigates to the SharePoint URL and waits for the user to complete login.
        It detects login success by checking for a specific element or URL change 
        that indicates the dashboard is loaded.
        """
        if not self.page:
            await self.start_browser(headless=False) # Must be visible for login

        logger.info(f"Navigating to {self.start_url} for login...")
        await self.page.goto(self.start_url)
        
        logger.info("Waiting for user to log in... (Timeout: 5 minutes)")
        # Wait for a common SharePoint specific element that appears after login
        # Adjust selector based on actual page structure, e.g., #O365_MainLink_Settings or the 'waffle' icon
        try:
            # wait up to 300 seconds (5 mins) for user to log in
            logger.info("Waiting for return to SharePoint domain...")
            
            # Wait until we are on a sharepoint.com URL and NOT on login.microsoftonline.com
            # This covers the redirect back from SSO.
            await self.page.wait_for_url(lambda url: "sharepoint.com" in url and "login.microsoftonline.com" not in url, timeout=300000)
            
            # Additional wait to ensure page content is rendering
            await self.page.wait_for_load_state("networkidle")
            logger.info("Login detected! URL is valid and network is idle.")
            
        except Exception as e:
            logger.error(f"Login timed out or failed: {e}")
            raise e

    async def scrape_documents(self) -> List[Dict]:
        """
        Scrapes document links and metadata from the current page.
        """
        logger.info("Scraping documents from current page...")
        content = await self.page.content()
        soup = BeautifulSoup(content, 'lxml')
        
        documents = []
        
        # This is a heuristic - SharePoint file lists are complex.
        # We look for common file patterns or list items.
        # A more robust solution involves inspecting the specific SharePoint list DOM structure.
        
        # Example: finding links that look like file paths
        links = soup.find_all('a')
        for link in links:
            href = link.get('href')
            text = link.get_text(strip=True)
            
            if href and any(href.endswith(ext) for ext in ['.pdf', '.docx', '.xlsx', '.pptx']):
                doc_info = {
                    "title": text,
                    "url": href if href.startswith('http') else f"https://skylineuniversity-my.sharepoint.com{href}",
                    "type": href.split('.')[-1]
                }
                documents.append(doc_info)
                logger.info(f"Found document: {doc_info}")

        return documents

    async def close(self):
        if self.browser_context:
            await self.browser_context.close()
            
async def run_scraper_test():
    url = "https://skylineuniversity-my.sharepoint.com/people?source=waffle" 
    scraper = SharePointScraper(url)
    try:
        await scraper.login_and_wait()
        docs = await scraper.scrape_documents()
        print(f"Scraped {len(docs)} documents.")
    finally:
        await scraper.close()

if __name__ == "__main__":
    asyncio.run(run_scraper_test())
