"""
Pydantic v2 Schemas for Authentication and IAM (Admin, Editor, Viewer).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class LoginRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=150)
    username_or_email: Optional[str] = Field(None, min_length=1, max_length=150)
    password: str = Field(..., min_length=4)

    @model_validator(mode="after")
    def validate_identifier(self) -> LoginRequest:
        if not self.username and not self.username_or_email:
            raise ValueError("Either 'username' or 'username_or_email' must be provided.")
        return self


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class GroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(default="", max_length=500)
    role_level: str = Field(default="editor", pattern="^(admin|editor|viewer)$")


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    role_level: Optional[str] = Field(None, pattern="^(admin|editor|viewer)$")


class GroupResponse(GroupBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    full_name: str = Field(default="", max_length=255)
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    group_ids: List[int] = Field(default_factory=list)
    role: Optional[str] = Field(None, pattern="^(admin|editor|viewer)$")


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    group_ids: Optional[List[int]] = None
    role: Optional[str] = Field(None, pattern="^(admin|editor|viewer)$")


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    groups: List[GroupResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    data: Optional[Dict[str, Any]] = None
