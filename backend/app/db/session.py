"""
Database session management for AIOps OpsPages.
Supports SQLite, PostgreSQL, and MariaDB/MySQL.
Initializes tables and seeds initial Super Admin (willian.jesus@loft.com.br) and HBAC system groups.
"""
from __future__ import annotations

import logging
from typing import Generator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.models.meta_models import Base, ErrorReport, Group, Project, ProjectPublicConfig, User

logger = logging.getLogger("aiops.opspages.db")

db_url = settings.get_database_url()
connect_args = {}
engine_kwargs = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif db_url.startswith("postgresql"):
    connect_args.update(
        {
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    )
    engine_kwargs.update(
        {
            "pool_size": 15,
            "max_overflow": 20,
            "pool_recycle": 600,
            "pool_pre_ping": True,
        }
    )
elif db_url.startswith("mysql") or db_url.startswith("mariadb"):
    connect_args.update(
        {
            "connect_timeout": 10,
        }
    )
    engine_kwargs.update(
        {
            "pool_size": 15,
            "max_overflow": 20,
            "pool_recycle": 600,
            "pool_pre_ping": True,
        }
    )

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)


def get_meta_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a Meta DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_engine_info() -> dict:
    """Returns diagnostic info about the active database dialect and connection."""
    dialect = engine.dialect.name
    ok = False
    error_msg = None
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            ok = True
    except Exception as e:
        error_msg = str(e)

    return {
        "dialect": dialect,
        "driver": engine.dialect.driver,
        "connected": ok,
        "error": error_msg,
        "supported_engines": ["sqlite", "postgresql", "mariadb"],
        "repos_root": str(settings.repos_root_path),
    }


