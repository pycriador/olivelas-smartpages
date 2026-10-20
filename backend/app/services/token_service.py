"""
API Token Service for AIOps OpsPages.
Manages creation, listing, and revocation of project-scoped API keys (deploy, service, read).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.core.security import encrypt_secret, generate_api_key
from app.models.meta_models import ApiToken, Project, User
from app.schemas.api_token import TokenCreatedResponse, TokenCreateRequest
from app.services.audit_service import AuditService
from app.services.auth_service import invalidate_auth_cache


class TokenService:
    @classmethod
    def create_token(
        cls,
        db: Session,
        project: Project,
        req: TokenCreateRequest,
        actor: User,
    ) -> TokenCreatedResponse:
        raw_secret, prefix, key_hash = generate_api_key(req.token_type)

        expires_at = None
        if req.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)

        default_scopes = req.scopes
        if not default_scopes or default_scopes == "*":
            if req.token_type == "service":
                default_scopes = "read,deploy,lock,approve,admin"
            elif req.token_type == "deploy":
                default_scopes = "read,deploy"
            else:
                default_scopes = "read"

        token = ApiToken(
            project_id=project.id,
            name=req.name.strip(),
            token_prefix=prefix,
            key_hash=key_hash,
            encrypted_secret=encrypt_secret(raw_secret),
            token_type=req.token_type,
            scopes=default_scopes,
            expires_at=expires_at,
            is_active=True,
            created_by=actor.id,
        )
        db.add(token)
        db.commit()
        db.refresh(token)
        invalidate_auth_cache(project.id)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="CREATE_API_TOKEN",
            resource_type="api_token",
            resource_id=str(token.id),
            project_id=project.id,
            diff={"name": token.name, "token_type": token.token_type, "prefix": token.token_prefix},
        )

        return TokenCreatedResponse(
            id=token.id,
            project_id=token.project_id,
            name=token.name,
            token_prefix=token.token_prefix,
            key_prefix=token.token_prefix,
            token_type=token.token_type,
            scopes=token.scopes,
            is_active=token.is_active,
            expires_at=token.expires_at,
            created_at=token.created_at,
            last_used_at=token.last_used_at,
            secret_key=raw_secret,
            raw_secret=raw_secret,
        )

    @classmethod
    def list_tokens(cls, db: Session, project: Project) -> List[ApiToken]:
        return (
            db.query(ApiToken)
            .filter(ApiToken.project_id == project.id)
            .order_by(desc(ApiToken.created_at))
            .all()
        )

    @classmethod
    def revoke_token(cls, db: Session, project: Project, token_id: int, actor: User) -> None:
        token = (
            db.query(ApiToken)
            .filter(
                ApiToken.id == token_id,
                ApiToken.project_id == project.id,
            )
            .first()
        )
        if not token:
            raise NotFoundError("API Token not found.")

        token_name = token.name
        db.delete(token)
        db.commit()
        invalidate_auth_cache(project.id)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="REVOKE_API_TOKEN",
            resource_type="api_token",
            resource_id=str(token_id),
            project_id=project.id,
            diff={"revoked_token_name": token_name},
        )
