"""
Project Service for AIOps OpsPages.
Handles project creation, update, deletion, version locking, permissions, and CI/CD credentials.
"""
from __future__ import annotations

import json
import logging
import secrets
from datetime import timezone
from typing import Any, Dict, List, Optional
from fastapi import Request
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AuthenticationError, ConflictError, NotFoundError, ValidationError
from app.core.security import decrypt_secret, encrypt_secret, generate_api_key, verify_password
from app.models.meta_models import (
    ApiToken,
    CorsRule,
    Deployment,
    Group,
    Project,
    ProjectPermission,
    ProjectPublicConfig,
    ProjectQuota,
    User,
)
from app.schemas.deployment import QuickHtmlDeployRequest
from app.schemas.project import (
    CiCdDeployConfigResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectLockRequest,
    ProjectPermissionCreate,
    ProjectPermissionResponse,
    ProjectPublicConfigResponse,
    ProjectPublicConfigUpsertRequest,
    ProjectUpdate,
)
from app.services.audit_service import AuditService
from app.services.auth_service import invalidate_auth_cache
from app.services.deployment_service import DeploymentService
from app.services.git_storage_service import GitStorageService
from app.services.hbac_service import HBACService
from app.services.opsbase_service import OpsBaseIntegrationService, VALID_PUBLIC_CONFIG_ENVIRONMENTS, utc_now

logger = logging.getLogger("aiops.opspages.project")


def _build_welcome_static_files(project: Project) -> Dict[str, str]:
    """Generates a polished default static build v1.0.0 when a new project is created."""
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{project.name} — AIOps OpsPages</title>
  <link rel="stylesheet" href="./assets/style.css" />
</head>
<body>
  <div class="container">
    <div class="badge">AIOps OpsPages • Build Ativa</div>
    <h1>{project.name}</h1>
    <p class="subtitle">{project.description or 'Aplicação frontend hospedada e versionada no AIOps OpsPages (/repos/' + project.slug + ')'}</p>
    <div class="meta-grid">
      <div class="card">
        <span class="label">Slug do Projeto</span>
        <code>{project.slug}</code>
      </div>
      <div class="card">
        <span class="label">Repositório Git</span>
        <code>/repos/{project.slug}</code>
      </div>
      <div class="card">
        <span class="label">Framework</span>
        <code>{project.framework}</code>
      </div>
      <div class="card">
        <span class="label">Versão Inicial</span>
        <code id="version-tag">v1.0.0</code>
      </div>
    </div>
    <div class="footer">
      <span>Servido por <strong>Loft AIOps OpsPages</strong> • Controle de Versão Git & Governança HBAC</span>
    </div>
  </div>
  <script src="./assets/app.js"></script>