def _ensure_schema_columns() -> None:
    """Safely adds newly introduced columns to existing SQLite/PostgreSQL/MariaDB tables."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    project_migrations = [
        ("html_cache_control", "VARCHAR(255) NOT NULL DEFAULT 'no-cache, max-age=0, must-revalidate'"),
        ("hashed_asset_cache_control", "VARCHAR(255) NOT NULL DEFAULT 'public, max-age=31536000, immutable'"),
        ("asset_cache_control", "VARCHAR(255) NOT NULL DEFAULT 'public, max-age=3600'"),
        (
            "csp_policy",
            "TEXT NOT NULL DEFAULT \"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' data: https://fonts.gstatic.com https:; connect-src 'self' http://localhost:* http://127.0.0.1:* https: ws: wss:; frame-ancestors 'self'; base-uri 'self'; object-src 'none'\"",
        ),
        ("x_frame_options", "VARCHAR(50) NOT NULL DEFAULT 'SAMEORIGIN'"),
        ("referrer_policy", "VARCHAR(100) NOT NULL DEFAULT 'strict-origin-when-cross-origin'"),
        ("hsts_max_age", "INTEGER NOT NULL DEFAULT 31536000"),
        ("nosniff_enabled", "BOOLEAN NOT NULL DEFAULT 1"),
        ("permissions_policy", "VARCHAR(255) NOT NULL DEFAULT 'camera=(), microphone=(), geolocation=()'"),
        ("opsbase_project_id", "INTEGER"),
        ("opsbase_project_slug", "VARCHAR(150)"),
        ("opsbase_schema_name", "VARCHAR(150)"),
        ("opsbase_linked_at", "DATETIME"),
        ("opsbase_last_synced_at", "DATETIME"),
        ("opsbase_key_status", "VARCHAR(40) NOT NULL DEFAULT 'active'"),
        ("opsbase_key_prefix", "VARCHAR(80)"),
        ("opsbase_cors_synced", "BOOLEAN NOT NULL DEFAULT 0"),
        ("opsbase_allowed_origins_json", "TEXT NOT NULL DEFAULT '[]'"),
        ("opsbase_auto_provisioned", "BOOLEAN NOT NULL DEFAULT 0"),
    ]

    cors_migrations = [
        ("allow_credentials", "BOOLEAN NOT NULL DEFAULT 0"),
        ("max_age_seconds", "INTEGER NOT NULL DEFAULT 3600"),
        ("updated_at", "DATETIME"),
        ("created_by_email", "VARCHAR(255)"),
        ("updated_by_email", "VARCHAR(255)"),
    ]

    public_config_migrations = [
        ("opsbase_project_id", "INTEGER"),
        ("opsbase_schema_name", "VARCHAR(150)"),
        ("opsbase_key_prefix", "VARCHAR(80)"),
        ("opsbase_key_status", "VARCHAR(40) NOT NULL DEFAULT 'active'"),
        ("opsbase_data_plane_url", "VARCHAR(500)"),
        ("opsbase_auth_url", "VARCHAR(500)"),
        ("key_source", "VARCHAR(50) NOT NULL DEFAULT 'opsbase_discovery'"),
        ("last_synced_at", "DATETIME"),
        ("opsbase_rls_enforced", "BOOLEAN"),  # c4 / P-24 (round6): NULL = unknown
    ]

    with engine.begin() as conn:
        if "opspages_projects" in existing_tables:
            existing_cols = {c["name"] for c in inspector.get_columns("opspages_projects")}
            for col_name, col_ddl in project_migrations:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE opspages_projects ADD COLUMN {col_name} {col_ddl}"))
                    logger.info(f"Migrated column opspages_projects.{col_name}")

        if "opspages_cors_rules" in existing_tables:
            existing_cols = {c["name"] for c in inspector.get_columns("opspages_cors_rules")}
            for col_name, col_ddl in cors_migrations:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE opspages_cors_rules ADD COLUMN {col_name} {col_ddl}"))
                    logger.info(f"Migrated column opspages_cors_rules.{col_name}")
            # Ensure wildcard '*' rules never have allow_credentials=1
            conn.execute(text("UPDATE opspages_cors_rules SET allow_credentials = 0 WHERE origin = '*'"))

        if "opspages_public_configs" in existing_tables:
            existing_cols = {c["name"] for c in inspector.get_columns("opspages_public_configs")}
            for col_name, col_ddl in public_config_migrations:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE opspages_public_configs ADD COLUMN {col_name} {col_ddl}"))
                    logger.info(f"Migrated column opspages_public_configs.{col_name}")


def init_meta_db() -> None:
    """Creates all metadata tables and seeds default HBAC groups and Super Admin willian.jesus@loft.com.br."""
    Base.metadata.create_all(bind=engine)
    _ensure_schema_columns()
    settings.repos_root_path.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        # 1. Seed default HBAC groups (Admin, Editor, Viewer)
        default_group_specs = [
            ("Platform Admins", "Acesso administrativo total à plataforma AIOps OpsPages", "admin"),
            ("Frontend Editors", "Upload de builds, aprovação, rollback, versionamento Git e gestão de páginas", "editor"),
            ("Project Viewers", "Acesso de visualização às builds, histórico Git, arquivos e páginas publicadas", "viewer"),
        ]

        admin_group = None
        for g_name, g_desc, g_role in default_group_specs:
            grp = db.query(Group).filter(Group.name == g_name).first()
            if not grp:
                grp = Group(name=g_name, description=g_desc, role_level=g_role)
                db.add(grp)
                db.flush()
                logger.info(f"Seeded HBAC group: {g_name} ({g_role})")
            if g_role == "admin" and admin_group is None:
                admin_group = grp
        db.commit()

        # 2. Ensure default Super Admin (willian.jesus@loft.com.br) is registered
        default_email = (settings.DEFAULT_SUPERADMIN_EMAIL or settings.BOOTSTRAP_ADMIN_EMAIL).strip().lower()
        default_username = (settings.DEFAULT_SUPERADMIN_USERNAME or settings.BOOTSTRAP_ADMIN_USERNAME).strip().lower()
        default_name = (settings.DEFAULT_SUPERADMIN_NAME or settings.BOOTSTRAP_ADMIN_NAME).strip()
        default_pwd = settings.effective_superadmin_password

        super_user = db.query(User).filter(
            (User.email == default_email) | (User.username == default_username)
        ).first()

        if not super_user and default_pwd:
            logger.info(f"Seeding default Super Admin '{default_email}' from .env...")
            super_user = User(
                username=default_username,
                email=default_email,
                hashed_password=hash_password(default_pwd),
                full_name=default_name,
                is_active=True,
                is_superuser=True,
            )
            if admin_group:
                super_user.groups = [admin_group]
            db.add(super_user)
            db.commit()
            logger.info(f"Default Super Admin '{default_email}' created successfully.")
        elif super_user:
            updated = False
            if not super_user.is_superuser:
                super_user.is_superuser = True
                updated = True
            if not super_user.is_active:
                super_user.is_active = True
                updated = True
            if admin_group and all(g.id != admin_group.id for g in super_user.groups):
                super_user.groups.append(admin_group)
                updated = True
            if updated:
                db.commit()

        # 3. Ensure all existing projects are linked & synced with OpsBase Discovery (Part 2 - P-13)
        from app.services.opsbase_service import OpsBaseIntegrationService, VALID_PUBLIC_CONFIG_ENVIRONMENTS

        projects = db.query(Project).all()
        for proj in projects:
            try:
                OpsBaseIntegrationService.link_or_sync_project(
                    db=db,
                    project=proj,
                    # cors-sync-guard: an already-linked project re-syncs its PINNED id only (no slug
                    # fallback, no auto-provision); only never-linked projects may still be provisioned.
                    opsbase_project_id=proj.opsbase_project_id,
                    opsbase_project_slug=proj.opsbase_project_slug or proj.slug,
                    actor_email=default_email,
                    auto_provision_if_missing=not proj.opsbase_project_id,
                    sync_cors=settings.OPSPAGES_STARTUP_CORS_SYNC,
                )
            except Exception as sync_exc:
                # P-22: an auth backoff is logged once per window by the backoff itself.
                if getattr(sync_exc, "code", None) != "OPSBASE_AUTH_BACKOFF":
                    logger.warning(f"OpsBase discovery sync skipped during startup for '{proj.slug}': {sync_exc}")
                # Ensure all 4 environments exist with default URL http://localhost:8001/api/v1 and NO fake placeholder keys
                for env_name in VALID_PUBLIC_CONFIG_ENVIRONMENTS:
                    existing_cfg = (
                        db.query(ProjectPublicConfig)
                        .filter(
                            ProjectPublicConfig.project_id == proj.id,
                            ProjectPublicConfig.environment == env_name,
                        )
                        .first()
                    )
                    if not existing_cfg:
                        cfg = ProjectPublicConfig(
                            project_id=proj.id,
                            environment=env_name,
                            opsbase_url=settings.OPSBASE_DEFAULT_API_URL,
                            opsbase_public_key="",
                            opsbase_project_slug=proj.slug,
                            opsbase_key_status="unlinked",
                            key_source="opsbase_discovery",
                            scopes="public:read,data:query,auth:session,crud:items",
                            inject_in_html=True,
                            is_active=True,
                            updated_by_email=default_email,
                        )
                        cfg.set_public_vars({})
                        db.add(cfg)
                    else:
                        if existing_cfg.opsbase_url.startswith("http://localhost:8000"):
                            existing_cfg.opsbase_url = settings.OPSBASE_DEFAULT_API_URL
                        is_bad, _ = OpsBaseIntegrationService.is_placeholder_or_forbidden_key(
                            existing_cfg.opsbase_public_key
                        )
                        if is_bad:
                            existing_cfg.opsbase_public_key = ""
                            existing_cfg.opsbase_key_status = "unlinked"
                db.commit()

        # 4. Seed initial diagnostic/telemetry ErrorReport records if table is empty
        if db.query(ErrorReport).count() == 0:
            first_proj = projects[0] if projects else None
            seed_errors = [
                ("ERR_CORS_ORIGIN_REJECTED", 403, "warning", "Origem CORS bloqueada fora da allowlist", "Requisição cross-origin bloqueada pelo validador estrito de Origin (Vary: Origin).", "/pages/aiops-crud/index.html", "resolved"),
                ("ERR_PREVIEW_AUTH_REQUIRED", 401, "warning", "Tentativa de acesso ao preview sem aprovação prévia", "Versão em pending_approval exigiu header Authorization Bearer válido (P-4).", "/pages/aiops-crud/v/1.1.0/", "resolved"),
                ("ERR_QUERY_TOKEN_FORBIDDEN", 401, "error", "Token na query string (?token=) bloqueado", "Política P-8 rejeitou credencial enviada na URL para evitar vazamento em logs e Referer.", "/api/v1/projects", "resolved"),
                ("ERR_ASSET_HASH_FALLBACK", 200, "info", "Asset de release anterior recuperado após rollback", "Fallback inteligente serviu bundle com hash a partir de releases/ durante transição de rollback (P-3).", "/pages/aiops-crud/assets/index.js", "resolved"),
                ("ERR_CSP_INLINE_REPORT", 200, "info", "Verificação de política Content-Security-Policy ativa", "Headers CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options e HSTS aplicados (P-2).", "/pages/portal-loft/", "resolved"),
                ("ERR_OPSBASE_RUNTIME_INJECT", 200, "info", "Injeção de credenciais públicas Opsbase concluída", "Script env-config.js injetado com window.__OPSBASE_CONFIG__ e chave pública com escopo (P-13).", "/pages/aiops-crud/env-config.js", "resolved"),
                ("ERR_ETAG_304_CONDITIONAL", 304, "info", "Validação condicional ETag / If-None-Match 304", "Cliente validou cache de index.html via If-None-Match recebendo 304 Not Modified (P-7).", "/pages/portal-loft/index.html", "resolved"),
                ("ERR_UPLOAD_MULTIPART_SCHEMA", 200, "info", "Validação de contrato OpenAPI multipart/form-data", "Schema binário de upload documentado e validado na especificação OpenAPI 3.1 (P-6).", "/api/v1/projects/1/deployments/upload", "resolved"),
                ("ERR_QUICKBUILD_BINARY_ASSET", 201, "info", "Upload de asset binário Base64 via quick-build", "Suporte a arquivos binários (imagens/fontes) e texto no endpoint quick-build (P-12).", "/api/v1/projects/1/deployments/quick-build", "resolved"),
                ("ERR_PREVIEW_BASE_REWRITE", 200, "info", "Isolamento de assets por versão no preview", "Preview reescreveu caminhos de assets para /pages/{slug}/v/{version}/ isolando da versão live (P-5).", "/pages/aiops-crud/v/1.1.0/index.html", "resolved"),
                ("ERR_PUBLIC_OVERVIEW_REDACTED", 200, "info", "Redação de dados sensíveis em /public/overview", "E-mails e caminhos internos de disco ocultados para chamadas não autenticadas (P-11).", "/api/v1/public/overview", "resolved"),
                ("ERR_API_CORS_STRICT_PORT", 403, "warning", "Porta arbitrária de localhost bloqueada na API", "Allowlist explícita de origens aplicada na API sem regex permissivo (P-10).", "/api/v1/auth/me", "resolved"),
            ]
            for code, status_code, sev, title, msg, path_str, st in seed_errors:
                db.add(
                    ErrorReport(
                        project_id=first_proj.id if first_proj else None,
                        project_slug=first_proj.slug if first_proj else "portal-loft",
                        page_url=f"http://localhost:8005{path_str}",
                        route_path=path_str,
                        error_code=code,
                        http_status=status_code,
                        severity=sev,
                        title=title,
                        message=msg,
                        version="1.1.0",
                        environment="production",
                        status=st,
                        reporter_email=default_email,
                    )
                )
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing meta database: {e}")
    finally:
        db.close()
