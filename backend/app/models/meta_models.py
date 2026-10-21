"""
SQLAlchemy 2.0 ORM Models for AIOps OpsPages Metadata Database.
Compatible with SQLite, PostgreSQL, and MariaDB/MySQL.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "opspages_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    groups: Mapped[List["Group"]] = relationship(
        "Group",
        secondary="opspages_user_groups",
        back_populates="users",
        lazy="selectin",
    )
    permissions: Mapped[List["ProjectPermission"]] = relationship(
        "ProjectPermission",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Group(Base):
    __tablename__ = "opspages_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="")
    # Role levels: admin | editor | viewer
    role_level: Mapped[str] = mapped_column(String(50), default="editor", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="opspages_user_groups",
        back_populates="groups",
        lazy="selectin",
    )
    permissions: Mapped[List["ProjectPermission"]] = relationship(
        "ProjectPermission",
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class UserGroup(Base):
    __tablename__ = "opspages_user_groups"

    user_id: Mapped[int] = mapped_column(ForeignKey("opspages_users.id", ondelete="CASCADE"), primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("opspages_groups.id", ondelete="CASCADE"), primary_key=True)


class Project(Base):
    __tablename__ = "opspages_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    framework: Mapped[str] = mapped_column(String(80), default="react-vite")  # react-vite, next-static, vue, angular, astro, html

    # Static Hosting & Routing Governance
    active_version: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    locked_version: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    locked_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    locked_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    auto_approval: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    spa_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    entry_file: Mapped[str] = mapped_column(String(150), default="index.html", nullable=False)
    custom_domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Differentiated Cache-Control Policies (P-1 & P-3)
    html_cache_control: Mapped[str] = mapped_column(
        String(255), default="no-cache, max-age=0, must-revalidate", nullable=False
    )
    hashed_asset_cache_control: Mapped[str] = mapped_column(
        String(255), default="public, max-age=31536000, immutable", nullable=False
    )
    asset_cache_control: Mapped[str] = mapped_column(
        String(255), default="public, max-age=3600", nullable=False
    )

    # Configurable Security Headers per Project (P-2)
    csp_policy: Mapped[str] = mapped_column(
        Text,
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
        nullable=False,
    )
    x_frame_options: Mapped[str] = mapped_column(String(50), default="SAMEORIGIN", nullable=False)
    referrer_policy: Mapped[str] = mapped_column(
        String(100), default="strict-origin-when-cross-origin", nullable=False
    )
    hsts_max_age: Mapped[int] = mapped_column(Integer, default=31536000, nullable=False)
    nosniff_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    permissions_policy: Mapped[str] = mapped_column(
        String(255), default="camera=(), microphone=(), geolocation=()", nullable=False
    )

    # Git & GitHub /repos Integration
    github_repo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    github_subpath: Mapped[str] = mapped_column(String(255), default="/repos", nullable=False)
    github_token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    auto_sync_github: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # AIOps OpsBase Integration & Project Linking (Part 2)
    opsbase_project_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    opsbase_project_slug: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    opsbase_schema_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    opsbase_linked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    opsbase_last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    opsbase_key_status: Mapped[str] = mapped_column(String(40), default="active", nullable=False)
    opsbase_key_prefix: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    opsbase_cors_synced: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    opsbase_allowed_origins_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    opsbase_auto_provisioned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("opspages_users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    quota: Mapped[Optional["ProjectQuota"]] = relationship(
        "ProjectQuota",
        back_populates="project",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    deployments: Mapped[List["Deployment"]] = relationship(
        "Deployment",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tokens: Mapped[List["ApiToken"]] = relationship(
        "ApiToken",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    cors_rules: Mapped[List["CorsRule"]] = relationship(
        "CorsRule",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    permissions: Mapped[List["ProjectPermission"]] = relationship(
        "ProjectPermission",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    public_configs: Mapped[List["ProjectPublicConfig"]] = relationship(
        "ProjectPublicConfig",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def repo_folder_name(self) -> str:
        """Relative path under /repos: /repos/{slug}"""
        return f"/repos/{self.slug}"

    @property
    def live_url(self) -> str:
        """Public path where active static build is served."""
        return f"/pages/{self.slug}/"

    def get_opsbase_allowed_origins(self) -> List[str]:
        if not self.opsbase_allowed_origins_json:
            return []
        try:
            parsed = json.loads(self.opsbase_allowed_origins_json)
            return [str(x) for x in parsed] if isinstance(parsed, list) else []
        except Exception:
            return []

    def set_opsbase_allowed_origins(self, origins: List[str]) -> None:
        self.opsbase_allowed_origins_json = json.dumps(origins or [], ensure_ascii=False)


class Deployment(Base):
    __tablename__ = "opspages_deployments"
    __table_args__ = (
        UniqueConstraint("project_id", "version", name="uq_opspages_project_version"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("opspages_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    git_commit_sha: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    git_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    git_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    release_notes: Mapped[str] = mapped_column(Text, default="")
    # Status values: published | ready | pending_approval | rejected | archived | failed
    status: Mapped[str] = mapped_column(String(40), default="ready", nullable=False, index=True)
    # Trigger source: web_upload | ci_api | git_sync | rollback | seed
    source: Mapped[str] = mapped_column(String(50), default="web_upload", nullable=False)
    file_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    entry_file: Mapped[str] = mapped_column(String(150), default="index.html", nullable=False)

    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("opspages_users.id", ondelete="SET NULL"), nullable=True)
    created_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    approved_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    project: Mapped["Project"] = relationship("Project", back_populates="deployments")


class ProjectPermission(Base):
    __tablename__ = "opspages_project_permissions"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_opspages_project_user_perm"),
        UniqueConstraint("project_id", "group_id", name="uq_opspages_project_group_perm"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("opspages_projects.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("opspages_users.id", ondelete="CASCADE"), nullable=True)
    group_id: Mapped[Optional[int]] = mapped_column(ForeignKey("opspages_groups.id", ondelete="CASCADE"), nullable=True)
    # Role: admin | editor | viewer
    role: Mapped[str] = mapped_column(String(50), default="viewer", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    project: Mapped["Project"] = relationship("Project", back_populates="permissions")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="permissions")
    group: Mapped[Optional["Group"]] = relationship("Group", back_populates="permissions")


class ApiToken(Base):
    __tablename__ = "opspages_api_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("opspages_projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    token_prefix: Mapped[str] = mapped_column(String(50), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    encrypted_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Scopes: deploy (editor), read (viewer), service (admin)
    token_type: Mapped[str] = mapped_column(String(50), default="deploy", nullable=False)
    scopes: Mapped[str] = mapped_column(String(255), default="read,deploy", nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("opspages_users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    project: Mapped["Project"] = relationship("Project", back_populates="tokens")


class ProjectQuota(Base):
    __tablename__ = "opspages_project_quotas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("opspages_projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    max_build_size_mb: Mapped[int] = mapped_column(Integer, default=250, nullable=False)
    max_storage_mb: Mapped[int] = mapped_column(Integer, default=2048, nullable=False)
    max_deploys_per_day: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    max_retained_versions: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    project: Mapped["Project"] = relationship("Project", back_populates="quota")


class CorsRule(Base):
    __tablename__ = "opspages_cors_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("opspages_projects.id", ondelete="CASCADE"), nullable=False)
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    allowed_methods: Mapped[str] = mapped_column(String(255), default="GET,HEAD,OPTIONS", nullable=False)
    allowed_headers: Mapped[str] = mapped_column(String(255), default="*", nullable=False)
    allow_credentials: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_age_seconds: Mapped[int] = mapped_column(Integer, default=3600, nullable=False)
    cache_control: Mapped[str] = mapped_column(String(255), default="public, max-age=3600", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    created_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    updated_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="cors_rules")


class ProjectPublicConfig(Base):
    """
    Public Runtime Configuration & Scoped Opsbase Credentials per Project and Environment (P-13).
    Allows static builds hosted on OpsPages to receive public runtime config (Opsbase URL,
    scoped public anon/client key, allowed scopes, custom public env vars) without hardcoding secrets in the bundle.
    """
    __tablename__ = "opspages_public_configs"
    __table_args__ = (
        UniqueConstraint("project_id", "environment", name="uq_opspages_project_env_config"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("opspages_projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Environments: production | staging | development | preview
    environment: Mapped[str] = mapped_column(String(50), default="production", nullable=False, index=True)
    opsbase_url: Mapped[str] = mapped_column(String(500), default="http://localhost:8001/api/v1", nullable=False)
    opsbase_public_key: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    opsbase_project_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    opsbase_project_slug: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    opsbase_schema_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    opsbase_key_prefix: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    opsbase_key_status: Mapped[str] = mapped_column(String(40), default="active", nullable=False)
    opsbase_data_plane_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    opsbase_auth_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # c4 / P-24 (round6): RLS posture reported by OpsBase discovery; None = unknown (never a fixed True).
    opsbase_rls_enforced: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    key_source: Mapped[str] = mapped_column(String(50), default="opsbase_discovery", nullable=False)
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[str] = mapped_column(String(500), default="public:read,data:query,auth:session", nullable=False)
    public_vars_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    inject_in_html: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    project: Mapped["Project"] = relationship("Project", back_populates="public_configs")

    def get_public_vars(self) -> Dict[str, Any]:
        if not self.public_vars_json:
            return {}
        try:
            parsed = json.loads(self.public_vars_json)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def set_public_vars(self, data: Dict[str, Any]) -> None:
        self.public_vars_json = json.dumps(data or {}, ensure_ascii=False)


class ErrorReport(Base):
    """
    Frontend & Static Pages Error Telemetry / Issue Reporting Route (/errors & /api/v1/errors).
    """
    __tablename__ = "opspages_error_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("opspages_projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    project_slug: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    page_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    route_path: Mapped[str] = mapped_column(String(500), default="/", nullable=False, index=True)
    error_code: Mapped[str] = mapped_column(String(100), default="ERR_FRONTEND_RUNTIME", nullable=False, index=True)
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    severity: Mapped[str] = mapped_column(String(40), default="error", nullable=False, index=True)  # critical | error | warning | info
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, default="", nullable=False)
    stack_trace: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    version: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    environment: Mapped[str] = mapped_column(String(50), default="production", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="open", nullable=False, index=True)  # open | investigating | resolved | ignored
    reporter_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AuditLog(Base):
    __tablename__ = "opspages_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    project_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    diff_payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def set_diff(self, data: Dict[str, Any]) -> None:
        self.diff_payload = json.dumps(data, default=str, ensure_ascii=False)

    def get_diff(self) -> Optional[Dict[str, Any]]:
        if not self.diff_payload:
            return None
        try:
            return json.loads(self.diff_payload)
        except Exception:
            return None
