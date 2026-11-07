"""
AIOps OpsPages - Main FastAPI Application & Static Pages Server.
Follows Loft Backend Foundation Vol I & Engineering System standards.
Implements P-1 through P-13 Security, Caching, Conditional Requests, Preview Isolation, and Runtime Config Injection.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from email.utils import formatdate, parsedate_to_datetime
import hashlib
import json
import mimetypes
from pathlib import Path
import re
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, FastAPI, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from sqlalchemy import desc
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.deployments import router as deployments_router
from app.api.v1.git_repos import router as git_repos_router
from app.api.v1.governance_routes import (
    audit_router,
    cors_router,
    errors_router,
    public_projects_router,
    quotas_router,
    tokens_router,
    webhooks_router,
)
from app.api.v1.groups import router as groups_router
from app.api.v1.projects import router as projects_router
from app.api.v1.users import router as users_router
from app.core.config import settings
from app.core.errors import AuthenticationError, AuthorizationError, NotFoundError, ValidationError, register_error_handlers
from app.core.logging import RequestLoggingMiddleware, setup_logging
from app.db.session import SessionLocal, get_db_engine_info, get_meta_db, init_meta_db
from app.models.meta_models import Deployment, Group, Project, User
from app.schemas.project import ProjectCreate
from app.services.auth_service import resolve_optional_user_from_request
from app.services.git_storage_service import GitStorageService
from app.services.hbac_service import HBACService
from app.services.opsbase_service import OpsBaseIntegrationService
from app.services.project_service import ProjectService

logger = setup_logging(settings.LOG_LEVEL)

DEFAULT_CSP_POLICY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "img-src 'self' data: blob: https: http:; "
    "font-src 'self' data: https://fonts.gstatic.com https:; "
    "connect-src 'self' http://localhost:* http://127.0.0.1:* https: ws: wss:; "
    "frame-ancestors 'self'; "
    "base-uri 'self'; "
    "object-src 'none'"
)

HASHED_ASSET_REGEX = re.compile(
    r"(^|/|[-_.])[a-zA-Z0-9_-]{6,}\.(js|mjs|css|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|gif|wasm)$",
    re.IGNORECASE,
)


def _apply_default_security_headers(headers: Any, project: Optional[Project] = None) -> None:
    """Applies P-2 security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy)."""
    if project:
        csp = (getattr(project, "csp_policy", None) or DEFAULT_CSP_POLICY).strip()
        if "frame-ancestors" not in csp:
            csp = f"{csp.rstrip(';')}; frame-ancestors 'self'"
        xfo = (getattr(project, "x_frame_options", None) or "SAMEORIGIN").strip()
        ref = (getattr(project, "referrer_policy", None) or "strict-origin-when-cross-origin").strip()
        hsts_age = getattr(project, "hsts_max_age", None)
        if hsts_age is None:
            hsts_age = 31536000
        nosniff = getattr(project, "nosniff_enabled", True)
        perms = (getattr(project, "permissions_policy", None) or "camera=(), microphone=(), geolocation=()").strip()
    else:
        csp = DEFAULT_CSP_POLICY
        xfo = "SAMEORIGIN"
        ref = "strict-origin-when-cross-origin"
        hsts_age = 31536000
        nosniff = True
        perms = "camera=(), microphone=(), geolocation=()"

    headers.setdefault("Content-Security-Policy", csp)
    if nosniff:
        headers.setdefault("X-Content-Type-Options", "nosniff")
    headers.setdefault("X-Frame-Options", xfo)
    headers.setdefault("Referrer-Policy", ref)
    headers.setdefault("Strict-Transport-Security", f"max-age={hsts_age}; includeSubDomains")
    headers.setdefault("Permissions-Policy", perms)


class StrictCorsAndSecurityMiddleware(BaseHTTPMiddleware):
    """
    Enforces:
    - P-10: Explicit origin allowlist for API routes (no arbitrary localhost ports, no wildcard with credentials).
    - P-9: Never injects global CORS headers on `/pages/{project_slug}...` (handled strictly per project).
    - P-2: Default security headers on all responses.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path or "/"
        is_pages_route = path.startswith("/pages/")
        req_origin = (request.headers.get("origin") or "").strip()
        allowed_api_origins = set(settings.CORS_ORIGINS or [])

        # Handle API preflight OPTIONS strictly against explicit allowlist (P-10)
        if not is_pages_route and request.method == "OPTIONS":
            headers: Dict[str, str] = {
                "Vary": "Origin",
                "Allow": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
            }
            _apply_default_security_headers(headers)
            if req_origin and req_origin in allowed_api_origins:
                headers["Access-Control-Allow-Origin"] = req_origin
                headers["Access-Control-Allow-Credentials"] = "true"
                headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
                headers["Access-Control-Allow-Headers"] = (
                    "Authorization, Content-Type, Accept, Origin, X-Requested-With, apikey, x-api-key"
                )
                headers["Access-Control-Max-Age"] = "3600"
            return Response(status_code=204, headers=headers)

        response = await call_next(request)

        # Always add Vary: Origin
        existing_vary = response.headers.get("Vary", "")
        if "Origin" not in existing_vary:
            response.headers["Vary"] = f"{existing_vary}, Origin".strip(", ") if existing_vary else "Origin"

        # Apply default P-2 security headers if not already set by project handler
        _apply_default_security_headers(response.headers)

        if not is_pages_route:
            # P-10: Strict API CORS validation against explicit allowlist only
            if req_origin and req_origin in allowed_api_origins:
                response.headers["Access-Control-Allow-Origin"] = req_origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = (
                    "Authorization, Content-Type, Accept, Origin, X-Requested-With, apikey, x-api-key"
                )
            else:
                # Never emit Access-Control-Allow-Origin or Access-Control-Allow-Credentials for untrusted origins
                if "Access-Control-Allow-Origin" in response.headers:
                    del response.headers["Access-Control-Allow-Origin"]
                if "Access-Control-Allow-Credentials" in response.headers:
                    del response.headers["Access-Control-Allow-Credentials"]

        return response


