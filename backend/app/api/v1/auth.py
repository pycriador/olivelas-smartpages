"""
Authentication Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AuthenticationError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db_engine_info, get_meta_db
from app.models.meta_models import User
from app.schemas.auth import (
    LoginRequest,
    PasswordChangeRequest,
    TokenResponse,
    UserResponse,
)
from app.services.audit_service import AuditService
from app.services.auth_service import authenticate_user, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    req: LoginRequest,
    db: Session = Depends(get_meta_db),
) -> TokenResponse:
    identifier = req.username or req.username_or_email or ""
    user = authenticate_user(db, identifier, req.password)

    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        subject=str(user.id),
        claims={
            "username": user.username,
            "email": user.email,
            "is_superuser": user.is_superuser,
        },
    )

    AuditService.log_request(
        request=request,
        db=db,
        actor_id=user.id,
        actor_email=user.email,
        action="USER_LOGIN",
        resource_type="auth",
        resource_id=str(user.id),
        diff={"username": user.username},
    )

    user_resp = UserResponse.model_validate(user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_resp,
        data={
            "access_token": access_token,
            "user": user_resp.model_dump(),
        },
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
def change_password(
    request: Request,
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    if not verify_password(req.old_password, current_user.hashed_password):
        raise AuthenticationError("Current password is incorrect.")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()

    AuditService.log_request(
        request=request,
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action="CHANGE_PASSWORD",
        resource_type="user",
        resource_id=str(current_user.id),
    )
    return {"success": True, "message": "Password updated successfully."}


@router.get("/system-info")
def get_system_info(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return get_db_engine_info()
