"""
Pydantic v2 Schemas for Projects, Static Hosting Config, and Project Permissions (HBAC).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProjectPermissionCreate(BaseModel):
    user_id: Optional[int] = None
    group_id: Optional[int] = None
    role: str = Field(default="editor", pattern="^(admin|editor|viewer)$")


class ProjectPermissionResponse(BaseModel):
    id: int
    project_id: int
    user_id: Optional[int] = None
    group_id: Optional[int] = None
    username: Optional[str] = None
    user_email: Optional[str] = None
    group_name: Optional[str] = None
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=60, pattern="^[a-z0-9_-]+$")
    description: str = Field(default="", max_length=1000)
    framework: str = Field(default="react-vite", max_length=80)

    auto_approval: bool = True
    spa_mode: bool = True
    is_public: bool = True
    entry_file: str = Field(default="index.html", max_length=150)
    custom_domain: Optional[str] = None

    # Differentiated Cache-Control Policies (P-1 & P-3)
    html_cache_control: str = Field(
        default="no-cache, max-age=0, must-revalidate",
        max_length=255,
        description="Cache-Control header applied to index.html and SPA HTML fallbacks",
    )
    hashed_asset_cache_control: str = Field(
        default="public, max-age=31536000, immutable",
        max_length=255,
        description="Cache-Control header applied to content-hashed static bundles (/assets/*-[hash].js/css)",
    )
    asset_cache_control: str = Field(
        default="public, max-age=3600",
        max_length=255,
        description="Cache-Control header applied to standard non-hashed static assets",
    )

    # Security Headers Configurable per Project (P-2)
    csp_policy: str = Field(
        default=(
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data: blob: https: http:; "
            "font-src 'self' data: https://fonts.gstatic.com https:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* https: ws: wss:; "
            "frame-ancestors 'self'; "
            "base-uri 'self'; "
            "object-src 'none'"
        ),
        description="Content-Security-Policy header applied to project static responses",
    )
    x_frame_options: str = Field(default="SAMEORIGIN", max_length=50)
    referrer_policy: str = Field(default="strict-origin-when-cross-origin", max_length=100)
    hsts_max_age: int = Field(default=31536000, ge=0, le=63072000)
    nosniff_enabled: bool = Field(default=True)
    permissions_policy: str = Field(
        default="camera=(), microphone=(), geolocation=()", max_length=255
    )

    github_repo_url: Optional[str] = None
    github_branch: str = Field(default="main", max_length=100)
    github_subpath: str = Field(default="/repos", max_length=255)
    auto_sync_github: bool = False


class ProjectCreate(ProjectBase):
    github_token: Optional[str] = None
    seed_initial_build: bool = True
    environment: Optional[str] = "production"


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    framework: Optional[str] = None
    auto_approval: Optional[bool] = None
    spa_mode: Optional[bool] = None
    is_public: Optional[bool] = None
    entry_file: Optional[str] = None
    custom_domain: Optional[str] = None
    html_cache_control: Optional[str] = None
    hashed_asset_cache_control: Optional[str] = None
    asset_cache_control: Optional[str] = None
    csp_policy: Optional[str] = None
    x_frame_options: Optional[str] = None
    referrer_policy: Optional[str] = None
    hsts_max_age: Optional[int] = None
    nosniff_enabled: Optional[bool] = None
    permissions_policy: Optional[str] = None
    github_repo_url: Optional[str] = None
    github_branch: Optional[str] = None
    github_subpath: Optional[str] = None
    github_token: Optional[str] = None
    auto_sync_github: Optional[bool] = None
    is_active: Optional[bool] = None


class ProjectLockRequest(BaseModel):
    is_locked: bool
    locked_version: Optional[str] = None
    version: Optional[str] = None
    reason: Optional[str] = Field(default="Trava manual de versão em produção", max_length=500)


class ProjectResponse(ProjectBase):
    id: int
    repo_folder_name: str
    repo_disk_path: Optional[str] = None
    live_url: str
    active_version: Optional[str] = None
    is_locked: bool = False
    locked_version: Optional[str] = None
    locked_by: Optional[str] = None
    locked_reason: Optional[str] = None
    is_active: bool = True
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProjectDetailResponse(ProjectResponse):
    permissions: List[ProjectPermissionResponse] = Field(default_factory=list)
    deployment_count: int = 0
    total_deployments: int = 0
    storage_mb: float = 0.0
    storage_bytes: int = 0
    git_commit_count: int = 0
    effective_role: str = "viewer"


class CiCdDeployConfigResponse(BaseModel):
    project_id: int
    project_name: str
    slug: str
    repo_folder_name: str
    live_url: str
    preview_url_template: str
    deploy_api_endpoint: str
    effective_role: str
    deploy_key: Optional[str] = None
    deploy_token: Optional[str] = None
    deploy_key_prefix: Optional[str] = None
    service_key: Optional[str] = None
    service_key_prefix: Optional[str] = None
    masked: bool = True
    revealed: bool = False
    curl_example: str
    curl_upload_example: str = ""
    github_actions_yaml: str
    github_actions_workflow: str = ""


class ProjectCredentialsRevealRequest(BaseModel):
    password: Optional[str] = None
    confirm: bool = True
    reason: Optional[str] = Field(default="explicit_reveal", max_length=255)


class ProjectKeyRotateRequest(BaseModel):
    token_type: str = Field(..., pattern="^(deploy|service|read)$")
    reason: Optional[str] = Field(default="explicit_rotation", max_length=255)


class ProjectPublicConfigUpsertRequest(BaseModel):
    """
    Upsert request for Project Public Runtime Config & Scoped Opsbase Credentials (P-13).
    """
    environment: str = Field(
        default="production",
        pattern="^(production|staging|development|preview)$",
        description="Target environment (production, staging, development, preview)",
    )
    opsbase_url: str = Field(
        default="http://localhost:8000",
        max_length=500,
        description="Base URL of AIOps Opsbase backend API for this environment",
    )
    opsbase_public_key: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Scoped public/anonymous key for browser client access to Opsbase (leave empty to auto-generate)",
    )
    opsbase_project_slug: Optional[str] = Field(
        default=None,
        max_length=150,
        description="Target project/tenant slug in Opsbase",
    )
    scopes: str = Field(
        default="public:read,data:query,auth:session,crud:items",
        max_length=500,
        description="Comma-separated list of public scopes granted to the static page client",
    )
    public_vars: Dict[str, Any] = Field(
        default_factory=dict,
        description="Public key-value configuration variables injected into window.__OPSPAGES_CONFIG__ / window.__OPSBASE_CONFIG__",
    )
    inject_in_html: bool = Field(
        default=True,
        description="When True, automatically injects <script id='opspages-runtime-config'> into HTML responses",
    )
    is_active: bool = Field(default=True)
    rotate_public_key: bool = Field(
        default=False,
        description="When True, rotates and generates a new scoped opsb_pub_... public key",
    )


class ProjectPublicConfigResponse(BaseModel):
    id: int
    project_id: int
    project_slug: str = ""
    environment: str
    opsbase_url: str
    opsbase_public_key: str
    opsbase_project_slug: str
    scopes: List[str] = Field(default_factory=list)
    scopes_raw: str = ""
    public_vars: Dict[str, Any] = Field(default_factory=dict)
    inject_in_html: bool
    is_active: bool
    env_config_js_url: str = ""
    env_config_json_url: str = ""
    public_api_url: str = ""
    html_snippet: str = ""
    updated_by_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