def _seed_demo_project_if_empty() -> None:
    """
    Removes the legacy mock project ('loft-design-portal') if present and provisions
    the real 'Portal Loft' ('portal-loft') v1.1.0 project built in TypeScript.
    """
    from app.services.deployment_service import DeploymentService

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.is_superuser.is_(True)).first()
        if not admin:
            return

        mock_proj = db.query(Project).filter(Project.slug == "loft-design-portal").first()
        if mock_proj:
            logger.info("Removing mock project 'loft-design-portal'...")
            ProjectService.delete_project(db, mock_proj, admin)

        portal_proj = db.query(Project).filter(Project.slug == "portal-loft").first()
        workspace_site_dir = GitStorageService.get_workspace_site_source_dir("portal-loft")
        dist_dir = workspace_site_dir / "dist"

        if not portal_proj:
            logger.info("Provisioning real TypeScript project 'Portal Loft' (slug: portal-loft) v1.1.0...")
            portal_proj = ProjectService.create_project(
                db=db,
                req=ProjectCreate(
                    name="Portal Loft",
                    slug="portal-loft",
                    description="Portal de notícias de Tecnologia, Inteligência Artificial, Engenharia de Software e Cloud construído em TypeScript no padrão Copan Design System (Multilíngue PT-BR, EN, ES).",
                    framework="typescript-static",
                    auto_approval=True,
                    spa_mode=True,
                    is_public=True,
                    entry_file="index.html",
                    github_repo_url="https://github.com/loft-br/portal-loft.git",
                    github_branch="main",
                    github_subpath="/repos",
                    seed_initial_build=False,
                ),
                actor=admin,
            )

            if dist_dir.exists():
                DeploymentService.deploy_from_directory(
                    db=db,
                    project=portal_proj,
                    build_dir=dist_dir,
                    actor=admin,
                    version="1.1.0",
                    release_notes="Release 1.1.0 — Seletor de Idiomas (PT-BR, EN, ES), Favoritos/Lista de Leitura, Resumo IA Inline (TL;DR), Narração em Áudio e Filtro de Tópicos em Alta",
                    source="typescript_build",
                    source_code_dir=workspace_site_dir,
                )
        else:
            if workspace_site_dir.exists():
                ver = portal_proj.active_version or "1.1.0"
                if not GitStorageService.get_source_dir("portal-loft", ver).exists():
                    GitStorageService.save_source_snapshot("portal-loft", ver, workspace_site_dir)
    except Exception as e:
        logger.warning(f"Portal Loft provisioning warning: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Olivelas SmartPages metadata database and /repos storage...")
    init_meta_db()
    logger.info("Olivelas SmartPages ready to serve API and static pages.")
    yield
    logger.info("Olivelas SmartPages shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GitHub Pages / Vercel-like Static Build Hosting & Git Versioning Control Plane for Loft.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 1. Register Error Handlers
register_error_handlers(app)

# 2. Register Middleware (Strict CORS & Security Headers - P-2, P-9, P-10)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(StrictCorsAndSecurityMiddleware)

# 3. Mount API v1 Routers
api_v1_router = APIRouter(prefix=settings.API_V1_STR)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(groups_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(deployments_router)
api_v1_router.include_router(git_repos_router)
api_v1_router.include_router(tokens_router)
api_v1_router.include_router(quotas_router)
api_v1_router.include_router(cors_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(public_projects_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(errors_router)


@api_v1_router.get("/public/overview", tags=["Public Overview"])
def get_public_overview(request: Request, db: Session = Depends(get_meta_db)):
    """
    Returns public project catalog and platform showcase for the Landing Page.
    P-11 Security: Unauthenticated requests NEVER receive user e-mails, internal disk paths, or internal user/group statistics.
    """
    auth_user = resolve_optional_user_from_request(request, db)
    is_authenticated = auth_user is not None

    db_info = get_db_engine_info()
    public_projects = (
        db.query(Project)
        .filter(Project.is_active.is_(True), Project.is_public.is_(True))
        .order_by(desc(Project.updated_at))
        .all()
    )
    featured = public_projects[0] if public_projects else None

    featured_data = None
    if featured:
        featured_data = {
            "id": featured.id,
            "name": featured.name,
            "slug": featured.slug,
            "description": featured.description,
            "framework": featured.framework,
            "active_version": featured.active_version,
            "is_locked": featured.is_locked,
            "locked_version": featured.locked_version,
            "auto_approval": featured.auto_approval,
            "spa_mode": featured.spa_mode,
            "live_url": featured.live_url,
        }

        if is_authenticated:
            # Deployment history and git metadata (branch, tags, commit log, GitHub repo
            # URL/subpath, sync settings) are only meaningful to someone who can already
            # manage the project — an anonymous landing-page visitor gets the minimal
            # public identity above and nothing else (Item P-11).
            deps = (
                db.query(Deployment)
                .filter(Deployment.project_id == featured.id)
                .order_by(desc(Deployment.created_at))
                .limit(10)
                .all()
            )
            try:
                git_st = GitStorageService.get_repo_status(featured, limit=10).model_dump()
            except Exception:
                git_st = {"initialized": False, "branch": "main", "head_sha": None, "total_commits": 0, "tags": [], "commits": []}

            featured_deployments = []
            for d in deps:
                featured_deployments.append({
                    "id": d.id,
                    "version": d.version,
                    "git_tag": d.git_tag,
                    "status": d.status,
                    "source": d.source,
                    "file_count": d.file_count,
                    "size_bytes": d.size_bytes,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                    "preview_url": f"/pages/{featured.slug}/v/{d.version}/",
                    "git_commit_sha": d.git_commit_sha,
                    "release_notes": d.release_notes,
                    "deployed_by_email": d.created_by_email,
                    "created_by_email": d.created_by_email,
                    "approved_by_email": d.approved_by_email,
                })

            featured_data["github_branch"] = featured.github_branch
            featured_data["deployments"] = featured_deployments
            featured_data["git_status"] = git_st
            featured_data["repo_disk_path"] = f"/repos/{featured.slug}"

    response_payload: Dict[str, Any] = {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supported_engines": db_info["supported_engines"],
        "featured_project": featured_data,
        "public_projects": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "framework": p.framework,
                "active_version": p.active_version,
                "is_locked": p.is_locked,
                "locked_version": p.locked_version,
                "auto_approval": p.auto_approval,
                "spa_mode": p.spa_mode,
                "live_url": p.live_url,
                "deployment_count": db.query(Deployment).filter(Deployment.project_id == p.id).count(),
            }
            for p in public_projects
        ],
    }

    if is_authenticated:
        response_payload["database_dialect"] = db_info["dialect"]
        response_payload["repos_root"] = db_info["repos_root"]
        response_payload["stats"] = {
            "total_projects": db.query(Project).count(),
            "total_deployments": db.query(Deployment).count(),
            "total_users": db.query(User).count(),
            "total_groups": db.query(Group).count(),
        }
    else:
        response_payload["stats"] = {
            "public_projects": len(public_projects),
        }

    return response_payload


@api_v1_router.get("/public/projects/{slug}/download-build", tags=["Public Overview"])
def download_public_project_build(
    slug: str,
    request: Request,
    version: Optional[str] = Query(None, description="Release version to download (defaults to active_version)"),
    db: Session = Depends(get_meta_db),
) -> Response:
    resolve_optional_user_from_request(request, db)  # Enforces P-8 (?token= rejection)
    project = db.query(Project).filter(Project.slug == slug, Project.is_active.is_(True)).first()
    if not project:
        raise NotFoundError(f"Project '{slug}' not found.")
    zip_bytes, zip_filename = GitStorageService.build_release_zip_bytes(project, version)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
        },
    )


