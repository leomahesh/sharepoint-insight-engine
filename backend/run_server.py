import uvicorn
import sys
import asyncio

if __name__ == "__main__":
    # Force WindowsProactorEventLoopPolicy to support Playwright subprocesses
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    print("Starting SharePoint Assistant Backend with ProactorEventLoop...")
    # reload=False is safer for Windows Event Loop issues with Playwright
    # loop="asyncio" is CRITICAL to ensure it uses the ProactorEventLoopPolicy we set above
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False, loop="asyncio")
