"""
Quota & CORS Governance Services for AIOps OpsPages.
"""
from __future__ import annotations

from datetime import datetime, timezone
import re
from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.models.meta_models import CorsRule, Deployment, Project, ProjectQuota, User
from app.schemas.governance import (
    CorsRuleCreateRequest,
    CorsRuleUpdateRequest,
    QuotaResponse,
    QuotaUpdateRequest,
    QuotaUsageResponse,
)
from app.services.audit_service import AuditService


class QuotaService:
    @classmethod
    def get_or_create_quota(cls, db: Session, project: Project) -> ProjectQuota:
        quota = db.query(ProjectQuota).filter(ProjectQuota.project_id == project.id).first()
        if not quota:
            quota = ProjectQuota(
                project_id=project.id,
                max_build_size_mb=settings.DEFAULT_MAX_BUILD_SIZE_MB,
                max_storage_mb=settings.DEFAULT_MAX_STORAGE_MB,
                max_deploys_per_day=settings.DEFAULT_MAX_DEPLOYS_PER_DAY,
                max_retained_versions=settings.DEFAULT_MAX_RETAINED_VERSIONS,
            )
            db.add(quota)
            db.commit()
            db.refresh(quota)
        return quota

    @classmethod
    def get_quota_usage(cls, db: Session, project: Project) -> QuotaUsageResponse:
        quota = cls.get_or_create_quota(db, project)

        total_versions = db.query(Deployment).filter(Deployment.project_id == project.id).count()
        total_bytes = (
            db.query(func.coalesce(func.sum(Deployment.size_bytes), 0))
            .filter(Deployment.project_id == project.id)
            .scalar()
            or 0
        )
        storage_mb = round(float(total_bytes) / (1024 * 1024), 2)

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        deploys_today = (
            db.query(Deployment)
            .filter(
                Deployment.project_id == project.id,
                Deployment.created_at >= today_start,
            )
            .count()
        )

        ver_pct = round((total_versions / max(quota.max_retained_versions, 1)) * 100, 1)
        stor_pct = round((storage_mb / max(quota.max_storage_mb, 1)) * 100, 1)
        dep_pct = round((deploys_today / max(quota.max_deploys_per_day, 1)) * 100, 1)

        return QuotaUsageResponse(
            quota=QuotaResponse.model_validate(quota),
            current_versions=total_versions,
            retained_versions=total_versions,
            current_storage_mb=storage_mb,
            deploys_today=deploys_today,
            version_usage_pct=min(ver_pct, 100.0),
            storage_usage_pct=min(stor_pct, 100.0),
            deploys_today_pct=min(dep_pct, 100.0),
        )

    @classmethod
    def update_quota(
        cls,
        db: Session,
        project: Project,
        req: QuotaUpdateRequest,
        actor: User,
    ) -> ProjectQuota:
        quota = cls.get_or_create_quota(db, project)
        diff = {}

        if req.max_build_size_mb is not None:
            diff["max_build_size_mb"] = {"old": quota.max_build_size_mb, "new": req.max_build_size_mb}
            quota.max_build_size_mb = req.max_build_size_mb
        if req.max_storage_mb is not None:
            diff["max_storage_mb"] = {"old": quota.max_storage_mb, "new": req.max_storage_mb}
            quota.max_storage_mb = req.max_storage_mb
        if req.max_deploys_per_day is not None:
            diff["max_deploys_per_day"] = {"old": quota.max_deploys_per_day, "new": req.max_deploys_per_day}
            quota.max_deploys_per_day = req.max_deploys_per_day
        if req.max_retained_versions is not None:
            diff["max_retained_versions"] = {"old": quota.max_retained_versions, "new": req.max_retained_versions}
            quota.max_retained_versions = req.max_retained_versions

        db.commit()
        db.refresh(quota)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="UPDATE_QUOTA",
            resource_type="quota",
            resource_id=str(quota.id),
            project_id=project.id,
            diff=diff,
        )
        return quota


ORIGIN_REGEX = re.compile(r"^https?://([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+(:\d{1,5})?$")


