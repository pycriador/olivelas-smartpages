"""
Deployments, Static Builds, Approval, Rollback, and File Explorer Endpoints.
"""
from __future__ import annotations

from email.parser import BytesParser
from email.policy import default as email_default_policy
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.errors import ValidationError
from app.db.session import get_meta_db
from app.models.meta_models import Project, User
from app.schemas.deployment import (
    BuildFileContentResponse,
    BuildFileNode,
    DeploymentApproveRequest,
    DeploymentPublishRequest,
    DeploymentResponse,
    QuickHtmlDeployRequest,
)
from app.services.auth_service import get_current_user, require_project_role
from app.services.deployment_service import DeploymentService
from app.services.git_storage_service import GitStorageService

router = APIRouter(prefix="/projects/{project_id}/deployments", tags=["Deployments & Static Builds"])


def _parse_multipart_upload(content_type: str, body: bytes) -> Dict[str, Any]:
    """
    Parses multipart/form-data using Python's standard library email.parser.BytesParser
    so file uploads work out-of-the-box without requiring external multipart libraries.
    """
    header_bytes = f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8")
    msg = BytesParser(policy=email_default_policy).parsebytes(header_bytes + body)

    fields: Dict[str, str] = {}
    file_bytes: Optional[bytes] = None
    filename: str = "build.zip"

    if msg.is_multipart():
        for part in msg.iter_parts():
            cd = part.get("Content-Disposition", "")
            if "form-data" not in cd:
                continue
            name = part.get_param("name", header="Content-Disposition")
            part_filename = part.get_filename()
            payload = part.get_payload(decode=True) or b""
            if part_filename is not None or name == "file":
                file_bytes = payload
                if part_filename:
                    filename = part_filename
            elif name:
                fields[name] = payload.decode("utf-8", errors="replace").strip()
    return {
        "file_bytes": file_bytes,
        "filename": filename,
        "fields": fields,
    }


