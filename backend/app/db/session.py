"""
Database session management for Olivelas SmartPages (AIOps OpsPages).
Supports Supabase PostgreSQL (isolated `smartpages` schema), SQLite, and MariaDB/MySQL.
Initializes tables and seeds ONLY platform configurations, HBAC role groups, and visual themes.
Users and projects start empty so the first user registered becomes the Global Admin.
"""
from __future__ import annotations

import json
import logging
from typing import Generator
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.models.meta_models import (
    Base,
    Group,
    PlatformSetting,
    PlatformTheme,
    Project,
    ProjectPublicConfig,
    User,
)

logger = logging.getLogger("aiops.opspages.db")

db_url = settings.get_database_url()
connect_args = {}
engine_kwargs = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif db_url.startswith("postgresql"):
    schema_name = (settings.DB_SCHEMA or "smartpages").strip()
    connect_args.update(
        {
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
            "options": f"-c search_path={schema_name},public,extensions",
        }
    )
    engine_kwargs.update(
        {
            "pool_size": 10,
            "max_overflow": 15,
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
            "pool_size": 10,
            "max_overflow": 15,
            "pool_recycle": 600,
            "pool_pre_ping": True,
        }
    )

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs,
)

if db_url.startswith("postgresql"):
    @event.listens_for(engine, "connect")
    def _set_postgres_search_path(dbapi_connection, connection_record) -> None:
        schema_name = (settings.DB_SCHEMA or "smartpages").strip()
        cursor = dbapi_connection.cursor()
        cursor.execute(f"SET search_path TO {schema_name}, public, extensions")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)


def get_meta_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a Meta DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_engine_info() -> dict:
    """Returns diagnostic info about the active database dialect, schema, and connection."""
    dialect = engine.dialect.name
    ok = False
    error_msg = None
    active_schema = settings.DB_SCHEMA if dialect == "postgresql" else "default"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            ok = True
    except Exception as e:
        error_msg = str(e)

    return {
        "dialect": dialect,
        "driver": engine.dialect.driver,
        "schema": active_schema,
        "connected": ok,
        "error": error_msg,
        "supported_engines": ["sqlite", "postgresql", "mariadb"],
        "repos_root": str(settings.repos_root_path),
        "supabase_url": settings.VITE_SUPABASE_URL,
    }


DEFAULT_PLATFORM_SETTINGS = [
    (
        "platform.identity",
        "branding",
        {
            "app_name": "Olivelas SmartPages — Static Hosting & Governance",
            "short_name": "SmartPages",
            "organization": "Olivelas / Loft Engineering",
            "tagline": "Plataforma Corporativa de Publicação Estática, Versionamento Git e Governança HBAC",
            "repository_url": "https://github.com/pycriador/olivelas-smartpages",
            "schema": settings.DB_SCHEMA or "smartpages",
        },
        "Identidade institucional e metadados da plataforma",
    ),
    (
        "platform.appearance",
        "personalization",
        {
            "default_theme_id": "loft-obsidian",
            "default_light_theme_id": "loft-classic",
            "default_dark_theme_id": "loft-obsidian",
            "default_language": "pt-BR",
            "supported_languages": ["pt-BR", "en-US", "es-ES"],
            "allow_user_theme_override": True,
            "allow_user_language_override": True,
        },
        "Personalizações visuais padrão (tema claro/escuro e internacionalização i18n)",
    ),
    (
        "platform.auth_policy",
        "security",
        {
            "first_user_is_global_admin": True,
            "allow_self_registration": True,
            "default_self_register_role": "viewer",
            "jwt_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "min_password_length": 6,
        },
        "Políticas de autenticação e promoção automática do primeiro cadastro para Global Admin",
    ),
    (
        "platform.default_quotas",
        "governance",
        {
            "max_build_size_mb": settings.DEFAULT_MAX_BUILD_SIZE_MB,
            "max_storage_mb": settings.DEFAULT_MAX_STORAGE_MB,
            "max_deploys_per_day": settings.DEFAULT_MAX_DEPLOYS_PER_DAY,
            "max_retained_versions": settings.DEFAULT_MAX_RETAINED_VERSIONS,
            "default_spa_mode": True,
            "default_auto_approval": True,
        },
        "Quotas e limites operacionais padrão aplicados a novos projetos",
    ),
    (
        "platform.default_cors_csp",
        "security",
        {
            "origin": "*",
            "allowed_methods": "GET,HEAD,OPTIONS",
            "allowed_headers": "*",
            "allow_credentials": False,
            "x_frame_options": "SAMEORIGIN",
            "referrer_policy": "strict-origin-when-cross-origin",
        },
        "Regras padrão de CORS e Content-Security-Policy para projetos publicados",
    ),
]