class CorsService:
    @staticmethod
    def validate_origin_and_credentials(origin: str, allow_credentials: bool) -> str:
        """
        Strictly validates a CORS origin per RFC 6454 and P-9:
        - Allows '*' only when allow_credentials is False.
        - Otherwise requires exact http:// or https:// scheme + host (+ optional port),
          with no wildcards, paths, queries, or fragments.
        """
        cleaned = (origin or "").strip()
        if not cleaned:
            raise ValidationError("CORS origin cannot be empty.")

        if cleaned == "*":
            if allow_credentials:
                raise ValidationError(
                    "Wildcard origin '*' cannot be combined with allow_credentials=True (P-9)."
                )
            return "*"

        if "*" in cleaned or " " in cleaned or "?" in cleaned or "#" in cleaned:
            raise ValidationError(
                f"Invalid CORS origin '{cleaned}'. Wildcard subdomains, spaces, and query/fragment strings are not allowed."
            )

        m = ORIGIN_REGEX.match(cleaned)
        if not m:
            raise ValidationError(
                f"Invalid CORS origin '{cleaned}'. Must be '*' or an exact 'http(s)://host[:port]' origin without path."
            )

        if m.group(2):
            port = int(m.group(2)[1:])
            if port < 1 or port > 65535:
                raise ValidationError(f"Invalid port in CORS origin '{cleaned}'.")

        return cleaned

    @classmethod
    def list_rules(cls, db: Session, project: Project) -> List[CorsRule]:
        return (
            db.query(CorsRule)
            .filter(CorsRule.project_id == project.id)
            .order_by(CorsRule.id.asc())
            .all()
        )

    @classmethod
    def create_rule(
        cls,
        db: Session,
        project: Project,
        req: CorsRuleCreateRequest,
        actor: User,
    ) -> CorsRule:
        raw_origin = (req.origin if req.origin is not None else req.allowed_origin) or "*"
        allow_creds = bool(req.allow_credentials)
        target_origin = cls.validate_origin_and_credentials(raw_origin, allow_creds)

        max_age = req.max_age_seconds if req.max_age_seconds is not None else 3600
        cache_ctrl = (req.cache_control or "public, max-age=3600").strip()
        if req.max_age_seconds and "max-age=" not in cache_ctrl:
            cache_ctrl = f"public, max-age={req.max_age_seconds}"

        rule = CorsRule(
            project_id=project.id,
            origin=target_origin,
            allowed_methods=(req.allowed_methods or "GET,HEAD,OPTIONS").strip(),
            allowed_headers=(req.allowed_headers or "*").strip(),
            allow_credentials=allow_creds,
            max_age_seconds=max_age,
            cache_control=cache_ctrl,
            is_active=req.is_active if req.is_active is not None else True,
            created_by_email=actor.email,
            updated_by_email=actor.email,
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="CREATE_CORS_RULE",
            resource_type="cors_rule",
            resource_id=str(rule.id),
            project_id=project.id,
            diff={
                "origin": rule.origin,
                "allow_credentials": rule.allow_credentials,
                "max_age_seconds": rule.max_age_seconds,
                "cache_control": rule.cache_control,
            },
        )
        return rule

    @classmethod
    def update_rule(
        cls,
        db: Session,
        project: Project,
        rule_id: int,
        req: CorsRuleUpdateRequest,
        actor: User,
    ) -> CorsRule:
        rule = (
            db.query(CorsRule)
            .filter(CorsRule.id == rule_id, CorsRule.project_id == project.id)
            .first()
        )
        if not rule:
            raise NotFoundError("CORS rule not found.")

        next_origin = rule.origin
        if req.origin is not None or req.allowed_origin is not None:
            next_origin = (req.origin if req.origin is not None else req.allowed_origin) or "*"

        next_creds = rule.allow_credentials if req.allow_credentials is None else bool(req.allow_credentials)
        validated_origin = cls.validate_origin_and_credentials(next_origin, next_creds)

        rule.origin = validated_origin
        rule.allow_credentials = next_creds

        if req.allowed_methods is not None:
            rule.allowed_methods = req.allowed_methods.strip()
        if req.allowed_headers is not None:
            rule.allowed_headers = req.allowed_headers.strip()
        if req.max_age_seconds is not None:
            rule.max_age_seconds = req.max_age_seconds
        if req.cache_control is not None:
            rule.cache_control = req.cache_control.strip()
        if req.is_active is not None:
            rule.is_active = req.is_active

        rule.updated_by_email = actor.email

        db.commit()
        db.refresh(rule)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="UPDATE_CORS_RULE",
            resource_type="cors_rule",
            resource_id=str(rule.id),
            project_id=project.id,
            diff={
                "origin": rule.origin,
                "allow_credentials": rule.allow_credentials,
                "is_active": rule.is_active,
            },
        )
        return rule

    @classmethod
    def delete_rule(
        cls,
        db: Session,
        project: Project,
        rule_id: int,
        actor: User,
    ) -> None:
        rule = (
            db.query(CorsRule)
            .filter(CorsRule.id == rule_id, CorsRule.project_id == project.id)
            .first()
        )
        if not rule:
            raise NotFoundError("CORS rule not found.")

        origin = rule.origin
        db.delete(rule)
        db.commit()

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="DELETE_CORS_RULE",
            resource_type="cors_rule",
            resource_id=str(rule_id),
            project_id=project.id,
            diff={"deleted_origin": origin},
        )
