from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import os
from config import config
from utils.logger import logger
from routes import health, news, events, auth, users
from test_page import get_test_page_html

app = FastAPI(
    title="CrisisLens API",
    version="0.1.0",
    description="Real-time crisis intelligence dashboard"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS if config.CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(news.router)
app.include_router(events.router)
app.include_router(auth.router)
app.include_router(users.router)

# Test page
@app.get("/test", response_class=HTMLResponse)
def get_test_page():
    """Serve test dashboard HTML page."""
    return get_test_page_html()

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 CrisisLens Backend started")
    logger.info(f"Mock Auth Mode: {config.USE_MOCK_AUTH}")
    logger.info(f"Mock Data Mode: {config.USE_MOCK_DATA}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=config.DEBUG)