DEFAULT_THEMES = [
    ("loft-classic", "Loft Classic (Laranja Copan)", "light", False, "#F56738", "#D94616", "#B83208", "#F4F7F9", "#FFFFFF", "#121619", "#FFFFFF", "#1A2024", "#E1E9EF", "#F56738", False, 1),
    ("emerald-supabase", "Emerald Supabase", "light", False, "#24B47E", "#1EA06E", "#17855B", "#F6FBF8", "#FFFFFF", "#0E1E17", "#FFFFFF", "#182C23", "#D2EDE0", "#24B47E", False, 2),
    ("sapphire-tech", "Sapphire Tech (Azul Corporativo)", "light", False, "#1677FF", "#4096FF", "#0958D9", "#F4F8FC", "#FFFFFF", "#0A1626", "#FFFFFF", "#102A45", "#D0E2FF", "#1677FF", False, 3),
    ("royal-violet", "Royal Violet (Roxo Real)", "light", False, "#722ED1", "#9254DE", "#531DAB", "#F8F6FD", "#FFFFFF", "#1A0E2E", "#FFFFFF", "#22075E", "#EFDBFF", "#722ED1", False, 4),
    ("sunset-coral", "Sunset Coral (Coral Vibrante)", "light", False, "#FF5722", "#FF7043", "#E64A19", "#FFF7F4", "#FFFFFF", "#26120D", "#FFFFFF", "#2B130E", "#FFDCCF", "#FF5722", False, 5),
    ("nordic-teal", "Nordic Teal (Turquesa Nórdico)", "light", False, "#13C2C2", "#36CFC9", "#08979C", "#F2FCFC", "#FFFFFF", "#092121", "#FFFFFF", "#002329", "#B5F5EC", "#13C2C2", False, 6),
    ("rose-berry", "Rose Berry (Rosa Moderno)", "light", False, "#EB2F96", "#F759AB", "#C41D7F", "#FDF4F8", "#FFFFFF", "#260B1B", "#FFFFFF", "#3B0A26", "#FFD6E7", "#EB2F96", False, 7),
    ("amber-gold", "Amber Gold (Dourado Âmbar)", "light", False, "#FAAD14", "#FFC53D", "#D48806", "#FDFBF2", "#FFFFFF", "#241D09", "#FFFFFF", "#362602", "#FFE58F", "#FAAD14", False, 8),
    ("forest-mint", "Forest Mint (Verde Floresta)", "light", False, "#52C41A", "#73D13D", "#389E0D", "#F6FCF2", "#FFFFFF", "#102409", "#FFFFFF", "#132B09", "#D9F7BE", "#52C41A", False, 9),
    ("slate-graphite", "Slate Graphite (Grafite Executivo)", "light", False, "#4A5568", "#718096", "#2D3748", "#F7FAFC", "#FFFFFF", "#1A202C", "#FFFFFF", "#1A202C", "#E2E8F0", "#4A5568", False, 10),
    ("loft-obsidian", "Loft Obsidian (Escuro Copan)", "dark", True, "#F56738", "#FF8155", "#D94616", "#0E1216", "#141A1E", "#0A0D10", "#141A1E", "#F0F4F8", "#2A3640", "#F56738", True, 11),
    ("supabase-midnight", "Supabase Midnight", "dark", True, "#24B47E", "#33D998", "#1EA06E", "#121212", "#1C1C1C", "#0D0D0D", "#1C1C1C", "#EDEDED", "#2E2E2E", "#24B47E", False, 12),
    ("cyberpunk-neon", "Cyberpunk Neon", "dark", True, "#00F0FF", "#38F4FF", "#00C3CF", "#0B0F19", "#111827", "#070A11", "#111827", "#F3F4F6", "#1F2937", "#00F0FF", False, 13),
    ("synthwave-violet", "Synthwave Violet", "dark", True, "#BD34FE", "#D369FF", "#9A15DC", "#130B24", "#1E1235", "#0C0617", "#1E1235", "#F5F3FF", "#341E5C", "#BD34FE", False, 14),
    ("tokyo-night", "Tokyo Night", "dark", True, "#7AA2F7", "#96B7FA", "#5485E8", "#1A1B26", "#24283B", "#13141C", "#24283B", "#C0CAF5", "#2F354D", "#7AA2F7", False, 15),
    ("dracula-classic", "Dracula Classic", "dark", True, "#FF79C6", "#FF94D2", "#E05AA7", "#21222C", "#282A36", "#191A21", "#282A36", "#F8F8F2", "#44475A", "#FF79C6", False, 16),
    ("nord-deep-sea", "Nord Deep Sea", "dark", True, "#88C0D0", "#A3D4E2", "#6CA8B9", "#242933", "#2E3440", "#1B1F27", "#2E3440", "#ECEFF4", "#434C5E", "#88C0D0", False, 17),
    ("matrix-green", "Matrix Terminal", "dark", True, "#00FF66", "#33FF85", "#00D655", "#0A0E0C", "#101713", "#060907", "#101713", "#D1FADF", "#1A2920", "#00FF66", False, 18),
    ("catppuccin-mocha", "Catppuccin Mocha", "dark", True, "#F5C2E7", "#FAD8F0", "#E5A4D4", "#181825", "#1E1E2E", "#11111B", "#1E1E2E", "#CDD6F4", "#313244", "#F5C2E7", False, 19),
    ("monokai-amber", "Monokai Amber", "dark", True, "#F59E0B", "#FBBF24", "#D97706", "#141416", "#1D1E22", "#0C0D0E", "#1D1E22", "#F3F4F6", "#33353D", "#F59E0B", False, 20),
]


