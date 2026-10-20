"""
Projects & Static Hosting Governance Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.errors import ValidationError
from app.db.session import get_meta_db
from app.models.meta_models import Project, User
from app.schemas.project import (
    CiCdDeployConfigResponse,
    OpsBaseCorsSyncRequest,
    OpsBaseLinkRequest,
    OpsBaseWebhookRequest,
    ProjectCreate,
    ProjectCredentialsRevealRequest,
    ProjectDetailResponse,
    ProjectLockRequest,
    ProjectPermissionCreate,
    ProjectPermissionResponse,
    ProjectPublicConfigResponse,
    ProjectPublicConfigUpsertRequest,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.auth_service import get_current_user, require_project_role
from app.services.opsbase_service import OpsBaseIntegrationService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectDetailResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> List[ProjectDetailResponse]:
    projects = ProjectService.list_accessible_projects(db, current_user)
    return [ProjectService.get_project_detail(db, p, current_user) for p in projects]


@router.post("", response_model=ProjectDetailResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectDetailResponse:
    project = ProjectService.create_project(db, req, current_user)
    return ProjectService.get_project_detail(db, project, current_user)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project: Project = Depends(require_project_role("viewer")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectDetailResponse:
    return ProjectService.get_project_detail(db, project, current_user)


@router.put("/{project_id}", response_model=ProjectDetailResponse)
@router.patch("/{project_id}", response_model=ProjectDetailResponse)
def update_project(
    req: ProjectUpdate,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectDetailResponse:
    updated = ProjectService.update_project(db, project, req, current_user)
    return ProjectService.get_project_detail(db, updated, current_user)


@router.post("/{project_id}/lock", response_model=ProjectDetailResponse)
def lock_or_unlock_project_version(
    req: ProjectLockRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectDetailResponse:
    updated = ProjectService.set_project_lock(db, project, req, current_user)
    return ProjectService.get_project_detail(db, updated, current_user)


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    project_name = project.name
    res = ProjectService.delete_project(db, project, current_user)
    return {
        "success": True,
        "message": f"Project '{project_name}' and repository '{res['deleted_repo']}' deleted successfully.",
        **res,
    }


@router.get("/{project_id}/credentials", response_model=CiCdDeployConfigResponse)
def get_project_credentials(
    request: Request,
    project: Project = Depends(require_project_role("viewer")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> CiCdDeployConfigResponse:
    return ProjectService.get_cicd_credentials(
        db=db,
        project=project,
        actor=current_user,
        reveal=False,
        request=request,
    )


@router.post("/{project_id}/credentials/reveal", response_model=CiCdDeployConfigResponse)
def reveal_project_credentials(
    request: Request,
    req: ProjectCredentialsRevealRequest = ProjectCredentialsRevealRequest(),
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> CiCdDeployConfigResponse:
    return ProjectService.get_cicd_credentials(
        db=db,
        project=project,
        actor=current_user,
        reveal=True,
        password=req.password if req else None,
        reason=(req.reason if req else None) or "explicit_reveal",
        request=request,
    )


@router.get("/{project_id}/permissions", response_model=List[ProjectPermissionResponse])
def list_project_permissions(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> List[ProjectPermissionResponse]:
    return ProjectService.list_permissions(db, project)


@router.post("/{project_id}/permissions", response_model=ProjectPermissionResponse, status_code=status.HTTP_201_CREATED)
def add_project_permission(
    req: ProjectPermissionCreate,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectPermissionResponse:
    perm = ProjectService.add_permission(db, project, req, current_user)
    return ProjectService.serialize_permission(db, perm)


@router.delete("/{project_id}/permissions/{permission_id}", status_code=status.HTTP_200_OK)
def remove_project_permission(
    permission_id: int,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    ProjectService.remove_permission(db, project, permission_id, current_user)
    return {"success": True, "message": "Permission revoked successfully."}


@router.get(
    "/{project_id}/public-config",
    summary="List Public Runtime Configurations & Scoped Opsbase Credentials per Environment (P-13)",
)
def list_project_public_configs(
    env: Optional[str] = Query(
        default=None,
        description="Optional environment filter (production, staging, development, preview). Invalid values return HTTP 400/404.",
    ),
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> Any:
    if env is not None:
        cfg = ProjectService.get_public_config_by_env(db, project, env)
        return ProjectService.serialize_public_config(project, cfg)
    return ProjectService.list_public_configs(db, project)


@router.get(
    "/{project_id}/public-config/{environment}",
    response_model=ProjectPublicConfigResponse,
    summary="Get Public Runtime Configuration for a Specific Environment (P-13)",
)
def get_project_public_config_by_env(
    environment: str,
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> ProjectPublicConfigResponse:
    cfg = ProjectService.get_public_config_by_env(db, project, environment)
    return ProjectService.serialize_public_config(project, cfg)


@router.put(
    "/{project_id}/public-config",
    response_model=ProjectPublicConfigResponse,
    summary="Upsert Public Runtime Configuration & Scoped Opsbase Key (P-13)",
)
@router.post(
    "/{project_id}/public-config",
    response_model=ProjectPublicConfigResponse,
    summary="Create or Update Public Runtime Configuration & Scoped Opsbase Key (P-13)",
)
def upsert_project_public_config(
    req: ProjectPublicConfigUpsertRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectPublicConfigResponse:
    return ProjectService.upsert_public_config(db, project, req, current_user)


@router.put(
    "/{project_id}/public-config/{environment}",
    response_model=ProjectPublicConfigResponse,
    summary="Upsert Public Runtime Configuration for Environment (P-13)",
)
def upsert_project_public_config_for_env(
    environment: str,
    req: ProjectPublicConfigUpsertRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> ProjectPublicConfigResponse:
    req.environment = environment
    return ProjectService.upsert_public_config(db, project, req, current_user)


@router.get(
    "/{project_id}/opsbase/status",
    summary="Get OpsBase Discovery Link, Public Key Status & Exact-Origin CORS Alignment (Part 2)",
)
def get_project_opsbase_link_status(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    configs = ProjectService.list_public_configs(db, project)
    exact_origins = OpsBaseIntegrationService.compute_project_exact_origins(project)
    return {
        "project_id": project.id,
        "project_slug": project.slug,
        "linked": bool(project.opsbase_project_id),
        "opsbase_project_id": project.opsbase_project_id,
        "opsbase_project_slug": project.opsbase_project_slug,
        "opsbase_schema_name": project.opsbase_schema_name,
        "opsbase_key_prefix": project.opsbase_key_prefix,
        "opsbase_key_status": project.opsbase_key_status,
        "key_source": "opsbase_discovery",
        "opsbase_linked_at": project.opsbase_linked_at,
        "opsbase_last_synced_at": project.opsbase_last_synced_at,
        "opsbase_cors_synced": project.opsbase_cors_synced,
        "pages_exact_origins": exact_origins,
        "opsbase_allowed_origins": project.get_opsbase_allowed_origins(),
        "custom_domain": project.custom_domain,
        "environments": [c.model_dump() for c in configs],
    }


@router.post(
    "/{project_id}/opsbase/link",
    summary="Link Project to OpsBase & Fetch Public Anon Key via Discovery Endpoint (Part 2)",
)
@router.post(
    "/{project_id}/opsbase/sync",
    summary="Re-Synchronize Public Anon Key & URL from OpsBase Discovery without Redeploy (Part 2)",
)
@router.post(
    "/{project_id}/public-config/sync",
    summary="On-Demand Public Runtime Config Sync with OpsBase Discovery (Part 2)",
)
def link_or_sync_project_with_opsbase(
    request: Request,
    req: Optional[OpsBaseLinkRequest] = Body(default=None),
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    body = req or OpsBaseLinkRequest()
    # Explicitly reject any attempt to send a manual or placeholder key during link/sync
    for forbidden_manual_field in ("opsbase_public_key", "anon_key", "public_key"):
        val = getattr(body, forbidden_manual_field, None)
        if val is not None and str(val).strip() != "":
            raise ValidationError(
                f"O campo '{forbidden_manual_field}' não pode ser enviado manualmente nem usar placeholder. "
                "No vínculo, o OpsPages busca a chave pública e a URL diretamente no endpoint de descoberta do OpsBase."
            )

    ip_addr = request.client.host if request.client else None
    return OpsBaseIntegrationService.link_or_sync_project(
        db=db,
        project=project,
        opsbase_project_id=body.opsbase_project_id,
        opsbase_project_slug=body.opsbase_project_slug,
        opsbase_base_url=body.opsbase_base_url,
        environment_urls=body.environment_urls,
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip_addr,
        auto_provision_if_missing=body.auto_provision_if_missing,
        sync_cors=body.sync_cors,
    )


@router.post(
    "/{project_id}/opsbase/cors-sync",
    summary="Align Exact-Origin CORS Allowlist between OpsPages and OpsBase in One Step (Part 2)",
)
def sync_project_cors_with_opsbase_route(
    req: Optional[OpsBaseCorsSyncRequest] = Body(default=None),
    project: Project = Depends(require_project_role("editor")),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    body = req or OpsBaseCorsSyncRequest()
    result = OpsBaseIntegrationService.sync_project_cors_with_opsbase(
        db=db,
        project=project,
        opsbase_base_url=body.opsbase_base_url,
        extra_origins=body.extra_origins,
        replace_existing=body.replace_existing,
    )
    db.commit()
    return result


@router.post(
    "/{project_id}/opsbase/webhook",
    summary="Receive OpsBase Key Rotation / Revocation Webhook for Project without Redeploy (Part 2)",
)
def project_opsbase_webhook(
    request: Request,
    payload: OpsBaseWebhookRequest,
    project: Project = Depends(require_project_role("editor")),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    ip_addr = request.client.host if request.client else None
    data = payload.model_dump()
    data["opsbase_project_id"] = data.get("opsbase_project_id") or project.opsbase_project_id
    data["opsbase_project_slug"] = data.get("opsbase_project_slug") or project.opsbase_project_slug or project.slug
    return OpsBaseIntegrationService.handle_opsbase_webhook(db=db, payload=data, ip_address=ip_addr)

