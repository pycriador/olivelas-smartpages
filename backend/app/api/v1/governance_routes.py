"""
API Tokens, Quotas, CORS, and Audit Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

import hmac
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AuthenticationError, NotFoundError
from app.db.session import get_meta_db
from app.models.meta_models import ErrorReport, Project, User
from app.schemas.api_token import TokenCreatedResponse, TokenCreateRequest, TokenResponse
from app.schemas.governance import (
    AuditLogResponse,
    CorsRuleCreateRequest,
    CorsRuleResponse,
    CorsRuleUpdateRequest,
    ErrorReportCreateRequest,
    ErrorReportResponse,
    ErrorReportUpdateRequest,
    QuotaResponse,
    QuotaUpdateRequest,
    QuotaUsageResponse,
)
from app.schemas.project import OpsBaseWebhookRequest
from app.services.audit_service import AuditService
from app.services.auth_service import get_current_user, require_project_role, resolve_optional_user_from_request
from app.services.hbac_service import HBACService
from app.services.opsbase_service import OpsBaseIntegrationService
from app.services.project_service import ProjectService
from app.services.quota_service import CorsService, QuotaService
from app.services.token_service import TokenService

# 1. API Tokens Router
tokens_router = APIRouter(prefix="/projects/{project_id}/tokens", tags=["API Tokens"])


def _serialize_token(t: Any) -> TokenResponse:
    resp = TokenResponse.model_validate(t)
    resp.key_prefix = t.token_prefix
    return resp


def _serialize_cors(r: Any) -> CorsRuleResponse:
    resp = CorsRuleResponse.model_validate(r)
    resp.allowed_origin = r.origin
    resp.allow_credentials = bool(getattr(r, "allow_credentials", False)) and r.origin != "*"
    if getattr(r, "max_age_seconds", None):
        resp.max_age_seconds = int(r.max_age_seconds)
    elif "max-age=" in (r.cache_control or ""):
        try:
            age_part = r.cache_control.split("max-age=")[1].split(",")[0].strip()
            resp.max_age_seconds = int(age_part)
        except Exception:
            resp.max_age_seconds = 3600
    return resp


@tokens_router.get("", response_model=List[TokenResponse])
def list_tokens(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> List[TokenResponse]:
    tokens = TokenService.list_tokens(db, project)
    return [_serialize_token(t) for t in tokens]


@tokens_router.post("", response_model=TokenCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_token(
    req: TokenCreateRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> TokenCreatedResponse:
    return TokenService.create_token(db, project, req, current_user)


@tokens_router.delete("/{token_id}", status_code=status.HTTP_200_OK)
def revoke_token(
    token_id: int,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    TokenService.revoke_token(db, project, token_id, current_user)
    return {"success": True, "message": "API Token revoked successfully."}


# 2. Quotas Router
quotas_router = APIRouter(prefix="/projects/{project_id}/quotas", tags=["Quotas"])


@quotas_router.get("", response_model=QuotaUsageResponse)
def get_project_quotas(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> QuotaUsageResponse:
    return QuotaService.get_quota_usage(db, project)


@quotas_router.put("", response_model=QuotaResponse)
def update_project_quotas(
    req: QuotaUpdateRequest,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> QuotaResponse:
    quota = QuotaService.update_quota(db, project, req, current_user)
    return QuotaResponse.model_validate(quota)


# 3. CORS Router
cors_router = APIRouter(prefix="/projects/{project_id}/cors", tags=["CORS & Headers"])


@cors_router.get("", response_model=List[CorsRuleResponse])
def list_cors_rules(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> List[CorsRuleResponse]:
    rules = CorsService.list_rules(db, project)
    return [_serialize_cors(r) for r in rules]


@cors_router.post("", response_model=CorsRuleResponse, status_code=status.HTTP_201_CREATED)
def create_cors_rule(
    req: CorsRuleCreateRequest,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> CorsRuleResponse:
    rule = CorsService.create_rule(db, project, req, current_user)
    return _serialize_cors(rule)


@cors_router.put("/{rule_id}", response_model=CorsRuleResponse)
def update_cors_rule(
    rule_id: int,
    req: CorsRuleUpdateRequest,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> CorsRuleResponse:
    rule = CorsService.update_rule(db, project, rule_id, req, current_user)
    return _serialize_cors(rule)


@cors_router.delete("/{rule_id}", status_code=status.HTTP_200_OK)
def delete_cors_rule(
    rule_id: int,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    CorsService.delete_rule(db, project, rule_id, current_user)
    return {"success": True, "message": "CORS rule deleted successfully."}


# 4. Audit Logs Router
audit_router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@audit_router.get("")
@audit_router.get("/logs")
def list_audit_logs(
    project_id: Optional[int] = Query(None),
    actor_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    if project_id is not None and not current_user.is_superuser:
        proj = db.query(Project).filter(Project.id == project_id).first()
        if proj and not HBACService.has_project_access(current_user, proj.id, "viewer", proj.created_by):
            return {"items": [], "total": 0, "limit": limit, "offset": offset}

    logs, total = AuditService.list_logs(
        db=db,
        project_id=project_id,
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        limit=limit,
        offset=offset,
    )
    items = []
    for log in logs:
        resp = AuditLogResponse.model_validate(log)
        diff_data = log.get_diff() or {}
        resp.diff = diff_data
        resp.details = diff_data
        resp.created_at = log.timestamp
        resp.auth_method = "api_token" if (log.actor_email and log.actor_email.startswith("token-")) else ("cli" if log.actor_email == "cli-script" else "jwt")
        resp.status_code = 201 if log.action.startswith("CREATE_") or log.action.startswith("DEPLOY_") else 200
        resp.after_state = diff_data
        items.append(resp.model_dump())

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# 5. Public Runtime Configuration Router (P-13 & Part 2)
public_projects_router = APIRouter(prefix="/public/projects", tags=["Public Runtime Configuration (P-13)"])


@public_projects_router.get(
    "/{slug}/config",
    summary="Fetch Public Runtime Configuration & Scoped Opsbase Credentials for a Static Site (P-13)",
)
def get_public_project_runtime_config(
    slug: str,
    request: Request,
    response: Response,
    env: Optional[str] = Query(
        default=None,
        description="Target environment (production, staging, development, preview). Invalid values return HTTP 400/404.",
    ),
    version: Optional[str] = Query(default=None, description="Optional release version tag"),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    project = db.query(Project).filter(Project.slug == slug, Project.is_active.is_(True)).first()
    if not project:
        raise NotFoundError(f"Project '{slug}' not found.")

    if "env" in request.query_params:
        target_env = OpsBaseIntegrationService.validate_environment_name(
            request.query_params.get("env"), allow_none=False
        )
    else:
        target_env = OpsBaseIntegrationService.validate_environment_name(env, allow_none=True)

    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    return ProjectService.build_runtime_config_payload(
        db=db,
        project=project,
        environment=target_env,
        version_override=version,
    )


# 5b. OpsBase Webhooks Router (Part 2 - Zero-Redeploy Key Sync & Revocation)
webhooks_router = APIRouter(prefix="/webhooks", tags=["OpsBase Integration Webhooks (Part 2)"])


def verify_opsbase_webhook_secret(request: Request) -> None:
    """
    Requires the shared webhook secret (OPSBASE_WEBHOOK_SECRET) on every call to the
    OpsBase webhook endpoints, so a forged key.revoked/key.rotated event from an
    unauthenticated caller cannot alter a project's public config (P-14).
    """
    provided = request.headers.get("X-Opsbase-Webhook-Secret") or ""
    auth_header = request.headers.get("Authorization") or ""
    if not provided and auth_header.lower().startswith("bearer "):
        provided = auth_header[7:].strip()

    expected = settings.OPSBASE_WEBHOOK_SECRET or ""
    if not expected or not provided or not hmac.compare_digest(provided, expected):
        raise AuthenticationError(
            "Invalid or missing OpsBase webhook secret. Send it via the "
            "'X-Opsbase-Webhook-Secret' header."
        )


@webhooks_router.post(
    "/opsbase",
    summary="Receive OpsBase Key Rotation / Revocation Webhook without Redeploying Sites (Part 2)",
)
@webhooks_router.post(
    "/opsbase/key-sync",
    summary="Synchronize Rotated or Revoked OpsBase Public Key via Webhook (Part 2)",
)
def receive_opsbase_webhook(
    request: Request,
    payload: OpsBaseWebhookRequest,
    db: Session = Depends(get_meta_db),
    _auth: None = Depends(verify_opsbase_webhook_secret),
) -> Dict[str, Any]:
    ip_addr = request.client.host if request.client else None
    return OpsBaseIntegrationService.handle_opsbase_webhook(
        db=db,
        payload=payload.model_dump(),
        ip_address=ip_addr,
    )


# 6. Error Reporting & Diagnostics Router (/api/v1/errors)
errors_router = APIRouter(prefix="/errors", tags=["Error Reporting & Diagnostics"])


@errors_router.get("")
def list_error_reports(
    q: Optional[str] = Query(default=None, description="Search by title, message, error_code, or URL"),
    project_id: Optional[int] = Query(default=None),
    project_slug: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    route_path: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=200),
    limit: Optional[int] = Query(default=None, ge=1, le=500),
    offset: Optional[int] = Query(default=None, ge=0),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    query = db.query(ErrorReport)
    if project_id is not None:
        query = query.filter(ErrorReport.project_id == project_id)
    if project_slug:
        query = query.filter(ErrorReport.project_slug == project_slug.strip())
    if severity:
        query = query.filter(ErrorReport.severity == severity.strip().lower())
    if status_filter:
        query = query.filter(ErrorReport.status == status_filter.strip().lower())
    if route_path:
        query = query.filter(ErrorReport.route_path.ilike(f"%{route_path.strip()}%"))
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                ErrorReport.title.ilike(term),
                ErrorReport.message.ilike(term),
                ErrorReport.error_code.ilike(term),
                ErrorReport.page_url.ilike(term),
                ErrorReport.route_path.ilike(term),
            )
        )

    total = query.count()
    eff_limit = limit if limit is not None else page_size
    eff_offset = offset if offset is not None else (page - 1) * eff_limit

    rows = (
        query.order_by(desc(ErrorReport.created_at), desc(ErrorReport.id))
        .offset(eff_offset)
        .limit(eff_limit)
        .all()
    )
    items = [ErrorReportResponse.model_validate(r).model_dump() for r in rows]
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": eff_limit,
        "limit": eff_limit,
        "offset": eff_offset,
    }


@errors_router.post("", response_model=ErrorReportResponse, status_code=status.HTTP_201_CREATED)
@errors_router.post("/report", response_model=ErrorReportResponse, status_code=status.HTTP_201_CREATED)
def report_error(
    req: ErrorReportCreateRequest,
    request: Request,
    db: Session = Depends(get_meta_db),
) -> ErrorReportResponse:
    optional_user = None
    try:
        optional_user = resolve_optional_user_from_request(request, db)
    except Exception:
        optional_user = None

    resolved_project_id = req.project_id
    resolved_slug = (req.project_slug or "").strip() or None
    if resolved_project_id and not resolved_slug:
        proj = db.query(Project).filter(Project.id == resolved_project_id).first()
        if proj:
            resolved_slug = proj.slug
    elif resolved_slug and not resolved_project_id:
        proj = db.query(Project).filter(Project.slug == resolved_slug).first()
        if proj:
            resolved_project_id = proj.id

    parsed_route = req.route_path
    if not parsed_route:
        try:
            u = urlparse(req.page_url)
            parsed_route = u.path or "/"
        except Exception:
            parsed_route = "/"

    entry = ErrorReport(
        project_id=resolved_project_id,
        project_slug=resolved_slug,
        page_url=req.page_url.strip(),
        route_path=parsed_route,
        error_code=(req.error_code or "ERR_FRONTEND_RUNTIME").strip(),
        http_status=req.http_status,
        severity=(req.severity or "error").strip().lower(),
        title=req.title.strip(),
        message=req.message.strip(),
        stack_trace=req.stack_trace,
        version=req.version,
        environment=(req.environment or "production").strip().lower(),
        status="open",
        reporter_email=req.reporter_email or (optional_user.email if optional_user else None),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return ErrorReportResponse.model_validate(entry)


@errors_router.patch("/{error_id}", response_model=ErrorReportResponse)
@errors_router.put("/{error_id}", response_model=ErrorReportResponse)
def update_error_report(
    error_id: int,
    req: ErrorReportUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ErrorReportResponse:
    entry = db.query(ErrorReport).filter(ErrorReport.id == error_id).first()
    if not entry:
        raise NotFoundError(f"Error report #{error_id} not found.")
    if req.status is not None:
        entry.status = req.status
    if req.severity is not None:
        entry.severity = req.severity
    if req.resolution_notes is not None:
        entry.resolution_notes = req.resolution_notes
    db.commit()
    db.refresh(entry)
    return ErrorReportResponse.model_validate(entry)


@errors_router.delete("/{error_id}", status_code=status.HTTP_200_OK)
def delete_error_report(
    error_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    entry = db.query(ErrorReport).filter(ErrorReport.id == error_id).first()
    if not entry:
        raise NotFoundError(f"Error report #{error_id} not found.")
    db.delete(entry)
    db.commit()
    return {"success": True, "message": f"Error report #{error_id} deleted."}
