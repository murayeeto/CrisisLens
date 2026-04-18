from fastapi import APIRouter, Header, HTTPException
from models import AuthUser
from services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/me")
def get_current_user(authorization: str = Header(None)) -> AuthUser:
    """Get current authenticated user."""
    if not authorization:
        # For mock auth mode, return mock user
        user = auth_service.get_current_user(None)
    else:
        user = auth_service.get_current_user(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return user
