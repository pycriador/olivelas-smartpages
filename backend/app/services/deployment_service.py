"""
Deployment & Static Build Lifecycle Service for AIOps OpsPages.
Handles:
- Safe archive extraction (.zip, .tar.gz, .tgz) with single-folder unwrapping and ZipSlip protection
- Quick HTML/CSS/JS build creation from web editor or seed
- Automatic Git commits & tags in /repos/{project-slug}/
- Auto-Approval vs Manual Approval governance
- Version Lock protection (prevents overwriting locked active version)
- Rollback & instant version switching
"""
from __future__ import annotations

import base64
from datetime import datetime, timezone
import hashlib
import io
import logging
from pathlib import Path
import re
import shutil
import tarfile
import tempfile
from typing import Dict, List, Optional
import zipfile
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError, QuotaExceededError, ValidationError
from app.models.meta_models import Deployment, Project, User
from app.schemas.deployment import DeploymentResponse, QuickHtmlDeployRequest
from app.services.audit_service import AuditService
from app.services.git_storage_service import GitStorageService
from app.services.quota_service import QuotaService

logger = logging.getLogger("aiops.opspages.deployment")

VERSION_PATTERN = re.compile(r"^[a-zA-Z0-9._-]+$")


class DeploymentService:
    @staticmethod
    def to_response(project: Project, dep: Deployment) -> DeploymentResponse:
        resp = DeploymentResponse.model_validate(dep)
        resp.preview_url = f"/pages/{project.slug}/v/{dep.version}/"
        resp.is_live = project.active_version == dep.version
        resp.is_locked_version = bool(project.is_locked and project.locked_version == dep.version)
        return resp

    @classmethod
    def suggest_next_version(cls, db: Session, project: Project) -> str:
        latest = (
            db.query(Deployment)
            .filter(Deployment.project_id == project.id)
            .order_by(desc(Deployment.id))
            .first()
        )
        if not latest:
            return "v1.0.0"

        ver = latest.version
        m = re.match(r"^(v?)(\d+)\.(\d+)\.(\d+)$", ver)
        if m:
            prefix, major, minor, patch = m.groups()
            return f"{prefix}{major}.{minor}.{int(patch) + 1}"
        return f"v1.0.{latest.id + 1}"

    @staticmethod
    def _unwrap_single_root_folder(extract_dir: Path) -> Path:
        """
        If the user zipped a `dist/` or `build/` folder such that all files sit inside
        a single top-level directory, unwrap it so `index.html` is at the root.
        """
        entries = [
            e for e in extract_dir.iterdir()
            if e.name not in ("__MACOSX", ".DS_Store")
        ]
        if len(entries) == 1 and entries[0].is_dir():
            return entries[0]
        return extract_dir

    @classmethod
    def _safe_extract_archive(cls, raw_bytes: bytes, filename: str, dest_dir: Path) -> Path:
        fname_lower = (filename or "build.zip").lower()
        dest_resolved = dest_dir.resolve()

        if fname_lower.endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
                    for member in zf.infolist():
                        target_path = (dest_resolved / member.filename).resolve()
                        if not str(target_path).startswith(str(dest_resolved)):
                            raise ValidationError("Invalid path inside ZIP archive (ZipSlip prevented).")
                    zf.extractall(dest_resolved)
            except zipfile.BadZipFile:
                raise ValidationError("Uploaded file is not a valid .zip archive.")
        elif fname_lower.endswith((".tar.gz", ".tgz", ".tar")):
            try:
                mode = "r:*"
                with tarfile.open(fileobj=io.BytesIO(raw_bytes), mode=mode) as tf:
                    for member in tf.getmembers():
                        target_path = (dest_resolved / member.name).resolve()
                        if not str(target_path).startswith(str(dest_resolved)):
                            raise ValidationError("Invalid path inside TAR archive (Path Traversal prevented).")
                    tf.extractall(dest_resolved)
            except tarfile.TarError:
                raise ValidationError("Uploaded file is not a valid .tar / .tar.gz archive.")
        else:
            raise ValidationError("Unsupported archive format. Please upload a .zip or .tar.gz file.")

        return cls._unwrap_single_root_folder(dest_resolved)

    @classmethod
    def _check_quotas(cls, db: Session, project: Project, incoming_bytes: int) -> None:
        usage = QuotaService.get_quota_usage(db, project)
        quota = usage.quota

        incoming_mb = incoming_bytes / (1024 * 1024)
        if incoming_mb > quota.max_build_size_mb:
            raise QuotaExceededError(
                f"Build size ({incoming_mb:.2f} MB) exceeds project limit of {quota.max_build_size_mb} MB."
            )

        if usage.current_storage_mb + incoming_mb > quota.max_storage_mb:
            raise QuotaExceededError(
                f"Total repository storage would exceed project quota of {quota.max_storage_mb} MB."
            )

        if usage.deploys_today >= quota.max_deploys_per_day:
            raise QuotaExceededError(
                f"Daily deployment limit ({quota.max_deploys_per_day} deploys/day) reached for this project."
            )

    @classmethod
    def deploy_from_archive(
        cls,
        db: Session,
        project: Project,
        archive_bytes: bytes,
        filename: str,
        actor: User,
        version: Optional[str] = None,
        release_notes: str = "",
        source: str = "web_upload",
    ) -> DeploymentResponse:
        cls._check_quotas(db, project, len(archive_bytes))

        resolved_version = (version or "").strip() or cls.suggest_next_version(db, project)
        if not VERSION_PATTERN.match(resolved_version):
            raise ValidationError("Version must contain only letters, numbers, dots, hyphens, or underscores.")

        existing = (
            db.query(Deployment)
            .filter(
                Deployment.project_id == project.id,
                Deployment.version == resolved_version,
            )
            .first()
        )
        if existing:
            raise ConflictError(f"Version '{resolved_version}' already exists in project '{project.slug}'.")

        checksum = hashlib.sha256(archive_bytes).hexdigest()

        with tempfile.TemporaryDirectory(prefix="opspages_build_") as tmp_dir:
            tmp_path = Path(tmp_dir)
            unwrapped_dir = cls._safe_extract_archive(archive_bytes, filename, tmp_path)

            sha, git_tag, file_count, total_bytes = GitStorageService.commit_release_snapshot(
                project=project,
                version=resolved_version,
                source_dir=unwrapped_dir,
                author_name=actor.full_name or actor.username,
                author_email=actor.email,
                release_notes=release_notes or f"Deploy {resolved_version} via {source}",
            )

        return cls._finalize_deployment_record(
            db=db,
            project=project,
            version=resolved_version,
            git_commit_sha=sha,
            git_tag=git_tag,
            release_notes=release_notes or f"Build {resolved_version} enviada via {source}",
            source=source,
            file_count=file_count,
            size_bytes=total_bytes,
            checksum=checksum,
            actor=actor,
        )

    @staticmethod
    def _decode_file_payload(rel_path: str, raw_value: str, force_binary: bool = False) -> bytes:
        """
        Decodes a file entry from quick-build (P-12).
        Supports:
        1. Explicit `binary_files` map (Base64 string or data URI)
        2. `data:<mime>;base64,<payload>` or `base64:<payload>` prefix in `files`
        3. Auto-detection of Base64 payloads for binary file extensions (.png, .jpg, .webp, .ico, .woff, .woff2, .ttf, .otf, .wasm, .pdf)
        4. Standard UTF-8 text content
        """
        val = raw_value or ""
        if val.startswith("data:") and ";base64," in val:
            b64_part = val.split(";base64,", 1)[1].strip()
            try:
                return base64.b64decode(b64_part, validate=False)
            except Exception as exc:
                raise ValidationError(f"Invalid data URI Base64 payload for file '{rel_path}': {exc}")

        if val.startswith("base64:"):
            b64_part = val[len("base64:"):].strip()
            try:
                return base64.b64decode(b64_part, validate=False)
            except Exception as exc:
                raise ValidationError(f"Invalid Base64 payload for file '{rel_path}': {exc}")

        binary_exts = (
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".avif",
            ".woff", ".woff2", ".ttf", ".otf", ".eot", ".wasm", ".pdf", ".mp4", ".mp3", ".zip",
        )
        lower_path = rel_path.lower()
        if force_binary or lower_path.endswith(binary_exts):
            stripped = val.strip()
            try:
                return base64.b64decode(stripped, validate=True)
            except Exception:
                if force_binary:
                    try:
                        return base64.b64decode(stripped, validate=False)
                    except Exception as exc:
                        raise ValidationError(f"Invalid Base64 binary content for '{rel_path}': {exc}")
                return val.encode("utf-8", errors="surrogateescape")

        return val.encode("utf-8")

    @classmethod
    def deploy_from_files(
        cls,
        db: Session,
        project: Project,
        req: QuickHtmlDeployRequest,
        actor: User,
        source: str = "quick_editor",
    ) -> DeploymentResponse:
        combined_files = dict(req.files or {})
        binary_map = dict(req.binary_files or {})
        if not combined_files and not binary_map:
            raise ValidationError("At least one file (in 'files' or 'binary_files') must be provided.")

        decoded_entries: Dict[str, bytes] = {}
        hasher = hashlib.sha256()
        total_incoming = 0

        for rel_path, content in combined_files.items():
            data_bytes = cls._decode_file_payload(rel_path, content, force_binary=False)
            decoded_entries[rel_path] = data_bytes
            hasher.update(rel_path.encode("utf-8"))
            hasher.update(data_bytes)
            total_incoming += len(data_bytes)

        for rel_path, b64_content in binary_map.items():
            data_bytes = cls._decode_file_payload(rel_path, b64_content, force_binary=True)
            decoded_entries[rel_path] = data_bytes
            hasher.update(rel_path.encode("utf-8"))
            hasher.update(data_bytes)
            total_incoming += len(data_bytes)

        cls._check_quotas(db, project, total_incoming)

        resolved_version = (req.version or "").strip() or cls.suggest_next_version(db, project)
        if not VERSION_PATTERN.match(resolved_version):
            raise ValidationError("Invalid version format.")

        existing = (
            db.query(Deployment)
            .filter(
                Deployment.project_id == project.id,
                Deployment.version == resolved_version,
            )
            .first()
        )
        if existing:
            raise ConflictError(f"Version '{resolved_version}' already exists in project '{project.slug}'.")

        checksum = hasher.hexdigest()

        with tempfile.TemporaryDirectory(prefix="opspages_quick_") as tmp_dir:
            tmp_path = Path(tmp_dir)
            for rel_path, data_bytes in decoded_entries.items():
                clean_rel = rel_path.lstrip("/")
                if not clean_rel:
                    raise ValidationError("Empty file path is not allowed.")
                target = (tmp_path / clean_rel).resolve()
                if not str(target).startswith(str(tmp_path.resolve())):
                    raise ValidationError(f"Invalid file path: {rel_path}")
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data_bytes)

            sha, git_tag, file_count, total_bytes = GitStorageService.commit_release_snapshot(
                project=project,
                version=resolved_version,
                source_dir=tmp_path,
                author_name=actor.full_name or actor.username,
                author_email=actor.email,
                release_notes=req.release_notes,
            )

        return cls._finalize_deployment_record(
            db=db,
            project=project,
            version=resolved_version,
            git_commit_sha=sha,
            git_tag=git_tag,
            release_notes=req.release_notes,
            source=source,
            file_count=file_count,
            size_bytes=total_bytes,
            checksum=checksum,
            actor=actor,
        )

    @classmethod
    def deploy_from_directory(
        cls,
        db: Session,
        project: Project,
        build_dir: Path,
        actor: User,
        version: str = "1.0.0",
        release_notes: str = "",
        source: str = "typescript_build",
        source_code_dir: Optional[Path] = None,
    ) -> DeploymentResponse:
        if not build_dir.exists():
            raise NotFoundError(f"Build directory '{build_dir}' not found.")

        resolved_version = version.strip()
        existing = (
            db.query(Deployment)
            .filter(
                Deployment.project_id == project.id,
                Deployment.version == resolved_version,
            )
            .first()
        )
        if existing:
            raise ConflictError(f"Version '{resolved_version}' already exists in project '{project.slug}'.")

        sha, git_tag, file_count, total_bytes = GitStorageService.commit_release_snapshot(
            project=project,
            version=resolved_version,
            source_dir=build_dir,
            author_name=actor.full_name or actor.username,
            author_email=actor.email,
            release_notes=release_notes or f"Deploy {resolved_version} ({source})",
        )

        if source_code_dir and source_code_dir.exists():
            GitStorageService.save_source_snapshot(project.slug, resolved_version, source_code_dir)

        checksum = hashlib.sha256(f"{project.slug}:{resolved_version}:{sha}".encode("utf-8")).hexdigest()
        return cls._finalize_deployment_record(
            db=db,
            project=project,
            version=resolved_version,
            git_commit_sha=sha,
            git_tag=git_tag,
            release_notes=release_notes or f"Build {resolved_version} compilada a partir de TypeScript",
            source=source,
            file_count=file_count,
            size_bytes=total_bytes,
            checksum=checksum,
            actor=actor,
        )

    @classmethod
    def _finalize_deployment_record(
        cls,
        db: Session,
        project: Project,
        version: str,
        git_commit_sha: str,
        git_tag: str,
        release_notes: str,
        source: str,
        file_count: int,
        size_bytes: int,
        checksum: str,
        actor: User,
    ) -> DeploymentResponse:
        now = datetime.now(timezone.utc)

        # Governance evaluation:
        # 1. If project.auto_approval is False -> status = "pending_approval" (never auto-publishes)
        # 2. If project.auto_approval is True AND project.is_locked is True -> status = "ready" (approved, but active_version remains locked)
        # 3. If project.auto_approval is True AND project.is_locked is False -> status = "published" (immediately becomes active_version)
        if not project.auto_approval:
            dep_status = "pending_approval"
            approved_by = None
            approved_at = None
            published_at = None
        elif project.is_locked:
            dep_status = "ready"
            approved_by = actor.email
            approved_at = now
            published_at = None
        else:
            dep_status = "published"
            approved_by = actor.email
            approved_at = now
            published_at = now

            # Demote previous published deployment to "ready"
            db.query(Deployment).filter(
                Deployment.project_id == project.id,
                Deployment.status == "published",
            ).update({"status": "ready"})

            GitStorageService.activate_release(project, version)
            project.active_version = version

        dep = Deployment(
            project_id=project.id,
            version=version,
            git_commit_sha=git_commit_sha,
            git_tag=git_tag,
            git_branch=project.github_branch or "main",
            release_notes=release_notes,
            status=dep_status,
            source=source,
            file_count=file_count,
            size_bytes=size_bytes,
            checksum_sha256=checksum,
            entry_file=project.entry_file or "index.html",
            created_by=actor.id if actor.id else None,
            created_by_email=actor.email,
            approved_by_email=approved_by,
            approved_at=approved_at,
            published_at=published_at,
        )
        db.add(dep)
        db.commit()
        db.refresh(dep)
        db.refresh(project)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="CREATE_DEPLOYMENT",
            resource_type="deployment",
            resource_id=dep.version,
            project_id=project.id,
            diff={
                "version": dep.version,
                "status": dep.status,
                "source": dep.source,
                "git_commit_sha": dep.git_commit_sha,
                "file_count": dep.file_count,
                "size_bytes": dep.size_bytes,
                "project_locked": project.is_locked,
                "auto_approval": project.auto_approval,
            },
        )

        return cls.to_response(project, dep)

    @classmethod
    def list_deployments(cls, db: Session, project: Project) -> List[DeploymentResponse]:
        deps = (
            db.query(Deployment)
            .filter(Deployment.project_id == project.id)
            .order_by(desc(Deployment.created_at), desc(Deployment.id))
            .all()
        )
        return [cls.to_response(project, d) for d in deps]

    @classmethod
    def approve_deployment(
        cls,
        db: Session,
        project: Project,
        version: str,
        publish_immediately: bool,
        actor: User,
        notes: str = "",
    ) -> DeploymentResponse:
        dep = (
            db.query(Deployment)
            .filter(Deployment.project_id == project.id, Deployment.version == version)
            .first()
        )
        if not dep:
            raise NotFoundError(f"Deployment version '{version}' not found.")

        now = datetime.now(timezone.utc)
        dep.approved_by_email = actor.email
        dep.approved_at = now
        if notes:
            dep.release_notes = f"{dep.release_notes} | Aprovado: {notes}".strip(" |")

        if publish_immediately and not project.is_locked:
            db.query(Deployment).filter(
                Deployment.project_id == project.id,
                Deployment.status == "published",
            ).update({"status": "ready"})

            GitStorageService.activate_release(project, dep.version)
            dep.status = "published"
            dep.published_at = now
            project.active_version = dep.version
        else:
            dep.status = "ready"

        db.commit()
        db.refresh(dep)
        db.refresh(project)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="APPROVE_DEPLOYMENT",
            resource_type="deployment",
            resource_id=dep.version,
            project_id=project.id,
            diff={
                "version": dep.version,
                "status": dep.status,
                "published": dep.status == "published",
                "locked_bypass_prevented": bool(project.is_locked and publish_immediately),
            },
        )
        return cls.to_response(project, dep)

    @classmethod
    def publish_or_rollback(
        cls,
        db: Session,
        project: Project,
        version: str,
        actor: User,
        lock_this_version: bool = False,
        reason: str = "",
    ) -> DeploymentResponse:
        """
        Switches the live production release (`/pages/{slug}/`) to `version` (Publish / Rollback).
        If the project is currently locked to a different version, raises ConflictError unless unlocked first
        or `lock_this_version` is requested by an admin.
        """
        dep = (
            db.query(Deployment)
            .filter(Deployment.project_id == project.id, Deployment.version == version)
            .first()
        )
        if not dep:
            raise NotFoundError(f"Deployment version '{version}' not found.")

        if project.is_locked and project.locked_version != version and not lock_this_version:
            raise ConflictError(
                f"Project '{project.slug}' is locked at version '{project.locked_version}'. "
                "Unlock the project first or explicitly lock to the target version."
            )

        previous_version = project.active_version
        now = datetime.now(timezone.utc)

        db.query(Deployment).filter(
            Deployment.project_id == project.id,
            Deployment.status == "published",
        ).update({"status": "ready"})

        GitStorageService.activate_release(project, dep.version)

        dep.status = "published"
        dep.published_at = now
        if not dep.approved_at:
            dep.approved_at = now
            dep.approved_by_email = actor.email

        project.active_version = dep.version

        if lock_this_version:
            project.is_locked = True
            project.locked_version = dep.version
            project.locked_by = actor.email
            project.locked_reason = reason or f"Versão {dep.version} travada na publicação"

        db.commit()
        db.refresh(dep)
        db.refresh(project)

        action_name = "ROLLBACK_DEPLOYMENT" if previous_version and previous_version != dep.version else "PUBLISH_DEPLOYMENT"
        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action=action_name,
            resource_type="deployment",
            resource_id=dep.version,
            project_id=project.id,
            diff={
                "previous_version": previous_version,
                "active_version": dep.version,
                "is_locked": project.is_locked,
                "reason": reason,
            },
        )
        return cls.to_response(project, dep)

    @classmethod
    def delete_deployment(
        cls,
        db: Session,
        project: Project,
        version: str,
        actor: User,
    ) -> None:
        dep = (
            db.query(Deployment)
            .filter(Deployment.project_id == project.id, Deployment.version == version)
            .first()
        )
        if not dep:
            raise NotFoundError(f"Deployment '{version}' not found.")

        if project.active_version == version:
            raise ConflictError("Cannot delete the currently active production version. Switch to another version first.")
        if project.is_locked and project.locked_version == version:
            raise ConflictError("Cannot delete a locked version.")

        GitStorageService.delete_release_files(project.slug, version)
        db.delete(dep)
        db.commit()

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="DELETE_DEPLOYMENT",
            resource_type="deployment",
            resource_id=version,
            project_id=project.id,
            diff={"deleted_version": version},
        )