@api_v1_router.get("/public/projects/{slug}/download-source", tags=["Public Overview"])
def download_public_project_source(
    slug: str,
    request: Request,
    version: Optional[str] = Query(None, description="Release version source to download (defaults to active_version)"),
    db: Session = Depends(get_meta_db),
) -> Response:
    resolve_optional_user_from_request(request, db)  # Enforces P-8 (?token= rejection)
    project = db.query(Project).filter(Project.slug == slug, Project.is_active.is_(True)).first()
    if not project:
        raise NotFoundError(f"Project '{slug}' not found.")
    zip_bytes, zip_filename = GitStorageService.build_source_zip_bytes(project, version)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
        },
    )


app.include_router(api_v1_router)


# ==============================================================================
# 4. Static Pages & SPA Hosting Engine (/pages/{project_slug}/...)
#    Implements P-1, P-2, P-3, P-4, P-5, P-7, P-8, P-9, P-13
# ==============================================================================

def _build_project_cors_and_security_headers(project: Project, request: Request) -> Dict[str, str]:
    """
    Computes strict per-project CORS headers (P-9) and Security headers (P-2):
    - Exact match of request Origin against active project CorsRules and custom_domain.
    - Always includes Vary: Origin.
    - Never combines Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true.
    - Never returns Access-Control-Allow-Origin or Access-Control-Allow-Credentials for origins not in the allowlist.
    """
    headers: Dict[str, str] = {
        "Vary": "Origin",
        "X-OpsPages-Project": project.slug,
        "X-OpsPages-Locked": str(project.is_locked).lower(),
        "Accept-Ranges": "bytes",
    }
    _apply_default_security_headers(headers, project=project)

    req_origin = (request.headers.get("origin") or "").strip()
    active_rules = [r for r in (project.cors_rules or []) if r.is_active]

    if not req_origin:
        return headers

    # 1. Exact match against explicit (non-wildcard) active rules
    exact_rule = next((r for r in active_rules if r.origin != "*" and r.origin == req_origin), None)
    if exact_rule:
        headers["Access-Control-Allow-Origin"] = req_origin
        headers["Access-Control-Allow-Methods"] = exact_rule.allowed_methods or "GET,HEAD,OPTIONS"
        headers["Access-Control-Allow-Headers"] = exact_rule.allowed_headers or "*"
        headers["Access-Control-Max-Age"] = str(getattr(exact_rule, "max_age_seconds", 3600) or 3600)
        if getattr(exact_rule, "allow_credentials", False):
            headers["Access-Control-Allow-Credentials"] = "true"
        return headers

    # 2. Match against project's configured custom_domain (P-9 support for custom domains per project)
    if project.custom_domain:
        cd = project.custom_domain.strip().rstrip("/")
        cd_origins = {cd, f"https://{cd}", f"http://{cd}"}
        if req_origin in cd_origins:
            headers["Access-Control-Allow-Origin"] = req_origin
            headers["Access-Control-Allow-Methods"] = "GET,HEAD,OPTIONS"
            headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,Accept,Origin"
            headers["Access-Control-Max-Age"] = "3600"
            return headers

    # 3. Wildcard '*' rule (NEVER emits Access-Control-Allow-Credentials: true)
    wildcard_rule = next((r for r in active_rules if r.origin == "*"), None)
    if wildcard_rule:
        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Methods"] = wildcard_rule.allowed_methods or "GET,HEAD,OPTIONS"
        headers["Access-Control-Allow-Headers"] = wildcard_rule.allowed_headers or "*"
        headers["Access-Control-Max-Age"] = str(getattr(wildcard_rule, "max_age_seconds", 3600) or 3600)
        # Strictly ensure Access-Control-Allow-Credentials is NOT present with '*'
        headers.pop("Access-Control-Allow-Credentials", None)
        return headers

    # 4. Origin not in allowlist -> emit NO Access-Control-Allow-Origin and NO Access-Control-Allow-Credentials
    return headers


