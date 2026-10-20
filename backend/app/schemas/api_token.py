"""
Pydantic v2 Schemas for API Tokens.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TokenCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    token_type: str = Field(default="deploy", pattern="^(deploy|service|read|preview)$")
    scopes: str = Field(default="read,deploy", max_length=255)
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)


class TokenResponse(BaseModel):
    id: int
    project_id: int
    name: str
    token_prefix: str
    key_prefix: Optional[str] = None
    token_type: str
    scopes: str
    is_active: bool = True
    expires_at: Optional[datetime] = None
    created_at: datetime
    last_used_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class TokenCreatedResponse(TokenResponse):
    """Returned ONLY upon token creation. Displays the secret once."""

    secret_key: str
    raw_secret: str = ""
