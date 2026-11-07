"""
Authentication, First-User Global Admin Registration & Platform Configuration Endpoints for Olivelas SmartPages.
"""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AuthenticationError, ConflictError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db_engine_info, get_meta_db
from app.models.meta_models import Group, PlatformSetting, PlatformTheme, Project, User
from app.schemas.auth import (
    LoginRequest,
    PasswordChangeRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.audit_service import AuditService
from app.services.auth_service import authenticate_user, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/bootstrap-status")
def get_bootstrap_status(db: Session = Depends(get_meta_db)) -> Dict[str, Any]:
    """
    Returns platform bootstrap state:
    - Whether any users exist yet (`has_users`, `user_count`)
    - Whether the next user registration will automatically become Global Admin (`next_user_will_be_global_admin`)
    - Platform settings (`opspages_platform_settings`) and themes (`opspages_themes`)
    """
    user_count = db.query(User).count()
    project_count = db.query(Project).count()

    settings_rows = db.query(PlatformSetting).all()
    settings_map = {row.key: row.get_value() for row in settings_rows}

    theme_rows = db.query(PlatformTheme).order_by(PlatformTheme.sort_order.asc()).all()
    themes_list = [
        {
            "id": t.id,
            "name": t.name,
            "type": t.type,
            "is_dark": t.is_dark,
            "primary_color": t.primary_color,
            "primary_hover": t.primary_hover,
            "primary_active": t.primary_active,
            "bg_layout": t.bg_layout,
            "bg_container": t.bg_container,
            "bg_sidebar": t.bg_sidebar,
            "bg_header": t.bg_header,
            "color_text": t.color_text,
            "color_border": t.color_border,
            "badge_tag": t.badge_tag,
            "is_default": t.is_default,
            "sort_order": t.sort_order,
        }
        for t in theme_rows
    ]

    return {
        "has_users": user_count > 0,
        "user_count": user_count,
        "project_count": project_count,
        "next_user_will_be_global_admin": user_count == 0,
        "schema": settings.DB_SCHEMA,
        "settings": settings_map,
        "themes": themes_list,
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    req: RegisterRequest,
    db: Session = Depends(get_meta_db),
) -> TokenResponse:
    """
    Registers a new user on the platform.
    Rule: The very first user registered when `opspages_users` is empty is automatically
    promoted to Global Admin (`is_superuser = True`, member of `Platform Admins`).
    """
    clean_email = req.email.strip().lower()
    if "@" not in clean_email:
        raise ConflictError("E-mail inválido.")

    clean_username = (req.username or clean_email.split("@")[0]).strip().lower()

    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        raise ConflictError(f"Já existe um usuário cadastrado com o e-mail '{clean_email}'.")

    existing_username = db.query(User).filter(User.username == clean_username).first()
    if existing_username:
        clean_username = f"{clean_username}_{db.query(User).count() + 1}"

    existing_count = db.query(User).count()
    is_first_user = existing_count == 0

    new_user = User(
        username=clean_username,
        email=clean_email,
        full_name=(req.full_name or clean_username).strip(),
        hashed_password=hash_password(req.password),
        is_active=True,
        is_superuser=is_first_user,
    )

    target_role = "admin" if is_first_user else "viewer"
    target_group = db.query(Group).filter(Group.role_level == target_role).first()
    if target_group:
        new_user.groups = [target_group]

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log_request(
        request=request,
        db=db,
        actor_id=new_user.id,
        actor_email=new_user.email,
        action="BOOTSTRAP_GLOBAL_ADMIN" if is_first_user else "USER_REGISTER",
        resource_type="user",
        resource_id=str(new_user.id),
        diff={
            "username": new_user.username,
            "email": new_user.email,
            "is_superuser": new_user.is_superuser,
            "role": "Global Admin (First Registration)" if is_first_user else target_role,
        },
    )

    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        subject=str(new_user.id),
        claims={
            "username": new_user.username,
            "email": new_user.email,
            "is_superuser": new_user.is_superuser,
        },
    )

    user_resp = UserResponse.model_validate(new_user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        is_first_user_global_admin=is_first_user,
        user=user_resp,
        data={
            "access_token": access_token,
            "is_first_user_global_admin": is_first_user,
            "user": user_resp.model_dump(),
        },
    )


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    req: LoginRequest,
    db: Session = Depends(get_meta_db),
) -> TokenResponse:
    identifier = req.username or req.username_or_email or req.email or ""
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
    old_pwd = req.old_password or req.current_password or ""
    if not verify_password(old_pwd, current_user.hashed_password):
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


@router.get("/platform-config")
def get_platform_config(db: Session = Depends(get_meta_db)) -> Dict[str, Any]:
    """Returns platform settings and themes from the database."""
    return get_bootstrap_status(db)


@router.put("/platform-config")
def update_platform_config(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    """Updates user personalization preferences and (if superuser) platform-wide settings."""
    if "preferred_theme" in payload and payload["preferred_theme"]:
        current_user.preferred_theme = str(payload["preferred_theme"])
    if "preferred_language" in payload and payload["preferred_language"]:
        current_user.preferred_language = str(payload["preferred_language"])

    if current_user.is_superuser and isinstance(payload.get("settings"), dict):
        for key, val in payload["settings"].items():
            row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
            if row and isinstance(val, dict):
                merged = {**row.get_value(), **val}
                row.set_value(merged)

    db.commit()
    return get_bootstrap_status(db)


@router.get("/system-info")
def get_system_info(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return get_db_engine_info()