def _compute_cache_control(project: Project, rel_path: str, is_html_or_runtime_config: bool = False) -> str:
    """
    Computes differentiated Cache-Control headers per asset class (P-1 & P-3):
    - index.html, SPA fallback HTML, and env-config.js/json -> no-cache, max-age=0, must-revalidate
    - Hashed static assets (/assets/* or *-[hash].js/css/woff2/png) -> public, max-age=31536000, immutable
    - Standard static assets -> public, max-age=3600
    """
    if is_html_or_runtime_config or rel_path.lower().endswith((".html", ".htm")):
        return getattr(project, "html_cache_control", None) or "no-cache, max-age=0, must-revalidate"

    norm_path = "/" + rel_path.lstrip("/")
    if "/assets/" in norm_path or HASHED_ASSET_REGEX.search(norm_path):
        return getattr(project, "hashed_asset_cache_control", None) or "public, max-age=31536000, immutable"

    return getattr(project, "asset_cache_control", None) or "public, max-age=3600"


def _evaluate_conditional_or_method_response(
    request: Request,
    content_bytes: bytes,
    mtime: float,
    media_type: str,
    headers: Dict[str, str],
) -> Response:
    """
    Implements P-7:
    - Computes strong ETag and RFC 7231 Last-Modified headers.
    - Evaluates If-None-Match and If-Modified-Since, returning 304 Not Modified when matched.
    - Supports HEAD (returns headers + Content-Length with empty body) and GET.
    """
    digest = hashlib.sha256(content_bytes).hexdigest()[:24]
    etag = f'"{digest}"'
    last_modified = formatdate(mtime, usegmt=True)

    headers["ETag"] = etag
    headers["Last-Modified"] = last_modified
    headers["Content-Length"] = str(len(content_bytes))

    # 1. Check If-None-Match
    inm = request.headers.get("if-none-match")
    if inm:
        candidates = [t.strip() for t in inm.split(",")]
        if "*" in candidates or etag in candidates or f"W/{etag}" in candidates or digest in [c.strip('"') for c in candidates]:
            h304 = dict(headers)
            h304.pop("Content-Length", None)
            return Response(status_code=304, headers=h304)
    else:
        # 2. Check If-Modified-Since when If-None-Match is not present
        ims = request.headers.get("if-modified-since")
        if ims:
            try:
                ims_dt = parsedate_to_datetime(ims)
                if int(mtime) <= int(ims_dt.timestamp()):
                    h304 = dict(headers)
                    h304.pop("Content-Length", None)
                    return Response(status_code=304, headers=h304)
            except Exception:
                pass

    if request.method == "HEAD":
        return Response(status_code=200, media_type=media_type, headers=headers)

    return Response(content=content_bytes, status_code=200, media_type=media_type, headers=headers)


