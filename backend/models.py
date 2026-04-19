from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class NewsArticle(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_name: str
    source_uri: Optional[str] = None
    published_at: str
    url: str
    content: Optional[str] = None
    language: Optional[str] = None
    event_uri: Optional[str] = None
    event_key: Optional[str] = None
    duplicate_of: Optional[str] = None
    is_duplicate: Optional[bool] = None
    social_score: Optional[float] = None
    categories: List[str] = Field(default_factory=list)
    concepts: List[str] = Field(default_factory=list)

class Location(BaseModel):
    name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    region: Optional[str] = None

class AIAnalysis(BaseModel):
    summary: str
    category: str
    severity: str  # critical, high, medium, low, info
    affected_groups: List[str]
    impact_analysis: str
    how_to_help: str
    watch_guidance: str

class Event(BaseModel):
    id: str
    title: str
    description: str
    image_url: Optional[str] = None
    location: Location
    source_articles: List[NewsArticle]
    ai_analysis: Optional[AIAnalysis] = None
    created_at: datetime
    updated_at: datetime

class SavedEvent(BaseModel):
    event_id: str
    user_id: str
    saved_at: datetime

class User(BaseModel):
    id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    firebase_uid: Optional[str] = None

class AuthUser(BaseModel):
    user_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None
