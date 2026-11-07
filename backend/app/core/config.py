"""
Core configuration module for Olivelas SmartPages (AIOps OpsPages Static Hosting & Governance Platform).
Supports Supabase PostgreSQL (with isolated schema `smartpages` and automatic IPv4 Pooler resolution),
MySQL/MariaDB, and SQLite.
"""
from __future__ import annotations

import os
import socket
from pathlib import Path
from typing import List, Set
from urllib.parse import quote_plus
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent

# Load root .env first, then backend/.env (without overriding existing OS env vars)
if (ROOT_DIR / ".env").exists():
    load_dotenv(ROOT_DIR / ".env", override=False)
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env", override=False)


def _resolve_ipv4(hostname: str, port: int = 5432) -> str | None:
    """Returns the first IPv4 address for hostname, or None if only IPv6/unresolvable."""
    try:
        infos = socket.getaddrinfo(hostname, port, socket.AF_INET, socket.SOCK_STREAM)
        if infos:
            return infos[0][4][0]
    except Exception:
        return None
    return None


def _build_supabase_postgres_url(
    db_host: str,
    db_port: int,
    db_name: str,
    db_user: str,
    db_password: str,
    pooler_region: str = "aws-1-us-west-2",
) -> str:
    """
    Builds a SQLAlchemy postgresql+psycopg URL from Supabase credentials.
    Automatically falls back to the Supabase IPv4 Session Pooler when the direct
    host (db.<ref>.supabase.co) only has IPv6 DNS records on an IPv4-only network.
    """
    actual_host = db_host.strip()
    actual_user = db_user.strip()
    actual_port = int(db_port or 5432)

    ipv4 = _resolve_ipv4(actual_host, actual_port)
    if not ipv4 and actual_host.startswith("db.") and actual_host.endswith(".supabase.co"):
        project_ref = actual_host[len("db.") : -len(".supabase.co")]
        pooler_host = os.getenv("SUPABASE_POOLER_HOST", f"{pooler_region}.pooler.supabase.com")
        actual_host = pooler_host
        if "." not in actual_user:
            actual_user = f"{actual_user}.{project_ref}"
        ipv4 = _resolve_ipv4(pooler_host, actual_port)

    encoded_user = quote_plus(actual_user)
    encoded_pass = quote_plus(db_password)
    base_url = f"postgresql+psycopg://{encoded_user}:{encoded_pass}@{actual_host}:{actual_port}/{db_name}"
    if ipv4:
        return f"{base_url}?hostaddr={ipv4}&connect_timeout=10"
    return f"{base_url}?connect_timeout=10"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Olivelas SmartPages — Static Hosting & Governance"
    APP_NAME: str = "Olivelas SmartPages — Static Hosting & Governance"
    VERSION: str = "1.0.0"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    LOG_LEVEL: str = "INFO"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8005

    # Security & JWT
    SECRET_KEY: str = os.getenv(
        "OPSPAGES_JWT_SECRET",
        os.getenv("SECRET_KEY", "olivelas-smartpages-jwt-secret-key-production-2026"),
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("OPSPAGES_JWT_EXPIRE_MINUTES", os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    )

    # Supabase API & PostgreSQL Credentials (.env)
    VITE_SUPABASE_URL: str = os.getenv("VITE_SUPABASE_URL", "")
    VITE_SUPABASE_KEY: str = os.getenv("VITE_SUPABASE_KEY", "")
    db_host: str = os.getenv("db_host", os.getenv("DB_HOST", ""))
    db_port: int = int(os.getenv("db_port", os.getenv("DB_PORT", "5432")))
    db: str = os.getenv("db", os.getenv("DB", "postgres"))
    db_username: str = os.getenv(
        "db_username",
        os.getenv("DB_USERNAME", os.getenv("username", "postgres")),
    )
    db_password: str = os.getenv("db_password", os.getenv("DB_PASSWORD", ""))

    # Isolated Schema for this project in Supabase
    DB_SCHEMA: str = os.getenv("DB_SCHEMA", os.getenv("VITE_SUPABASE_SCHEMA", "smartpages"))
    OPSPAGES_META_DB_URL: str = os.getenv("OPSPAGES_META_DB_URL", "")

    # First-user registration policy (First user registered becomes Global Admin)
    FIRST_USER_IS_GLOBAL_ADMIN: bool = (
        os.getenv("FIRST_USER_IS_GLOBAL_ADMIN", "true").lower() in ("1", "true", "yes")
    )

    # Optional legacy/bootstrap admin env vars (kept empty by default so first registration is Global Admin)
    DEFAULT_SUPERADMIN_EMAIL: str = os.getenv("DEFAULT_SUPERADMIN_EMAIL", "")
    DEFAULT_SUPERADMIN_USERNAME: str = os.getenv("DEFAULT_SUPERADMIN_USERNAME", "")
    DEFAULT_SUPERADMIN_NAME: str = os.getenv("DEFAULT_SUPERADMIN_NAME", "")
    DEFAULT_SUPERADMIN_PASSWORD: str = os.getenv("DEFAULT_SUPERADMIN_PASSWORD", "")
    BOOTSTRAP_ADMIN_EMAIL: str = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "")
    BOOTSTRAP_ADMIN_USERNAME: str = os.getenv("BOOTSTRAP_ADMIN_USERNAME", "")
    BOOTSTRAP_ADMIN_NAME: str = os.getenv("BOOTSTRAP_ADMIN_NAME", "")
    BOOTSTRAP_ADMIN_PASSWORD: str = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")

    aiops_opsbase_user: str = os.getenv("aiops_opsbase_user", "")
    aiops_opsbase_password: str = os.getenv("aiops_opsbase_password", "")
    aiops_app_builder_password: str = os.getenv("aiops_app_builder_password", "")
    aiops_opspages_password: str = os.getenv("aiops_opspages_password", "")

    # Storage & Git Repository Paths
    REPOS_STORAGE_DIR: str = os.getenv("REPOS_STORAGE_DIR", "../repos")
    STORAGE_ROOT: Path = BASE_DIR / "storage"
    SITES_STORAGE_DIR: Path = BASE_DIR / "storage" / "sites"
    GIT_REPOS_DIR: Path = BASE_DIR / "storage" / "git_repos"
    TEMP_UPLOADS_DIR: Path = BASE_DIR / "storage" / "tmp"

    # Default Project Quotas
    DEFAULT_MAX_BUILD_SIZE_MB: int = int(os.getenv("DEFAULT_MAX_BUILD_SIZE_MB", "250"))
    DEFAULT_MAX_STORAGE_MB: int = int(os.getenv("DEFAULT_MAX_STORAGE_MB", "2048"))
    DEFAULT_MAX_DEPLOYS_PER_DAY: int = int(os.getenv("DEFAULT_MAX_DEPLOYS_PER_DAY", "100"))
    DEFAULT_MAX_RETAINED_VERSIONS: int = int(os.getenv("DEFAULT_MAX_RETAINED_VERSIONS", "50"))
    DEFAULT_MAX_UPLOAD_MB: int = 100
    DEFAULT_MAX_FILES_PER_DEPLOY: int = 2500

    # OpsBase / Runtime Integration Settings
    OPSBASE_BASE_URL: str = os.getenv(
        "OPSBASE_BASE_URL",
        os.getenv("VITE_SUPABASE_URL", "http://localhost:8001"),
    )
    OPSBASE_DEFAULT_API_URL: str = os.getenv(
        "OPSBASE_DEFAULT_API_URL",
        "http://localhost:8001/api/v1",
    )
    OPSPAGES_PUBLIC_ORIGIN: str = os.getenv("OPSPAGES_PUBLIC_ORIGIN", "http://localhost:8005")
    OPSPAGES_FRONTEND_ORIGIN: str = os.getenv("OPSPAGES_FRONTEND_ORIGIN", "http://localhost:5185")
    OPSPAGES_STARTUP_CORS_SYNC: bool = False
    OPSBASE_PUBLIC_CONFIG_SYNC_TTL_SECONDS: int = 300
    OPSBASE_WEBHOOK_SECRET: str = os.getenv("OPSBASE_WEBHOOK_SECRET", "")

    # Platform CORS (Control Plane API)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5185",
        "http://127.0.0.1:5185",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8005",
        "http://127.0.0.1:8005",
        "https://pycriador.github.io",
    ]
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @property
    def repos_root_path(self) -> Path:
        raw = Path(self.REPOS_STORAGE_DIR)
        if raw.is_absolute():
            return raw
        return (BASE_DIR / raw).resolve()

    @property
    def effective_superadmin_password(self) -> str:
        for candidate in (
            self.DEFAULT_SUPERADMIN_PASSWORD,
            self.BOOTSTRAP_ADMIN_PASSWORD,
            self.aiops_opspages_password,
        ):
            if candidate and candidate.strip():
                return candidate.strip()
        return ""

    @property
    def valid_superadmin_passwords(self) -> Set[str]:
        return {
            p.strip()
            for p in (
                self.DEFAULT_SUPERADMIN_PASSWORD,
                self.BOOTSTRAP_ADMIN_PASSWORD,
                self.aiops_opspages_password,
                self.aiops_app_builder_password,
            )
            if p and p.strip()
        }

    def get_default_opsbase_url_for_env(self, env_name: str = "production") -> str:
        if self.VITE_SUPABASE_URL:
            return f"{self.VITE_SUPABASE_URL.rstrip('/')}/rest/v1"
        return self.OPSBASE_DEFAULT_API_URL

    def get_database_url(self) -> str:
        """
        Resolves the active SQLAlchemy database URL:
        1. Explicit OPSPAGES_META_DB_URL environment variable (used by tests or custom overrides)
        2. Supabase PostgreSQL connection built from db_host, db_port, db, db_username, db_password
        3. Local SQLite fallback if no Supabase credentials are configured
        """
        explicit_url = (self.OPSPAGES_META_DB_URL or os.getenv("OPSPAGES_META_DB_URL", "")).strip()
        if explicit_url:
            return explicit_url

        if self.db_host and self.db_password:
            return _build_supabase_postgres_url(
                db_host=self.db_host,
                db_port=self.db_port,
                db_name=self.db,
                db_user=self.db_username,
                db_password=self.db_password,
            )

        return f"sqlite:///{BASE_DIR / 'opspages_meta.db'}"

    @property
    def META_DB_URL(self) -> str:
        return self.get_database_url()

    def ensure_directories(self) -> None:
        for directory in (
            self.STORAGE_ROOT,
            self.SITES_STORAGE_DIR,
            self.GIT_REPOS_DIR,
            self.TEMP_UPLOADS_DIR,
            self.repos_root_path,
        ):
            directory.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_directories()