def _rewrite_html_for_preview_and_runtime_config(
    html_text: str,
    db: Session,
    project: Project,
    version_label: str,
    is_version_preview: bool,
    environment: str = "production",
) -> str:
    """
    Handles:
    - P-5: When serving `/pages/{project_slug}/v/{version}`, rewrites `/pages/{project_slug}/` asset references
      (not already pointing to `v/`) to `/pages/{project_slug}/v/{version}/` and ensures `<base href=...>` so every
      preview loads its own version's JS/CSS/image assets instead of the live version's assets.
    - P-13: Automatically injects `<script id="opspages-runtime-config">` with scoped Opsbase public credentials
      (`window.__OPSPAGES_CONFIG__` and `window.__OPSBASE_CONFIG__`) into the HTML head.
    """
    output = html_text

    # P-5: Rewrite hardcoded `/pages/{slug}/` paths in preview mode to `/pages/{slug}/v/{version}/`
    if is_version_preview:
        pattern = re.compile(rf"/pages/{re.escape(project.slug)}/(?!v/)")
        output = pattern.sub(f"/pages/{project.slug}/v/{version_label}/", output)
        base_tag = f'<base href="/pages/{project.slug}/v/{version_label}/" />'
        if "<base " not in output.lower():
            if "<head>" in output:
                output = output.replace("<head>", f"<head>\n  {base_tag}", 1)
            elif "<HEAD>" in output:
                output = output.replace("<HEAD>", f"<HEAD>\n  {base_tag}", 1)

    # P-13 & Part 2: Inject Public Runtime Configuration if enabled for this project.
    # Re-raise ValidationError/NotFoundError so invalid ?env= never silently falls back to production.
    try:
        cfg_payload = ProjectService.build_runtime_config_payload(
            db=db,
            project=project,
            environment=environment,
            version_override=version_label,
        )
        if cfg_payload.get("inject_in_html", True) and cfg_payload.get("is_active", True):
            cfg_json = json.dumps(cfg_payload, ensure_ascii=False)
            script_tag = (
                f'<script id="opspages-runtime-config">'
                f"window.__OPSPAGES_CONFIG__={cfg_json};"
                f"window.__OPSBASE_CONFIG__=window.__OPSPAGES_CONFIG__.opsbase;"
                f"window.OPSBASE_URL=window.__OPSPAGES_CONFIG__.opsbase_url;"
                f"window.OPSBASE_PUBLIC_KEY=window.__OPSPAGES_CONFIG__.opsbase.public_key;"
                f"window.OPSBASE_ANON_KEY=window.__OPSPAGES_CONFIG__.opsbase.public_key;"
                f"</script>"
            )
            if 'id="opspages-runtime-config"' not in output:
                if "</head>" in output:
                    output = output.replace("</head>", f"  {script_tag}\n</head>", 1)
                elif "<body" in output:
                    output = f"{script_tag}\n{output}"
                else:
                    output = f"{script_tag}\n{output}"
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.warning(f"Runtime config injection warning for {project.slug}: {e}")

    return output


