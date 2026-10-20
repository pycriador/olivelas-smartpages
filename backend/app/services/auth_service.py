"""
Authentication and Authorization Service with FastAPI Dependencies.
Supports JWT Bearer authentication and API Key (`opsp_...`) header validation.
"""
from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Callable, Optional
from fastapi import Depends, Path, Query, Request
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AuthenticationError, AuthorizationError, NotFoundError
from app.core.security import decode_access_token, hash_api_key, verify_password
from app.db.session import get_meta_db
from app.models.meta_models import ApiToken, Project, ProjectPermission, User
from app.services.hbac_service import HBACService

logger = logging.getLogger("aiops.opspages.auth")

security_scheme = HTTPBearer(
    scheme_name="HTTPBearer",
    auto_error=False,
    description="JWT Bearer Token (`Authorization: Bearer <token>` or `Bearer <opsp_deploy_...>`)",
)

api_key_header = APIKeyHeader(
    name="apikey",
    scheme_name="apikey",
    auto_error=False,
    description="OpsPages API Key (`apikey: opsp_deploy_...` or `opsp_service_...`)",
)
x_api_key_header = APIKeyHeader(
    name="x-api-key",
    scheme_name="x-api-key",
    auto_error=False,
    description="OpsPages API Key alternative header (`x-api-key: opsp_deploy_...`)",
)


def invalidate_auth_cache(project_id: Optional[int] = None) -> None:
    """Compatibility hook for cache invalidation."""
    return None


def authenticate_user(db: Session, username_or_email: str, password: str) -> User:
    """Validates user credentials against the meta database."""
    identifier = username_or_email.strip()
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user:
        logger.warning(f"Auth fail: user '{identifier}' not found.")
        raise AuthenticationError("Invalid username or password.")
    if not user.is_active:
        logger.warning(f"Auth fail: user '{user.username}' is disabled.")
        raise AuthorizationError("User account is disabled.")

    if not verify_password(password, user.hashed_password):
        # Allow bootstrap superadmin to authenticate if password matches .env configuration
        if (
            user.is_superuser
            and user.email.lower() == settings.DEFAULT_SUPERADMIN_EMAIL.strip().lower()
            and password in settings.valid_superadmin_passwords
        ):
            return user
        logger.warning(f"Auth fail: invalid password for '{user.username}'.")
        raise AuthenticationError("Invalid username or password.")

    return user


def _resolve_api_token_user(db: Session, raw_key: str) -> User:
    """Resolves a synthetic or creator User context from an `opsp_` API Token."""
    key_hash = hash_api_key(raw_key)
    api_token = db.query(ApiToken).filter(
        ApiToken.key_hash == key_hash,
        ApiToken.is_active.is_(True),
    ).first()

    if not api_token:
        raise AuthenticationError("Invalid or revoked API key.")

    now = datetime.now(timezone.utc)
    if api_token.expires_at:
        exp = api_token.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            raise AuthenticationError("API token has expired.")

    api_token.last_used_at = now
    db.commit()

    # Map token_type to role on its target project
    token_role_map = {
        "service": "admin",
        "deploy": "editor",
        "read": "viewer",
    }
    mapped_role = token_role_map.get(api_token.token_type, "viewer")

    synthetic_user = User(
        id=api_token.created_by or 0,
        username=f"token:{api_token.name}",
        email=f"token-{api_token.token_prefix}@opspages.loft.local",
        hashed_password="",
        full_name=f"API Token ({api_token.name})",
        is_active=True,
        is_superuser=False,
    )
    synthetic_user.groups = []
    synthetic_user.permissions = [
        ProjectPermission(
            id=0,
            project_id=api_token.project_id,
            user_id=synthetic_user.id,
            role=mapped_role,
        )
    ]
    return synthetic_user


def _extract_raw_header_token(request: Request) -> Optional[str]:
    """
    Extracts token strictly from HTTP headers (Authorization, apikey, x-api-key).
    Explicitly rejects tokens passed via URL query string (?token=) per P-8.
    """
    if "token" in request.query_params or "access_token" in request.query_params or "api_key" in request.query_params:
        raise AuthenticationError(
            "Passing authentication tokens in the URL query string (?token=) is forbidden for security reasons (P-8). "
            "Send credentials exclusively via the Authorization, apikey, or x-api-key HTTP header."
        )

    auth_header = (request.headers.get("authorization") or "").strip()
    if auth_header:
        parts = auth_header.split(None, 1)
        if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1].strip():
            return parts[1].strip()
        if len(parts) == 1 and parts[0].startswith("opsp_"):
            return parts[0].strip()

    for header_name in ("apikey", "x-api-key"):
        val = (request.headers.get(header_name) or "").strip()
        if val:
            return val

    return None


def _resolve_user_from_raw_token(db: Session, raw_token: str) -> User:
    if raw_token.startswith("opsp_"):
        return _resolve_api_token_user(db, raw_token)

    payload = decode_access_token(raw_token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive.")

    return user


def resolve_optional_user_from_request(request: Request, db: Session) -> Optional[User]:
    """
    Resolves an authenticated user from request headers if provided.
    Still raises AuthenticationError if ?token= is passed in the query string (P-8),
    or if an invalid header token is supplied. Returns None if no auth header is present.
    """
    raw_token = _extract_raw_header_token(request)
    if not raw_token:
        return None
    return _resolve_user_from_raw_token(db, raw_token)


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    apikey: Optional[str] = Depends(api_key_header),
    x_api_key: Optional[str] = Depends(x_api_key_header),
    db: Session = Depends(get_meta_db),
) -> User:
    """
    Resolves the authenticated User strictly from HTTP headers:
    1. Authorization: Bearer <jwt_or_api_key>
    2. apikey / x-api-key header: opsp_...
    Note: Passing ?token= in URL query parameters is strictly rejected with 401 (P-8).
    """
    if "token" in request.query_params or "access_token" in request.query_params or "api_key" in request.query_params:
        raise AuthenticationError(
            "Passing authentication tokens in the URL query string (?token=) is forbidden for security reasons (P-8). "
            "Send credentials exclusively via the Authorization, apikey, or x-api-key HTTP header."
        )

    raw_token = None
    if credentials and credentials.credentials:
        raw_token = credentials.credentials.strip()
    elif apikey:
        raw_token = apikey.strip()
    elif x_api_key:
        raw_token = x_api_key.strip()
    else:
        raw_token = _extract_raw_header_token(request)

    if not raw_token:
        raise AuthenticationError("Authentication credentials were not provided.")

    return _resolve_user_from_raw_token(db, raw_token)


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    """Requires platform superuser or Platform Admins group membership."""
    if current_user.is_superuser:
        return current_user
    for g in current_user.groups:
        if g.role_level == "admin":
            return current_user
    raise AuthorizationError("Superuser or Platform Admin privileges required.")


def require_project_role(required_role: str = "viewer") -> Callable:
    """
    FastAPI dependency factory that resolves a project by ID or slug and verifies
    that the current user has at least `required_role` ('admin', 'editor', 'viewer').
    """

    def dependency(
        project_id: int = Path(..., description="Target Project ID"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_meta_db),
    ) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise NotFoundError(f"Project with ID {project_id} not found.")

        has_access = HBACService.has_project_access(
            user=current_user,
            project_id=project.id,
            required_role=required_role,
            created_by=project.created_by,
        )
        if not has_access:
            raise AuthorizationError(
                f"Insufficient permissions on project '{project.slug}'. Required role: '{required_role}'."
            )
        return project

    return dependency
