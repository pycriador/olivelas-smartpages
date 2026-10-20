"""
Application Configuration using Pydantic v2.
Supports SQLite (default), PostgreSQL, and MariaDB/MySQL.
Follows Loft Backend Foundation & Engineering System guidelines.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIOps OpsPages"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Security & JWT
    SECRET_KEY: str = "aiops-opspages-super-secret-key-change-in-production-loft-br"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Platform Meta Database (Supports SQLite, PostgreSQL, MariaDB/MySQL)
    OPSPAGES_META_DB_URL: str = "sqlite:///./opspages_meta.db"
    OPSPAGES_DB_ENGINE: str = "sqlite"  # sqlite | postgresql | mariadb
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "aiops_opspages"
    DB_SSLMODE: str = "prefer"

    # Default Super Admin Seed (loaded from .env)
    DEFAULT_SUPERADMIN_EMAIL: str = "willian.jesus@loft.com.br"
    DEFAULT_SUPERADMIN_USERNAME: str = "willian.jesus"
    DEFAULT_SUPERADMIN_NAME: str = "Willian Jesus"
    DEFAULT_SUPERADMIN_PASSWORD: str = ""
    BOOTSTRAP_ADMIN_EMAIL: str = ""
    BOOTSTRAP_ADMIN_USERNAME: str = ""
    BOOTSTRAP_ADMIN_NAME: str = ""
    BOOTSTRAP_ADMIN_PASSWORD: str = ""
    aiops_opsbase_user: str = ""
    aiops_opsbase_password: str = ""
    aiops_app_builder_user: str = ""
    aiops_app_builder_password: str = ""

    # Git & Static Repositories Storage Path (/repos)
    REPOS_STORAGE_DIR: str = "../repos"

    # Default Project Quota Values
    DEFAULT_MAX_BUILD_SIZE_MB: int = 250
    DEFAULT_MAX_STORAGE_MB: int = 2048
    DEFAULT_MAX_DEPLOYS_PER_DAY: int = 100
    DEFAULT_MAX_RETAINED_VERSIONS: int = 50

    # CORS (Explicit Allowlist - P-10)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8005",
        "http://127.0.0.1:8005",
        "http://localhost:8010",
        "http://127.0.0.1:8010",
    ]

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent.parent.parent / ".env"),
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def effective_superadmin_password(self) -> str:
        """Resolves the Super Admin password from environment configuration (.env)."""
        for candidate in (
            self.DEFAULT_SUPERADMIN_PASSWORD,
            self.aiops_opsbase_password,
            self.BOOTSTRAP_ADMIN_PASSWORD,
            self.aiops_app_builder_password,
        ):
            if candidate and candidate.strip():
                return candidate.strip()
        return ""

    @property
    def valid_superadmin_passwords(self) -> List[str]:
        """Returns all configured Super Admin password candidates from .env files."""
        seen: List[str] = []
        for candidate in (
            self.DEFAULT_SUPERADMIN_PASSWORD,
            self.aiops_opsbase_password,
            self.BOOTSTRAP_ADMIN_PASSWORD,
            self.aiops_app_builder_password,
        ):
            val = (candidate or "").strip()
            if val and val not in seen:
                seen.append(val)
        return seen

    @property
    def repos_root_path(self) -> Path:
        """Resolves the absolute path to the /repos directory."""
        raw = Path(self.REPOS_STORAGE_DIR)
        if raw.is_absolute():
            path = raw
        else:
            path = (self.BASE_DIR / raw).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_database_url(self) -> str:
        """
        Returns the active SQLAlchemy connection URL.
        Supports direct OPSPAGES_META_DB_URL or builds URL from OPSPAGES_DB_ENGINE.
        Automatically normalizes postgres:// and mysql:// schemes to SQLAlchemy 2.0 drivers.
        """
        url = (self.OPSPAGES_META_DB_URL or "").strip()
        engine_type = (self.OPSPAGES_DB_ENGINE or "sqlite").strip().lower()

        if url and not (url == "sqlite:///./opspages_meta.db" and engine_type in ("postgresql", "postgres", "mariadb", "mysql")):
            if url == "sqlite:///./opspages_meta.db":
                return f"sqlite:///{(self.BASE_DIR / 'opspages_meta.db').resolve()}"
            if url.startswith("postgres://"):
                return url.replace("postgres://", "postgresql+psycopg://", 1)
            if url.startswith("postgresql://") and "+psycopg" not in url:
                return url.replace("postgresql://", "postgresql+psycopg://", 1)
            if (url.startswith("mysql://") or url.startswith("mariadb://")) and "+pymysql" not in url:
                prefix = "mysql://" if url.startswith("mysql://") else "mariadb://"
                return url.replace(prefix, "mysql+pymysql://", 1)
            return url

        if engine_type in ("postgresql", "postgres"):
            port = self.DB_PORT or 5432
            return (
                f"postgresql+psycopg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{port}/{self.DB_NAME}?sslmode={self.DB_SSLMODE}"
            )
        if engine_type in ("mariadb", "mysql"):
            port = self.DB_PORT if self.DB_PORT != 5432 else 3306
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{port}/{self.DB_NAME}?charset=utf8mb4"
            )
        return "sqlite:///./opspages_meta.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