def _serve_static_directory(
    request: Request,
    db: Session,
    project: Project,
    base_dir: Path,
    subpath: str,
    version_label: str,
    is_version_preview: bool = False,
) -> Response:
    headers = _build_project_cors_and_security_headers(project, request)
    headers["X-OpsPages-Version"] = version_label

    # P-7: Handle OPTIONS preflight or capability check on static pages
    if request.method == "OPTIONS":
        headers["Allow"] = "GET, HEAD, OPTIONS"
        return Response(status_code=204, headers=headers)

    clean_subpath = (subpath or "").strip("/")
    if "env" in request.query_params:
        env_param = OpsBaseIntegrationService.validate_environment_name(
            request.query_params.get("env"), allow_none=False
        )
        # Validate immediately that the environment config exists and is active
        ProjectService.get_public_config_by_env(db, project, env_param)
    else:
        env_param = "preview" if is_version_preview else "production"

    # P-13 & Part 2: Built-in virtual endpoints `env-config.js` and `env-config.json` on every project & preview route
    if clean_subpath in ("env-config.js", "env-config.json"):
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        headers["Pragma"] = "no-cache"
        mtime = (project.updated_at.timestamp() if project.updated_at else 1729440000.0)
        if clean_subpath == "env-config.js":
            js_body = ProjectService.build_runtime_config_js(
                db=db,
                project=project,
                environment=env_param,
                version_override=version_label,
            ).encode("utf-8")
            return _evaluate_conditional_or_method_response(
                request=request,
                content_bytes=js_body,
                mtime=mtime,
                media_type="application/javascript; charset=utf-8",
                headers=headers,
            )
        else:
            payload = ProjectService.build_runtime_config_payload(
                db=db,
                project=project,
                environment=env_param,
                version_override=version_label,
            )
            json_body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
            return _evaluate_conditional_or_method_response(
                request=request,
                content_bytes=json_body,
                mtime=mtime,
                media_type="application/json; charset=utf-8",
                headers=headers,
            )

    if not base_dir.exists():
        return HTMLResponse(
            status_code=404,
            content=f"<h3>AIOps OpsPages: Nenhuma build publicada para '{project.slug}' ({version_label})</h3>",
            headers=headers,
        )

    base_resolved = base_dir.resolve()
    entry_file = project.entry_file or "index.html"

    # P-5 Referer-aware preview asset resolution when requesting `/pages/{slug}/assets/...` from a `/v/{ver}/` page
    prefer_ref_version: Optional[str] = None
    if not is_version_preview and clean_subpath:
        referer = request.headers.get("referer") or ""
        ref_match = re.search(rf"/pages/{re.escape(project.slug)}/v/([^/?#]+)", referer)
        if ref_match:
            prefer_ref_version = ref_match.group(1)

    if not clean_subpath:
        target = (base_resolved / entry_file).resolve()
    elif prefer_ref_version:
        ref_found = _find_fallback_asset_across_releases(project, clean_subpath, prefer_version=prefer_ref_version)
        if ref_found:
            target, matched_ver = ref_found
            headers["X-OpsPages-Version"] = matched_ver
        else:
            target = (base_resolved / clean_subpath).resolve()
    else:
        target = (base_resolved / clean_subpath).resolve()

    if not prefer_ref_version and not str(target).startswith(str(base_resolved)):
        raise ValidationError("Invalid static file path.")

    if target.is_dir():
        target = (target / entry_file).resolve()

    is_spa_fallback = False
    if not target.exists() or not target.is_file():
        # P-3: If a static asset (.js, .css, .png, .woff2, etc.) is missing from `current/` (e.g. right after rollback),
        # serve it from recent releases in `/repos/{slug}/releases/*` so the client never gets a 404 blank screen!
        if not is_version_preview and clean_subpath and ("." in Path(clean_subpath).name):
            fallback_asset = _find_fallback_asset_across_releases(project, clean_subpath)
            if fallback_asset:
                target, fallback_ver = fallback_asset
                headers["X-OpsPages-Fallback-Release"] = fallback_ver
            else:
                raise NotFoundError(f"Static file '{clean_subpath}' not found in '{project.slug}'.")
        elif project.spa_mode and ("." not in Path(clean_subpath).name):
            # SPA Mode Fallback: serve entry_file (index.html)
            fallback = (base_resolved / entry_file).resolve()
            if fallback.exists() and fallback.is_file():
                target = fallback
                is_spa_fallback = True
            else:
                raise NotFoundError(f"Static file '{clean_subpath}' not found in '{project.slug}'.")
        else:
            raise NotFoundError(f"Static file '{clean_subpath}' not found in '{project.slug}'.")

    mime_type, _ = mimetypes.guess_type(str(target))
    resolved_mime = mime_type or "text/html"
    is_html = resolved_mime.startswith("text/html") or target.suffix.lower() in (".html", ".htm") or is_spa_fallback

    # P-1: Differentiated Cache-Control header
    effective_rel_path = entry_file if (not clean_subpath or is_spa_fallback) else clean_subpath
    headers["Cache-Control"] = _compute_cache_control(project, effective_rel_path, is_html_or_runtime_config=is_html)

    stat_info = target.stat()
    mtime = stat_info.st_mtime

    if is_html:
        raw_html = target.read_text(encoding="utf-8", errors="replace")
        final_html = _rewrite_html_for_preview_and_runtime_config(
            html_text=raw_html,
            db=db,
            project=project,
            version_label=version_label,
            is_version_preview=is_version_preview,
            environment=env_param,
        )
        content_bytes = final_html.encode("utf-8")
        resolved_mime = "text/html; charset=utf-8"
    elif is_version_preview and target.suffix.lower() in (".js", ".mjs", ".css"):
        # P-5: Also rewrite hardcoded `/pages/{slug}/assets/` inside JS/CSS bundles in preview mode
        raw_text = target.read_text(encoding="utf-8", errors="replace")
        pattern = re.compile(rf"/pages/{re.escape(project.slug)}/(?!v/)")
        rewritten_text = pattern.sub(f"/pages/{project.slug}/v/{version_label}/", raw_text)
        content_bytes = rewritten_text.encode("utf-8")
    else:
        content_bytes = target.read_bytes()

    return _evaluate_conditional_or_method_response(
        request=request,
        content_bytes=content_bytes,
        mtime=mtime,
        media_type=resolved_mime,
        headers=headers,
    )