</body>
</html>
"""
    css = """* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  background: radial-gradient(circle at top right, #2a1810, #121619 60%);
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.container {
  max-width: 720px;
  width: 100%;
  background: rgba(23, 28, 32, 0.9);
  border: 1px solid rgba(255, 119, 74, 0.35);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
}
.badge {
  display: inline-block;
  background: rgba(255, 119, 74, 0.15);
  color: #FF774A;
  border: 1px solid rgba(255, 119, 74, 0.4);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
.subtitle { color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 28px; }
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}
.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
}
.label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
code { color: #FF774A; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }
.footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; font-size: 13px; color: #64748b; }
strong { color: #FF774A; }
"""
    js = f"""console.log("AIOps OpsPages — Project '{project.slug}' v1.0.0 loaded successfully.");
"""
    return {
        "index.html": html,
        "assets/style.css": css,
        "assets/app.js": js,
    }


class ProjectService:
    @classmethod
    def serialize_permission(cls, db: Session, perm: ProjectPermission) -> ProjectPermissionResponse:
        resp = ProjectPermissionResponse.model_validate(perm)
        if perm.user_id:
            u = db.query(User).filter(User.id == perm.user_id).first()
            if u:
                resp.username = u.username
                resp.user_email = u.email
        if perm.group_id:
            g = db.query(Group).filter(Group.id == perm.group_id).first()
            if g:
                resp.group_name = g.name
        return resp

    @classmethod
    def list_permissions(cls, db: Session, project: Project) -> List[ProjectPermissionResponse]:
        perms = (
            db.query(ProjectPermission)
            .filter(ProjectPermission.project_id == project.id)
            .order_by(ProjectPermission.id.asc())
            .all()
        )
        return [cls.serialize_permission(db, p) for p in perms]

    @classmethod
    def list_accessible_projects(cls, db: Session, user: User) -> List[Project]:
        all_projects = db.query(Project).order_by(desc(Project.created_at)).all()
        if user.is_superuser:
            return all_projects
        return [
            p
            for p in all_projects
            if HBACService.has_project_access(user, p.id, required_role="viewer", created_by=p.created_by)
        ]

    @classmethod
    def get_project_detail(cls, db: Session, project: Project, user: User) -> ProjectDetailResponse:
        dep_count = db.query(Deployment).filter(Deployment.project_id == project.id).count()
        total_bytes = (
            db.query(func.coalesce(func.sum(Deployment.size_bytes), 0))
            .filter(Deployment.project_id == project.id)
            .scalar()
            or 0
        )
        storage_mb = round(float(total_bytes) / (1024 * 1024), 2)

        try:
            git_status = GitStorageService.get_repo_status(project, limit=5)
            commit_count = git_status.total_commits
        except Exception:
            commit_count = dep_count

        eff_role = HBACService.get_effective_project_role(user, project.id, created_by=project.created_by) or "viewer"

        resp = ProjectDetailResponse.model_validate(project)
        resp.repo_disk_path = f"/repos/{project.slug}"
        resp.deployment_count = dep_count
        resp.total_deployments = dep_count
        resp.storage_mb = storage_mb
        resp.storage_bytes = int(total_bytes)
        resp.git_commit_count = commit_count
        resp.effective_role = eff_role
        resp.permissions = cls.list_permissions(db, project)
        return resp

    @classmethod
    def create_project(cls, db: Session, req: ProjectCreate, actor: User) -> Project:
        slug = req.slug.strip().lower()
        existing = db.query(Project).filter(Project.slug == slug).first()
        if existing:
            raise ConflictError(f"A project with slug '{slug}' already exists.")

        encrypted_gh_token = encrypt_secret(req.github_token) if req.github_token else None

        project = Project(
            name=req.name.strip(),
            slug=slug,
            description=req.description.strip(),
            framework=req.framework.strip(),
            auto_approval=req.auto_approval,
            spa_mode=req.spa_mode,
            is_public=req.is_public,
            entry_file=req.entry_file.strip() or "index.html",
            custom_domain=req.custom_domain.strip() if req.custom_domain else None,
            html_cache_control=req.html_cache_control.strip() or "no-cache, max-age=0, must-revalidate",
            hashed_asset_cache_control=req.hashed_asset_cache_control.strip() or "public, max-age=31536000, immutable",
            asset_cache_control=req.asset_cache_control.strip() or "public, max-age=3600",
            csp_policy=req.csp_policy.strip(),
            x_frame_options=req.x_frame_options.strip() or "SAMEORIGIN",
            referrer_policy=req.referrer_policy.strip() or "strict-origin-when-cross-origin",
            hsts_max_age=req.hsts_max_age,
            nosniff_enabled=req.nosniff_enabled,
            permissions_policy=req.permissions_policy.strip(),
            github_repo_url=req.github_repo_url.strip() if req.github_repo_url else None,
            github_branch=req.github_branch.strip() or "main",
            github_subpath=req.github_subpath.strip() or "/repos",
            github_token_encrypted=encrypted_gh_token,
            auto_sync_github=req.auto_sync_github,
            is_active=True,
            created_by=actor.id,
        )
        db.add(project)
        db.flush()

        # Provision default quota
        quota = ProjectQuota(
            project_id=project.id,
            max_build_size_mb=settings.DEFAULT_MAX_BUILD_SIZE_MB,
            max_storage_mb=settings.DEFAULT_MAX_STORAGE_MB,
            max_deploys_per_day=settings.DEFAULT_MAX_DEPLOYS_PER_DAY,
            max_retained_versions=settings.DEFAULT_MAX_RETAINED_VERSIONS,
        )
        db.add(quota)

        # Provision exact-origin CORS rules (Part 2 & P-9)
        for exact_origin in OpsBaseIntegrationService.compute_project_exact_origins(project):
            db.add(
                CorsRule(
                    project_id=project.id,
                    origin=exact_origin,
                    allowed_methods="GET,HEAD,OPTIONS",
                    allowed_headers="Authorization,Content-Type,Accept,Origin,X-Requested-With,X-API-Key,apikey",
                    allow_credentials=True,
                    max_age_seconds=3600,
                    cache_control=project.asset_cache_control or "public, max-age=3600",
                    is_active=True,
                )
            )

        # Grant explicit admin permission to creator
        perm = ProjectPermission(
            project_id=project.id,
            user_id=actor.id,
            role="admin",
        )
        db.add(perm)

        # Generate default CI/CD deploy token and service token
        deploy_raw, deploy_prefix, deploy_hash = generate_api_key("deploy")
        service_raw, service_prefix, service_hash = generate_api_key("service")

        db.add(
            ApiToken(
                project_id=project.id,
                name="Default CI/CD Deploy Key",
                token_prefix=deploy_prefix,
                key_hash=deploy_hash,
                encrypted_secret=encrypt_secret(deploy_raw),
                token_type="deploy",
                scopes="read,deploy",
                is_active=True,
                created_by=actor.id,
            )
        )
        db.add(
            ApiToken(
                project_id=project.id,
                name="Default Service Admin Key",
                token_prefix=service_prefix,
                key_hash=service_hash,
                encrypted_secret=encrypt_secret(service_raw),
                token_type="service",
                scopes="read,deploy,lock,approve,admin",
                is_active=True,
                created_by=actor.id,
            )
        )

        db.commit()
        db.refresh(project)

        # Link project & discover public anon key + URL + align CORS in OpsBase (Part 2)
        # Only auto-provisions a brand-new OpsBase project when no existing project was
        # named by the caller AND auto_provision_opsbase was explicitly opted into (P-15).
        project.opsbase_auto_provisioned = bool(
            req.auto_provision_opsbase and not req.opsbase_project_id and not req.opsbase_project_slug
        )
        try:
            OpsBaseIntegrationService.link_or_sync_project(
                db=db,
                project=project,
                opsbase_project_id=req.opsbase_project_id,
                opsbase_project_slug=req.opsbase_project_slug or project.slug,
                actor_id=actor.id,
                actor_email=actor.email,
                auto_provision_if_missing=req.auto_provision_opsbase,
                sync_cors=True,
            )
        except Exception as link_exc:
            logger.warning(f"Initial OpsBase discovery sync failed for {project.slug}: {link_exc}")
            for env_name in VALID_PUBLIC_CONFIG_ENVIRONMENTS:
                pub_cfg = ProjectPublicConfig(
                    project_id=project.id,
                    environment=env_name,
                    opsbase_url=settings.OPSBASE_DEFAULT_API_URL,
                    opsbase_public_key="",
                    opsbase_project_slug=slug,
                    opsbase_key_status="unlinked",
                    key_source="opsbase_discovery",
                    scopes="public:read,data:query,auth:session,crud:items",
                    inject_in_html=True,
                    is_active=True,
                    updated_by_email=actor.email,
                )
                pub_cfg.set_public_vars({})
                db.add(pub_cfg)
            db.commit()
            db.refresh(project)

        # Initialize /repos/{slug} Git repository
        GitStorageService.ensure_initialized(project)

        # Seed initial v1.0.0 static build if requested
        if req.seed_initial_build:
            try:
                welcome_files = _build_welcome_static_files(project)
                DeploymentService.deploy_from_files(
                    db=db,
                    project=project,
                    req=QuickHtmlDeployRequest(
                        version="v1.0.0",
                        release_notes="Initial v1.0.0 static scaffold provisioned in /repos/" + project.slug,
                        files=welcome_files,
                    ),
                    actor=actor,
                    source="seed",
                )
                db.refresh(project)
            except Exception as e:
                logger.warning(f"Failed to seed initial v1.0.0 build for {project.slug}: {e}")

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="CREATE_PROJECT",
            resource_type="project",
            resource_id=str(project.id),
            project_id=project.id,
            diff={
                "name": project.name,
                "slug": project.slug,
                "repo_folder": project.repo_folder_name,
                "auto_approval": project.auto_approval,
                "active_version": project.active_version,
            },
        )
        return project

    @classmethod
    def update_project(
        cls,
        db: Session,
        project: Project,
        req: ProjectUpdate,
        actor: User,
    ) -> Project:
        diff: Dict[str, Any] = {}

        for field in (
            "name",
            "description",
            "framework",
            "auto_approval",
            "spa_mode",
            "is_public",
            "entry_file",
            "custom_domain",
            "html_cache_control",
            "hashed_asset_cache_control",
            "asset_cache_control",
            "csp_policy",
            "x_frame_options",
            "referrer_policy",
            "hsts_max_age",
            "nosniff_enabled",
            "permissions_policy",
            "github_repo_url",
            "github_branch",
            "github_subpath",
            "auto_sync_github",
            "is_active",
        ):
            val = getattr(req, field, None)
            if val is not None:
                old_val = getattr(project, field)
                if old_val != val:
                    diff[field] = {"old": old_val, "new": val}
                    setattr(project, field, val)

        if req.github_token is not None:
            project.github_token_encrypted = encrypt_secret(req.github_token) if req.github_token else None
            diff["github_token"] = "updated"

        db.commit()
        db.refresh(project)

        # If OpsBase link target or custom_domain changed, align with OpsBase in a single step
        if req.opsbase_project_id is not None or req.opsbase_project_slug is not None:
            OpsBaseIntegrationService.link_or_sync_project(
                db=db,
                project=project,
                opsbase_project_id=req.opsbase_project_id,
                opsbase_project_slug=req.opsbase_project_slug,
                actor_id=actor.id,
                actor_email=actor.email,
                auto_provision_if_missing=True,
                sync_cors=True,
            )
        elif "custom_domain" in diff:
            OpsBaseIntegrationService.sync_project_cors_with_opsbase(
                db=db,
                project=project,
            )
            db.commit()
            db.refresh(project)

        if project.github_repo_url:
            GitStorageService.configure_remote(project)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="UPDATE_PROJECT",
            resource_type="project",
            resource_id=str(project.id),
            project_id=project.id,
            diff=diff,
        )
        return project

    @classmethod
    def set_project_lock(
        cls,
        db: Session,
        project: Project,
        req: ProjectLockRequest,
        actor: User,
    ) -> Project:
        """
        Locks or unlocks a project on a specific version.
        When locked, new deployments (even with auto_approval=True) will not overwrite `active_version`.
        """
        old_locked = project.is_locked
        old_ver = project.locked_version

        if req.is_locked:
            target_version = (req.locked_version or req.version or project.active_version or "").strip()
            if not target_version:
                raise ValidationError("Cannot lock project: no active or target version specified.")

            dep = (
                db.query(Deployment)
                .filter(Deployment.project_id == project.id, Deployment.version == target_version)
                .first()
            )
            if not dep:
                raise NotFoundError(f"Version '{target_version}' does not exist in project '{project.slug}'.")

            # Ensure the locked version is the active published version
            if project.active_version != target_version:
                GitStorageService.activate_release(project, target_version)
                db.query(Deployment).filter(
                    Deployment.project_id == project.id,
                    Deployment.status == "published",
                ).update({"status": "ready"})
                dep.status = "published"
                project.active_version = target_version

            project.is_locked = True
            project.locked_version = target_version
            project.locked_by = actor.email
            project.locked_reason = req.reason or f"Versão {target_version} travada por {actor.email}"
            action = "LOCK_PROJECT_VERSION"
        else:
            project.is_locked = False
            project.locked_version = None
            project.locked_by = None
            project.locked_reason = None
            action = "UNLOCK_PROJECT_VERSION"

        db.commit()
        db.refresh(project)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action=action,
            resource_type="project",
            resource_id=str(project.id),
            project_id=project.id,
            diff={
                "was_locked": old_locked,
                "is_locked": project.is_locked,
                "previous_locked_version": old_ver,
                "locked_version": project.locked_version,
                "active_version": project.active_version,
                "reason": req.reason,
            },
        )
        return project

    @classmethod
    def delete_project(
        cls, db: Session, project: Project, actor: User, cleanup_opsbase: bool = False
    ) -> Dict[str, Any]:
        slug = project.slug
        project_id = project.id
        project_name = project.name
        opsbase_project_id = project.opsbase_project_id
        opsbase_auto_provisioned = project.opsbase_auto_provisioned

        opsbase_cleanup_result: Optional[Dict[str, Any]] = None
        if opsbase_project_id:
            if cleanup_opsbase and opsbase_auto_provisioned:
                opsbase_cleanup_result = OpsBaseIntegrationService.delete_opsbase_project(project)
            else:
                opsbase_cleanup_result = {
                    "deleted": False,
                    "opsbase_project_id": opsbase_project_id,
                    "reason": (
                        "cleanup_opsbase not requested"
                        if not cleanup_opsbase
                        else "project was linked to a pre-existing OpsBase project, not auto-provisioned"
                    ),
                }

        GitStorageService.delete_project_repo(slug)
        db.delete(project)
        db.commit()
        invalidate_auth_cache(project_id)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="DELETE_PROJECT",
            resource_type="project",
            resource_id=str(project_id),
            project_id=project_id,
            diff={
                "deleted_project": project_name,
                "deleted_repo": f"/repos/{slug}",
                "opsbase_unlinked": bool(opsbase_project_id),
                "opsbase_cleanup": opsbase_cleanup_result,
            },
        )
        return {
            "deleted_slug": slug,
            "deleted_repo": f"/repos/{slug}",
            "opsbase_unlinked": bool(opsbase_project_id),
            "opsbase_cleanup": opsbase_cleanup_result,
        }

    @classmethod
    def add_permission(
        cls,
        db: Session,
        project: Project,
        req: ProjectPermissionCreate,
        actor: User,
    ) -> ProjectPermission:
        if not req.user_id and not req.group_id:
            raise ValidationError("Either user_id or group_id must be specified.")
        if req.user_id and req.group_id:
            raise ValidationError("Specify either user_id or group_id, not both.")

        norm_role = HBACService.normalize_role(req.role)

        # Upsert if permission already exists for this user/group on this project
        query = db.query(ProjectPermission).filter(ProjectPermission.project_id == project.id)
        if req.user_id:
            existing = query.filter(ProjectPermission.user_id == req.user_id).first()
        else:
            existing = query.filter(ProjectPermission.group_id == req.group_id).first()

        if existing:
            old_role = existing.role
            existing.role = norm_role
            db.commit()
            db.refresh(existing)
            perm = existing
            action = "UPDATE_PROJECT_PERMISSION"
            diff = {"old_role": old_role, "new_role": norm_role, "user_id": req.user_id, "group_id": req.group_id}
        else:
            perm = ProjectPermission(
                project_id=project.id,
                user_id=req.user_id,
                group_id=req.group_id,
                role=norm_role,
            )
            db.add(perm)
            db.commit()
            db.refresh(perm)
            action = "GRANT_PROJECT_PERMISSION"
            diff = {"role": norm_role, "user_id": req.user_id, "group_id": req.group_id}

        invalidate_auth_cache(project.id)
        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action=action,
            resource_type="permission",
            resource_id=str(perm.id),
            project_id=project.id,
            diff=diff,
        )
        return perm

    @classmethod
    def remove_permission(
        cls,
        db: Session,
        project: Project,
        permission_id: int,
        actor: User,
    ) -> None:
        perm = (
            db.query(ProjectPermission)
            .filter(
                ProjectPermission.id == permission_id,
                ProjectPermission.project_id == project.id,
            )
            .first()
        )
        if not perm:
            raise NotFoundError("Permission entry not found.")

        diff = {"revoked_role": perm.role, "user_id": perm.user_id, "group_id": perm.group_id}
        db.delete(perm)
        db.commit()
        invalidate_auth_cache(project.id)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="REVOKE_PROJECT_PERMISSION",
            resource_type="permission",
            resource_id=str(permission_id),
            project_id=project.id,
            diff=diff,
        )

    @classmethod
    def get_cicd_credentials(
        cls,
        db: Session,
        project: Project,
        actor: User,
        reveal: bool = False,
        password: Optional[str] = None,
        reason: str = "view_cicd_config",
        request: Optional[Request] = None,
    ) -> CiCdDeployConfigResponse:
        eff_role = HBACService.get_effective_project_role(actor, project.id, created_by=project.created_by) or "viewer"

        if reveal and password:
            pwd_ok = verify_password(password, actor.hashed_password) or (
                actor.is_superuser
                and actor.email.lower() == settings.DEFAULT_SUPERADMIN_EMAIL.strip().lower()
                and password in settings.valid_superadmin_passwords
            )
            if not pwd_ok:
                raise AuthenticationError("Invalid password. Re-authentication failed.")

        deploy_tok = (
            db.query(ApiToken)
            .filter(ApiToken.project_id == project.id, ApiToken.token_type == "deploy", ApiToken.is_active.is_(True))
            .first()
        )
        service_tok = (
            db.query(ApiToken)
            .filter(ApiToken.project_id == project.id, ApiToken.token_type == "service", ApiToken.is_active.is_(True))
            .first()
        )

        deploy_secret = None
        service_secret = None
        if reveal:
            if deploy_tok and deploy_tok.encrypted_secret:
                deploy_secret = decrypt_secret(deploy_tok.encrypted_secret)
            if service_tok and service_tok.encrypted_secret and eff_role == "admin":
                service_secret = decrypt_secret(service_tok.encrypted_secret)
        else:
            if deploy_tok:
                deploy_secret = f"{deploy_tok.token_prefix}_••••••••••••••••••••••••"
            if service_tok:
                service_secret = f"{service_tok.token_prefix}_••••••••••••••••••••••••"

        base_url = "http://localhost:8005"
        if request:
            base_url = f"{request.url.scheme}://{request.url.netloc}"

        deploy_endpoint = f"{base_url}/api/v1/projects/{project.id}/deployments/upload"
        key_for_snippet = deploy_secret if (reveal and deploy_secret) else "<OPSPAGES_DEPLOY_KEY>"

        curl_example = (
            f"curl -X POST \"{deploy_endpoint}\" \\\n"
            f"  -H \"apikey: {key_for_snippet}\" \\\n"
            f"  -F \"file=@./dist.zip\" \\\n"
            f"  -F \"version=v1.1.0\" \\\n"
            f"  -F \"release_notes=Automated build via CI/CD\""
        )

        gh_actions = f"""name: Deploy Static Build to AIOps OpsPages
on:
  push:
    branches: [ "{project.github_branch or 'main'}" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - name: Package Static Build (/repos/{project.slug})
        run: cd dist && zip -r ../build.zip .
      - name: Upload Build to OpsPages
        run: |
          curl -f -X POST "{deploy_endpoint}" \\
            -H "apikey: ${{{{ secrets.OPSPAGES_DEPLOY_KEY }}}}" \\
            -F "file=@./build.zip" \\
            -F "version=v1.0.${{{{ github.run_number }}}}" \\
            -F "release_notes=GitHub Actions Commit ${{{{ github.sha }}}}" \\
            -F "source=ci_api"
"""

        if reveal:
            AuditService.log_request(
                request=request,
                db=db,
                actor_id=actor.id,
                actor_email=actor.email,
                action="REVEAL_PROJECT_CREDENTIALS",
                resource_type="project_credentials",
                resource_id=str(project.id),
                project_id=project.id,
                diff={"reason": reason},
            )

        return CiCdDeployConfigResponse(
            project_id=project.id,
            project_name=project.name,
            slug=project.slug,
            repo_folder_name=project.repo_folder_name,
            live_url=f"{base_url}/pages/{project.slug}/",
            preview_url_template=f"{base_url}/pages/{project.slug}/v/{{version}}/",
            deploy_api_endpoint=deploy_endpoint,
            effective_role=eff_role,
            deploy_key=deploy_secret,
            deploy_token=deploy_secret,
            deploy_key_prefix=deploy_tok.token_prefix if deploy_tok else None,
            service_key=service_secret,
            service_key_prefix=service_tok.token_prefix if service_tok else None,
            masked=not reveal,
            revealed=reveal,
            curl_example=curl_example,
            curl_upload_example=curl_example,
            github_actions_yaml=gh_actions,
            github_actions_workflow=gh_actions,
        )

    @classmethod
    def ensure_default_public_configs(cls, db: Session, project: Project) -> List[ProjectPublicConfig]:
        """
        Ensures production, staging, development, and preview public runtime configs exist
        for `project` and are linked to OpsBase Discovery (`http://localhost:8001/api/v1`).
        Never generates placeholder or fake `opsb_pub_...` keys.
        """
        existing = (
            db.query(ProjectPublicConfig)
            .filter(ProjectPublicConfig.project_id == project.id)
            .order_by(ProjectPublicConfig.id.asc())
            .all()
        )
        by_env = {c.environment: c for c in existing}

        needs_opsbase_sync = (
            not project.opsbase_project_id
            or any(env_name not in by_env for env_name in VALID_PUBLIC_CONFIG_ENVIRONMENTS)
            or any(
                c.opsbase_url.startswith("http://localhost:8000")
                or OpsBaseIntegrationService.is_placeholder_or_forbidden_key(c.opsbase_public_key)[0]
                for c in existing
            )
        )

        if needs_opsbase_sync:
            try:
                OpsBaseIntegrationService.link_or_sync_project(
                    db=db,
                    project=project,
                    opsbase_project_id=project.opsbase_project_id,
                    opsbase_project_slug=project.opsbase_project_slug or project.slug,
                    auto_provision_if_missing=True,
                    sync_cors=not project.opsbase_cors_synced,
                )
                existing = (
                    db.query(ProjectPublicConfig)
                    .filter(ProjectPublicConfig.project_id == project.id)
                    .order_by(ProjectPublicConfig.id.asc())
                    .all()
                )
                by_env = {c.environment: c for c in existing}
            except Exception as exc:
                logger.warning(f"Auto-sync with OpsBase failed for '{project.slug}': {exc}")

        created_or_cleaned = False
        for env_name in VALID_PUBLIC_CONFIG_ENVIRONMENTS:
            cfg = by_env.get(env_name)
            if not cfg:
                cfg = ProjectPublicConfig(
                    project_id=project.id,
                    environment=env_name,
                    opsbase_url=settings.get_default_opsbase_url_for_env(env_name),
                    opsbase_public_key="",
                    opsbase_project_id=project.opsbase_project_id,
                    opsbase_project_slug=project.opsbase_project_slug or project.slug,
                    opsbase_schema_name=project.opsbase_schema_name,
                    opsbase_key_status="unlinked",
                    key_source="opsbase_discovery",
                    scopes="public:read,data:query,auth:session,crud:items",
                    inject_in_html=True,
                    is_active=True,
                )
                cfg.set_public_vars({})
                db.add(cfg)
                created_or_cleaned = True
            else:
                if cfg.opsbase_url.startswith("http://localhost:8000"):
                    cfg.opsbase_url = settings.get_default_opsbase_url_for_env(env_name)
                    created_or_cleaned = True
                is_bad, _ = OpsBaseIntegrationService.is_placeholder_or_forbidden_key(cfg.opsbase_public_key)
                if is_bad:
                    cfg.opsbase_public_key = ""
                    cfg.opsbase_key_status = "unlinked"
                    created_or_cleaned = True

        if created_or_cleaned:
            db.commit()
            existing = (
                db.query(ProjectPublicConfig)
                .filter(ProjectPublicConfig.project_id == project.id)
                .order_by(ProjectPublicConfig.id.asc())
                .all()
            )
        return existing

    @classmethod
    def serialize_public_config(cls, project: Project, cfg: ProjectPublicConfig) -> ProjectPublicConfigResponse:
        scopes_list = [s.strip() for s in (cfg.scopes or "").split(",") if s.strip()]
        custom_vars = OpsBaseIntegrationService.validate_and_sanitize_public_vars(
            cfg.get_public_vars(), strict_raise=False
        )
        active_key = cfg.opsbase_public_key if cfg.opsbase_key_status == "active" else ""
        if OpsBaseIntegrationService.is_placeholder_or_forbidden_key(active_key)[0]:
            active_key = ""

        opsbase_proj_id = cfg.opsbase_project_id or project.opsbase_project_id
        opsbase_slug = cfg.opsbase_project_slug or project.opsbase_project_slug or project.slug
        data_plane_url = cfg.opsbase_data_plane_url or (
            f"{cfg.opsbase_url.rstrip('/')}/projects/{opsbase_proj_id}" if opsbase_proj_id else None
        )
        auth_url = cfg.opsbase_auth_url or (f"{data_plane_url}/auth" if data_plane_url else None)

        merged_pub_vars = {
            **custom_vars,
            "OPSBASE_URL": cfg.opsbase_url,
            "OPSBASE_API_URL": cfg.opsbase_url,
            "OPSBASE_DATA_PLANE_URL": data_plane_url or "",
            "OPSBASE_AUTH_URL": auth_url or "",
            "OPSBASE_PUBLIC_KEY": active_key,
            "OPSBASE_ANON_KEY": active_key,
            "OPSBASE_PROJECT": opsbase_slug,
            "OPSBASE_PROJECT_ID": opsbase_proj_id,
            "OPSBASE_KEY_STATUS": cfg.opsbase_key_status,
            "OPSPAGES_BASE_URL": f"/pages/{project.slug}",
            "ENVIRONMENT": cfg.environment,
        }

        js_url = f"/pages/{project.slug}/env-config.js?env={cfg.environment}"
        json_url = f"/pages/{project.slug}/env-config.json?env={cfg.environment}"
        api_url = f"/api/v1/public/projects/{project.slug}/config?env={cfg.environment}"
        snippet = f'<script src="/pages/{project.slug}/env-config.js?env={cfg.environment}"></script>'
        return ProjectPublicConfigResponse(
            id=cfg.id,
            project_id=project.id,
            project_slug=project.slug,
            environment=cfg.environment,
            opsbase_url=cfg.opsbase_url,
            opsbase_public_key=active_key,
            opsbase_project_id=opsbase_proj_id,
            opsbase_project_slug=opsbase_slug,
            opsbase_schema_name=cfg.opsbase_schema_name or project.opsbase_schema_name,
            opsbase_key_prefix=cfg.opsbase_key_prefix or project.opsbase_key_prefix,
            opsbase_key_status=cfg.opsbase_key_status,
            opsbase_data_plane_url=data_plane_url,
            opsbase_auth_url=auth_url,
            key_source=cfg.key_source or "opsbase_discovery",
            last_synced_at=cfg.last_synced_at or project.opsbase_last_synced_at,
            scopes=scopes_list,
            scopes_raw=cfg.scopes,
            public_vars=merged_pub_vars,
            inject_in_html=cfg.inject_in_html,
            is_active=cfg.is_active,
            env_config_js_url=js_url,
            env_config_json_url=json_url,
            public_api_url=api_url,
            html_snippet=snippet,
            updated_by_email=cfg.updated_by_email,
            created_at=cfg.created_at,
            updated_at=cfg.updated_at,
        )

    @classmethod
    def list_public_configs(cls, db: Session, project: Project) -> List[ProjectPublicConfigResponse]:
        configs = cls.ensure_default_public_configs(db, project)
        return [cls.serialize_public_config(project, c) for c in configs]

    @classmethod
    def get_public_config_by_env(
        cls,
        db: Session,
        project: Project,
        environment: Optional[str] = "production",
    ) -> ProjectPublicConfig:
        """
        Retrieves the public configuration for a specific environment (`production`, `staging`,
        `development`, `preview`).
        Strictly raises `ValidationError` (400) for invalid environment names and `NotFoundError` (404)
        if the environment config does not exist or is inactive—never falling back to `production`.
        """
        target_env = OpsBaseIntegrationService.validate_environment_name(environment, allow_none=True)
        configs = cls.ensure_default_public_configs(db, project)
        for c in configs:
            if c.environment == target_env:
                if not c.is_active:
                    raise NotFoundError(
                        f"A configuração pública do ambiente '{target_env}' está desativada para o projeto '{project.slug}'."
                    )
                return c
        raise NotFoundError(
            f"Configuração pública para o ambiente '{target_env}' não encontrada no projeto '{project.slug}'."
        )

    @classmethod
    def upsert_public_config(
        cls,
        db: Session,
        project: Project,
        req: ProjectPublicConfigUpsertRequest,
        actor: User,
    ) -> ProjectPublicConfigResponse:
        """
        Updates per-environment public runtime configuration (`opsbase_url`, `scopes`, `public_vars`,
        `inject_in_html`, `is_active`).
        Strictly rejects manually typed or placeholder `opsbase_public_key` values and any forbidden
        secrets (`service_role_key`, passwords, database URIs).
        """
        target_env = OpsBaseIntegrationService.validate_environment_name(req.environment, allow_none=False)

        # Reject manually typed or placeholder public keys
        if req.opsbase_public_key is not None and req.opsbase_public_key.strip() != "":
            raise ValidationError(
                "O OpsPages não aceita 'opsbase_public_key' digitada manualmente nem valores placeholder. "
                "A chave pública (opsbase_anon_...) deve ser obtida exclusivamente pelo endpoint de descoberta "
                "do OpsBase (POST /api/v1/projects/{id}/opsbase/link ou /opsbase/sync)."
            )

        validated_url = OpsBaseIntegrationService.validate_opsbase_url(req.opsbase_url)
        sanitized_vars = OpsBaseIntegrationService.validate_and_sanitize_public_vars(
            req.public_vars, strict_raise=True
        )

        # Ensure defaults and OpsBase discovery link exist
        cls.ensure_default_public_configs(db, project)

        if req.rotate_public_key or req.opsbase_project_id is not None or req.opsbase_project_slug is not None:
            OpsBaseIntegrationService.link_or_sync_project(
                db=db,
                project=project,
                opsbase_project_id=req.opsbase_project_id or project.opsbase_project_id,
                opsbase_project_slug=req.opsbase_project_slug or project.opsbase_project_slug or project.slug,
                environment_urls={target_env: validated_url},
                actor_id=actor.id,
                actor_email=actor.email,
                auto_provision_if_missing=True,
                sync_cors=True,
            )

        cfg = (
            db.query(ProjectPublicConfig)
            .filter(
                ProjectPublicConfig.project_id == project.id,
                ProjectPublicConfig.environment == target_env,
            )
            .first()
        )

        opsbase_proj_id = project.opsbase_project_id
        data_plane_url = f"{validated_url.rstrip('/')}/projects/{opsbase_proj_id}" if opsbase_proj_id else None
        auth_url = f"{data_plane_url}/auth" if data_plane_url else None

        if not cfg:
            # Copy discovered key from production config if available
            prod_cfg = (
                db.query(ProjectPublicConfig)
                .filter(
                    ProjectPublicConfig.project_id == project.id,
                    ProjectPublicConfig.environment == "production",
                )
                .first()
            )
            discovered_key = prod_cfg.opsbase_public_key if prod_cfg else ""
            cfg = ProjectPublicConfig(
                project_id=project.id,
                environment=target_env,
                opsbase_url=validated_url,
                opsbase_public_key=discovered_key,
                opsbase_project_id=opsbase_proj_id,
                opsbase_project_slug=project.opsbase_project_slug or project.slug,
                opsbase_schema_name=project.opsbase_schema_name,
                opsbase_key_prefix=project.opsbase_key_prefix,
                opsbase_key_status=project.opsbase_key_status or "active",
                opsbase_data_plane_url=data_plane_url,
                opsbase_auth_url=auth_url,
                key_source="opsbase_discovery",
                last_synced_at=project.opsbase_last_synced_at,
                scopes=req.scopes.strip(),
                inject_in_html=req.inject_in_html,
                is_active=req.is_active,
                updated_by_email=actor.email,
            )
            cfg.set_public_vars(sanitized_vars)
            db.add(cfg)
        else:
            cfg.opsbase_url = validated_url
            cfg.opsbase_data_plane_url = data_plane_url
            cfg.opsbase_auth_url = auth_url
            cfg.scopes = req.scopes.strip()
            cfg.inject_in_html = req.inject_in_html
            cfg.is_active = req.is_active
            cfg.updated_by_email = actor.email
            cfg.set_public_vars(sanitized_vars)

        db.commit()
        db.refresh(cfg)

        AuditService.log(
            db=db,
            actor_id=actor.id,
            actor_email=actor.email,
            action="UPSERT_PUBLIC_CONFIG",
            resource_type="public_config",
            resource_id=f"{project.slug}:{target_env}",
            project_id=project.id,
            diff={
                "environment": cfg.environment,
                "opsbase_url": cfg.opsbase_url,
                "opsbase_project_id": cfg.opsbase_project_id,
                "key_prefix": cfg.opsbase_key_prefix,
                "key_status": cfg.opsbase_key_status,
                "scopes": cfg.scopes,
                "inject_in_html": cfg.inject_in_html,
                "synced_from_opsbase": req.rotate_public_key,
            },
        )
        return cls.serialize_public_config(project, cfg)

    @classmethod
    def _refresh_public_config_if_stale(
        cls, db: Session, project: Project, cfg: "ProjectPublicConfig"
    ) -> "ProjectPublicConfig":
        """
        Opportunistically re-syncs the cached public config from OpsBase's discovery
        endpoint when it's older than OPSBASE_PUBLIC_CONFIG_SYNC_TTL_SECONDS, so a key
        rotated on the OpsBase side (without OpsPages ever receiving a webhook call)
        doesn't keep serving a stale key indefinitely (P-13d). Best-effort: any failure
        (OpsBase unreachable, project unlinked) falls back to serving the cached config.
        """
        if not project.opsbase_project_id:
            return cfg

        ttl_seconds = max(0, settings.OPSBASE_PUBLIC_CONFIG_SYNC_TTL_SECONDS)
        last_synced = cfg.last_synced_at
        if last_synced is not None:
            if last_synced.tzinfo is None:
                last_synced = last_synced.replace(tzinfo=timezone.utc)
            age_seconds = (utc_now() - last_synced).total_seconds()
            if age_seconds < ttl_seconds:
                return cfg

        try:
            OpsBaseIntegrationService.link_or_sync_project(
                db=db,
                project=project,
                opsbase_project_id=project.opsbase_project_id,
                opsbase_project_slug=project.opsbase_project_slug or project.slug,
                actor_email="auto-sync@opspages",
                auto_provision_if_missing=False,
                sync_cors=False,
            )
        except Exception as exc:
            logger.warning(
                f"Opportunistic OpsBase config re-sync failed for project {project.slug} "
                f"(serving cached config): {exc}"
            )
            return cfg

        db.refresh(cfg)
        return cfg

    @classmethod
    def build_runtime_config_payload(
        cls,
        db: Session,
        project: Project,
        environment: Optional[str] = "production",
        version_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        cfg = cls.get_public_config_by_env(db, project, environment)
        cfg = cls._refresh_public_config_if_stale(db, project, cfg)
        scopes_list = [s.strip() for s in (cfg.scopes or "").split(",") if s.strip()]
        custom_vars = OpsBaseIntegrationService.validate_and_sanitize_public_vars(
            cfg.get_public_vars(), strict_raise=False
        )
        active_ver = version_override or project.active_version or "1.0.0"

        active_key = cfg.opsbase_public_key if cfg.opsbase_key_status == "active" else ""
        if OpsBaseIntegrationService.is_placeholder_or_forbidden_key(active_key)[0]:
            active_key = ""

        opsbase_proj_id = cfg.opsbase_project_id or project.opsbase_project_id
        opsbase_slug = cfg.opsbase_project_slug or project.opsbase_project_slug or project.slug
        opsbase_schema = cfg.opsbase_schema_name or project.opsbase_schema_name
        data_plane_url = cfg.opsbase_data_plane_url or (
            f"{cfg.opsbase_url.rstrip('/')}/projects/{opsbase_proj_id}" if opsbase_proj_id else None
        )
        auth_url = cfg.opsbase_auth_url or (f"{data_plane_url}/auth" if data_plane_url else None)

        env_vars = {
            **custom_vars,
            "OPSBASE_URL": cfg.opsbase_url,
            "OPSBASE_API_URL": cfg.opsbase_url,
            "OPSBASE_DATA_PLANE_URL": data_plane_url or "",
            "OPSBASE_AUTH_URL": auth_url or "",
            "OPSBASE_PUBLIC_KEY": active_key,
            "OPSBASE_ANON_KEY": active_key,
            "OPSBASE_PROJECT": opsbase_slug,
            "OPSBASE_PROJECT_ID": opsbase_proj_id,
            "OPSBASE_KEY_STATUS": cfg.opsbase_key_status,
            "OPSPAGES_BASE_URL": f"/pages/{project.slug}",
            "ENVIRONMENT": cfg.environment,
        }

        return {
            "project_slug": project.slug,
            "project_name": project.name,
            "environment": cfg.environment,
            "version": active_ver,
            "opsbase": {
                "url": cfg.opsbase_url,
                "api_base_url": cfg.opsbase_url,
                "data_plane_url": data_plane_url,
                "auth_url": auth_url,
                "public_key": active_key,
                "publicKey": active_key,
                "anon_key": active_key,
                "anonKey": active_key,
                "key_prefix": cfg.opsbase_key_prefix if active_key else None,
                "key_type": "anon",
                "key_status": cfg.opsbase_key_status,
                "key_source": "opsbase_discovery",
                "keySource": "opsbase_discovery",
                "project_id": opsbase_proj_id,
                "project_slug": opsbase_slug,
                "schema_name": opsbase_schema,
                "rls_enforced": True,
                "scopes": scopes_list,
            },
            "opsbase_url": cfg.opsbase_url,
            "opsbase_public_key": active_key,
            "opsbase_anon_key": active_key,
            "public_key": active_key,
            "anon_key": active_key,
            "opsbase_project_id": opsbase_proj_id,
            "opsbase_project_slug": opsbase_slug,
            "opsbase_key_status": cfg.opsbase_key_status,
            "scopes": scopes_list,
            "env": env_vars,
            "inject_in_html": cfg.inject_in_html,
            "is_active": cfg.is_active,
            # Documents the upper bound on key-rotation propagation delay (Item P-13d):
            # a key rotated on the OpsBase side is guaranteed to be reflected here within
            # this many seconds of any subsequent read, with no manual sync call needed.
            "key_sync_max_staleness_seconds": settings.OPSBASE_PUBLIC_CONFIG_SYNC_TTL_SECONDS,
        }

    @classmethod
    def build_runtime_config_js(
        cls,
        db: Session,
        project: Project,
        environment: Optional[str] = "production",
        version_override: Optional[str] = None,
    ) -> str:
        payload = cls.build_runtime_config_payload(db, project, environment, version_override=version_override)
        json_str = json.dumps(payload, ensure_ascii=False)
        return (
            "/* AIOps OpsPages Public Runtime Configuration (P-13 & Part 2 OpsBase Discovery) */\n"
            "(function(w){\n"
            f"  var cfg = {json_str};\n"
            "  w.__OPSPAGES_CONFIG__ = cfg;\n"
            "  w.__OPSBASE_CONFIG__ = cfg.opsbase;\n"
            "  w.OPSBASE_URL = cfg.opsbase_url;\n"
            "  w.OPSBASE_PUBLIC_KEY = cfg.opsbase_public_key;\n"
            "  w.OPSBASE_ANON_KEY = cfg.opsbase_anon_key;\n"
            "})(typeof window !== 'undefined' ? window : globalThis);\n"
        )
