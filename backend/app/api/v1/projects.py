"""
Projects & Static Hosting Governance Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_meta_db
from app.models.meta_models import Project, User
from app.schemas.project import (
    CiCdDeployConfigResponse,
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
    response_model=List[ProjectPublicConfigResponse],
    summary="List Public Runtime Configurations & Scoped Opsbase Credentials per Environment (P-13)",
)
def list_project_public_configs(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> List[ProjectPublicConfigResponse]:
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