def _find_fallback_asset_across_releases(project: Project, clean_subpath: str, prefer_version: Optional[str] = None) -> Optional[tuple[Path, str]]:
    if not clean_subpath or "." not in Path(clean_subpath).name:
        return None

    releases_root = GitStorageService.get_releases_dir(project.slug)
    if not releases_root.exists():
        return None

    if prefer_version:
        cand_base = (releases_root / prefer_version).resolve()
        cand = (cand_base / clean_subpath).resolve()
        if str(cand).startswith(str(cand_base)) and cand.exists() and cand.is_file():
            return cand, prefer_version

    release_dirs = sorted(
        [d for d in releases_root.iterdir() if d.is_dir()],
        key=lambda d: d.stat().st_mtime,
        reverse=True,
    )
    for rel_dir in release_dirs:
        rel_resolved = rel_dir.resolve()
        cand = (rel_resolved / clean_subpath).resolve()
        if str(cand).startswith(str(rel_resolved)) and cand.exists() and cand.is_file():
            return cand, rel_dir.name

    return None


@app.api_route(
    "/pages/{project_slug}/v/{version}",
    methods=["GET", "HEAD", "OPTIONS"],
    tags=["Static Pages Hosting"],
)
@app.api_route(
    "/pages/{project_slug}/v/{version}/{subpath:path}",
    methods=["GET", "HEAD", "OPTIONS"],
    tags=["Static Pages Hosting"],
)
def serve_version_preview(
    project_slug: str,
    version: str,
    request: Request,
    subpath: str = "",
    db: Session = Depends(get_meta_db),
):
    # P-8: Reject any ?token= query parameter immediately
    optional_user = resolve_optional_user_from_request(request, db)

    project = db.query(Project).filter(Project.slug == project_slug).first()
    if not project or not project.is_active:
        raise NotFoundError(f"Project '{project_slug}' not found or inactive.")

    # P-7: Allow OPTIONS preflight before auth check
    if request.method == "OPTIONS":
        headers = _build_project_cors_and_security_headers(project, request)
        headers["Allow"] = "GET, HEAD, OPTIONS"
        return Response(status_code=204, headers=headers)

    dep = (
        db.query(Deployment)
        .filter(Deployment.project_id == project.id, Deployment.version == version)
        .first()
    )
    if not dep:
        raise NotFoundError(f"Deployment version '{version}' not found in project '{project.slug}'.")

    # P-4 Security: Protect preview of unapproved versions (pending_approval / rejected / failed)
    # or private projects (`not project.is_public`) with header authentication!
    requires_auth = (
        not project.is_public
        or dep.status in ("pending_approval", "rejected", "failed")
    )
    if requires_auth:
        if not optional_user:
            raise AuthenticationError(
                f"Version '{version}' of project '{project.slug}' is not yet approved ({dep.status}). "
                "Preview access requires authentication via the Authorization, apikey, or x-api-key header (P-4)."
            )
        if not HBACService.has_project_access(optional_user, project.id, "viewer", project.created_by):
            raise AuthorizationError(f"Insufficient permissions to preview project '{project.slug}'.")

    release_dir = GitStorageService.get_release_dir(project.slug, version)
    return _serve_static_directory(
        request=request,
        db=db,
        project=project,
        base_dir=release_dir,
        subpath=subpath,
        version_label=version,
        is_version_preview=True,
    )