def _ensure_schema_columns() -> None:
    """Safely adds newly introduced columns to existing tables."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    user_migrations = [
        ("preferred_theme", "VARCHAR(80) NOT NULL DEFAULT 'loft-obsidian'"),
        ("preferred_language", "VARCHAR(16) NOT NULL DEFAULT 'pt-BR'"),
    ]

    with engine.begin() as conn:
        if "opspages_users" in existing_tables:
            existing_cols = {c["name"] for c in inspector.get_columns("opspages_users")}
            for col_name, col_ddl in user_migrations:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE opspages_users ADD COLUMN {col_name} {col_ddl}"))
                    logger.info(f"Migrated column opspages_users.{col_name}")


def init_meta_db() -> None:
    """
    Creates all metadata tables in the target schema and seeds:
    1. Default HBAC role groups (Platform Admins, Frontend Editors, Project Viewers)
    2. Platform settings (`opspages_platform_settings`)
    3. 20 Visual Themes (`opspages_themes`)
    Note: Does NOT seed default users or projects unless explicit bootstrap env vars are passed.
    """
    if engine.dialect.name == "postgresql":
        schema_name = (settings.DB_SCHEMA or "smartpages").strip()
        with engine.begin() as conn:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))

    Base.metadata.create_all(bind=engine)
    _ensure_schema_columns()
    settings.repos_root_path.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        # 1. Seed default HBAC groups (Admin, Editor, Viewer) in a single query
        default_group_specs = [
            ("Platform Admins", "Acesso administrativo total à plataforma Olivelas SmartPages (Global Admin)", "admin"),
            ("Frontend Editors", "Upload de builds, aprovação, rollback, versionamento Git e gestão de páginas", "editor"),
            ("Project Viewers", "Acesso de visualização às builds, histórico Git, arquivos e páginas publicadas", "viewer"),
        ]

        existing_groups = {g.name: g for g in db.query(Group).all()}
        admin_group = None
        for g_name, g_desc, g_role in default_group_specs:
            grp = existing_groups.get(g_name)
            if not grp:
                grp = Group(name=g_name, description=g_desc, role_level=g_role)
                db.add(grp)
                db.flush()
                logger.info(f"Seeded HBAC group: {g_name} ({g_role})")
            if g_role == "admin" and admin_group is None:
                admin_group = grp

        # 2. Seed Platform Settings (`opspages_platform_settings`) in a single query
        existing_setting_keys = {r[0] for r in db.query(PlatformSetting.key).all()}
        for key, category, val_dict, desc in DEFAULT_PLATFORM_SETTINGS:
            if key not in existing_setting_keys:
                db.add(
                    PlatformSetting(
                        key=key,
                        category=category,
                        value_json=json.dumps(val_dict, ensure_ascii=False),
                        description=desc,
                    )
                )

        # 3. Seed 20 Visual Themes (`opspages_themes`) in a single query
        existing_theme_ids = {r[0] for r in db.query(PlatformTheme.id).all()}
        for (
            t_id, t_name, t_type, t_dark,
            p_col, p_hov, p_act,
            bg_lay, bg_con, bg_sid, bg_hea,
            c_txt, c_bor, b_tag,
            is_def, s_ord
        ) in DEFAULT_THEMES:
            if t_id not in existing_theme_ids:
                db.add(
                    PlatformTheme(
                        id=t_id,
                        name=t_name,
                        type=t_type,
                        is_dark=t_dark,
                        primary_color=p_col,
                        primary_hover=p_hov,
                        primary_active=p_act,
                        bg_layout=bg_lay,
                        bg_container=bg_con,
                        bg_sidebar=bg_sid,
                        bg_header=bg_hea,
                        color_text=c_txt,
                        color_border=c_bor,
                        badge_tag=b_tag,
                        is_default=is_def,
                        sort_order=s_ord,
                    )
                )
        db.commit()

        # 4. Optional explicit bootstrap admin (only if explicitly set in env, e.g. automated test fixtures)
        default_email = (settings.DEFAULT_SUPERADMIN_EMAIL or settings.BOOTSTRAP_ADMIN_EMAIL).strip().lower()
        default_username = (settings.DEFAULT_SUPERADMIN_USERNAME or settings.BOOTSTRAP_ADMIN_USERNAME).strip().lower()
        default_name = (settings.DEFAULT_SUPERADMIN_NAME or settings.BOOTSTRAP_ADMIN_NAME).strip()
        default_pwd = settings.effective_superadmin_password

        if default_email and default_pwd:
            if not default_username:
                default_username = default_email.split("@")[0]
            super_user = db.query(User).filter(
                (User.email == default_email) | (User.username == default_username)
            ).first()
            if not super_user:
                super_user = User(
                    username=default_username,
                    email=default_email,
                    hashed_password=hash_password(default_pwd),
                    full_name=default_name or default_username,
                    is_active=True,
                    is_superuser=True,
                )
                if admin_group:
                    super_user.groups = [admin_group]
                db.add(super_user)
                db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing meta database: {e}")
    finally:
        db.close()