@router.get("", response_model=List[DeploymentResponse])
def list_deployments(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> List[DeploymentResponse]:
    return DeploymentService.list_deployments(db, project)


@router.get("/next-version")
def get_suggested_next_version(
    project: Project = Depends(require_project_role("viewer")),
    db: Session = Depends(get_meta_db),
) -> Dict[str, str]:
    return {"next_version": DeploymentService.suggest_next_version(db, project)}


@router.post(
    "/upload",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Static Build Archive (.zip, .tar.gz, .tgz)",
    description=(
        "Uploads a static build archive (`.zip`, `.tar.gz`, `.tgz`) via `multipart/form-data` or raw binary stream, "
        "commits the build snapshot to `/repos/{slug}`, and governs activation according to `auto_approval` and `is_locked`."
    ),
    openapi_extra={
        "requestBody": {
            "required": True,
            "description": "Multipart form-data payload containing the static build archive (.zip / .tar.gz) and release metadata (P-6).",
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["file"],
                        "properties": {
                            "file": {
                                "type": "string",
                                "format": "binary",
                                "description": "Static build archive file (.zip, .tar.gz, .tgz) containing index.html and static assets.",
                            },
                            "version": {
                                "type": "string",
                                "example": "1.1.0",
                                "description": "Semantic version tag for this release (optional; auto-incremented if omitted).",
                            },
                            "release_notes": {
                                "type": "string",
                                "example": "Release 1.1.0 with i18n and runtime Opsbase config",
                                "description": "Release notes / changelog message committed to Git.",
                            },
                            "source": {
                                "type": "string",
                                "enum": ["web_upload", "ci_api", "git_sync"],
                                "default": "web_upload",
                                "description": "Deployment origin trigger.",
                            },
                            "filename": {
                                "type": "string",
                                "example": "dist.zip",
                                "description": "Optional archive filename override.",
                            },
                        },
                    }
                },
                "application/zip": {
                    "schema": {
                        "type": "string",
                        "format": "binary",
                    }
                },
                "application/octet-stream": {
                    "schema": {
                        "type": "string",
                        "format": "binary",
                    }
                },
            },
        }
    },
)
async def upload_build_archive(
    request: Request,
    version: Optional[str] = Query(None),
    release_notes: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    filename: Optional[str] = Query(None),
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> DeploymentResponse:
    content_type = request.headers.get("content-type", "")
    raw_body = await request.body()

    if "multipart/form-data" in content_type:
        parsed = _parse_multipart_upload(content_type, raw_body)
        archive_bytes = parsed["file_bytes"]
        resolved_filename = filename or parsed["filename"] or "build.zip"
        fields = parsed["fields"]
        resolved_version = version or fields.get("version") or None
        resolved_notes = release_notes or fields.get("release_notes") or "Build enviada via upload"
        resolved_source = source or fields.get("source") or "web_upload"
    else:
        archive_bytes = raw_body
        resolved_filename = filename or request.headers.get("x-filename", "build.zip")
        resolved_version = version
        resolved_notes = release_notes or "Build enviada via CI/CD API"
        resolved_source = source or "ci_cd"

    if not archive_bytes:
        raise ValidationError("No build archive file provided in request.")

    return DeploymentService.deploy_from_archive(
        db=db,
        project=project,
        archive_bytes=archive_bytes,
        filename=resolved_filename,
        actor=current_user,
        version=resolved_version,
        release_notes=resolved_notes,
        source=resolved_source,
    )


@router.post(
    "/quick-build",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Quick-Build Static Deployment (UTF-8 Text & Base64 Binary Assets - P-12)",
    description=(
        "Creates a versioned static build directly from a JSON payload containing text files (`files`) "
        "and/or Base64-encoded binary assets such as images, icons, and web fonts (`binary_files`, `base64:...`, or `data:<mime>;base64,...`)."
    ),
)
def deploy_quick_files(
    req: QuickHtmlDeployRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> DeploymentResponse:
    return DeploymentService.deploy_from_files(
        db=db,
        project=project,
        req=req,
        actor=current_user,
        source="quick_editor",
    )


@router.post("/{version}/approve", response_model=DeploymentResponse)
def approve_deployment(
    version: str,
    req: DeploymentApproveRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> DeploymentResponse:
    return DeploymentService.approve_deployment(
        db=db,
        project=project,
        version=version,
        publish_immediately=req.publish_immediately,
        actor=current_user,
        notes=req.notes or "",
    )


@router.post("/{version}/publish", response_model=DeploymentResponse)
def publish_or_rollback_deployment(
    version: str,
    req: DeploymentPublishRequest,
    project: Project = Depends(require_project_role("editor")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> DeploymentResponse:
    return DeploymentService.publish_or_rollback(
        db=db,
        project=project,
        version=version,
        actor=current_user,
        lock_this_version=req.lock_this_version,
        reason=req.reason or "",
    )


@router.delete("/{version}", status_code=status.HTTP_200_OK)
def delete_deployment(
    version: str,
    project: Project = Depends(require_project_role("admin")),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_meta_db),
) -> Dict[str, Any]:
    DeploymentService.delete_deployment(db, project, version, current_user)
    return {"success": True, "message": f"Deployment version '{version}' deleted successfully."}


@router.get("/{version}/files", response_model=List[BuildFileNode])
def list_version_files(
    version: str,
    project: Project = Depends(require_project_role("viewer")),
) -> List[BuildFileNode]:
    return GitStorageService.list_version_files(project, version)


@router.get("/{version}/file-content", response_model=BuildFileContentResponse)
def read_version_file_content(
    version: str,
    path: str = Query(..., description="Relative file path inside the static build"),
    project: Project = Depends(require_project_role("viewer")),
) -> BuildFileContentResponse:
    return GitStorageService.read_version_file(project, version, path)


@router.get("/{version}/download-build")
def download_static_build_zip(
    version: str,
    project: Project = Depends(require_project_role("viewer")),
) -> Response:
    zip_bytes, zip_filename = GitStorageService.build_release_zip_bytes(project, version)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
        },
    )


@router.get("/{version}/download-source")
def download_source_code_zip(
    version: str,
    project: Project = Depends(require_project_role("viewer")),
) -> Response:
    zip_bytes, zip_filename = GitStorageService.build_source_zip_bytes(project, version)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
        },
    )
