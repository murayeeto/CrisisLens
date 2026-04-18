from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "CrisisLens Backend"}

@router.get("/")
def root():
    """Root endpoint."""
    return {"message": "CrisisLens API v1", "status": "running"}