@app.api_route(
    "/pages/{project_slug}",
    methods=["GET", "HEAD", "OPTIONS"],
    tags=["Static Pages Hosting"],
)
@app.api_route(
    "/pages/{project_slug}/{subpath:path}",
    methods=["GET", "HEAD", "OPTIONS"],
    tags=["Static Pages Hosting"],
)
def serve_live_project_page(
    project_slug: str,
    request: Request,
    subpath: str = "",
    db: Session = Depends(get_meta_db),
):
    # P-8: Reject any ?token= query parameter immediately
    optional_user = resolve_optional_user_from_request(request, db)

    project = db.query(Project).filter(Project.slug == project_slug).first()
    if not project or not project.is_active:
        raise NotFoundError(f"Project '{project_slug}' not found or inactive.")

    if request.method == "OPTIONS":
        headers = _build_project_cors_and_security_headers(project, request)
        headers["Allow"] = "GET, HEAD, OPTIONS"
        return Response(status_code=204, headers=headers)

    if not project.is_public:
        if not optional_user:
            raise AuthenticationError(f"Project '{project.slug}' is private. Authentication required via Authorization header.")
        if not HBACService.has_project_access(optional_user, project.id, "viewer", project.created_by):
            raise AuthorizationError(f"Insufficient permissions to access project '{project.slug}'.")

    current_dir = GitStorageService.get_current_dir(project.slug)
    version_label = project.active_version or "none"
    return _serve_static_directory(
        request=request,
        db=db,
        project=project,
        base_dir=current_dir,
        subpath=subpath,
        version_label=version_label,
        is_version_preview=False,
    )


@app.get("/health", tags=["Health"])
def health_check(request: Request, db: Session = Depends(get_meta_db)):
    """
    Platform health endpoint.
    P-11 Security: Redacts internal filesystem paths and superadmin email for unauthenticated callers.
    """
    auth_user = resolve_optional_user_from_request(request, db)
    db_info = get_db_engine_info()
    payload: Dict[str, Any] = {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database_connected": db_info["connected"],
    }
    if auth_user is not None:
        payload["database"] = db_info["dialect"]
        payload["repos_root"] = db_info["repos_root"]
        payload["default_superadmin"] = settings.DEFAULT_SUPERADMIN_EMAIL
    return payload


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8005, reload=True)
