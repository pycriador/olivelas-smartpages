"""
Git Version Control & /repos Management Endpoints for AIOps OpsPages.
"""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_meta_db
from app.models.meta_models import Project, User
from app.schemas.deployment import GitDiffResponse, GitRepoStatusResponse, GitSyncRequest
from app.services.audit_service import AuditService
from app.services.auth_service import get_current_user, require_project_role
from app.services.git_storage_service import GitStorageService

router = APIRouter(prefix="/projects/{project_id}/git", tags=["Git & /repos Version Control"])


@router.get("/status", response_model=GitRepoStatusResponse)
def get_git_repo_status(
    limit: int = Query(default=40, ge=1, le=200),
    project: Project = Depends(require_project_role("viewer")),
) -> GitRepoStatusResponse:
    return GitStorageService.get_repo_status(project, limit=limit)


@router.get("/diff", response_model=GitDiffResponse)
def get_git_diff_between_versions(
    base_version: str = Query(..., description="Base version tag or commit"),
    target_version: str = Query(..., description="Target version tag or commit"),
    project: Project = Depends(require_project_role("viewer")),
) -> GitDiffResponse:
    return GitStorageService.get_diff_between_versions(project, base_version, target_version)


@router.post("/sync")
def sync_git_remote(
    req: GitSyncRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    if req.remote_url is not None:
        project.github_repo_url = req.remote_url.strip()
    if req.branch is not None:
        project.github_branch = req.branch.strip()
    db.commit()
    db.refresh(project)

    res = GitStorageService.sync_github(project, direction=req.direction)

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        action=f"GIT_SYNC_{req.direction.upper()}",
        resource_type="git_repo",
        resource_id=project.slug,
        project_id=project.id,
        diff={"direction": req.direction, "remote": project.github_repo_url, "success": res.get("success")},
    )
    return res
