"""
AIOps OpsBase Integration Service (Part 2 - P-13, Discovery, Key Sync & CORS Alignment).

Responsibilities:
1. Project Linking & Discovery:
   - Links each OpsPages project to an OpsBase project (`http://localhost:8001`).
   - Fetches the scoped `anon` public key (`opsbase_anon_...`) and canonical URLs directly
     from OpsBase's discovery endpoint (`/api/v1/projects/{id}/public-config` or `/discovery`).
   - Strictly forbids manually typed keys, placeholders (`opsb_pub_...`, `<...>`, `placeholder`),
     and privileged `service_role` keys.
2. Per-Environment URL & Config Management:
   - Default `opsbase_url` is `http://localhost:8001/api/v1` in development, configurable per
     environment (`production`, `staging`, `development`, `preview`) for custom DNS domains.
3. Zero-Redeploy Key Synchronization:
   - Updates or revokes the public key across all project environments via webhook or on-demand
     sync without redeploying the static build.
4. Secret Sanitization:
   - Ensures `service_role_key`, passwords, and database URIs (`postgresql://`, `mysql://`, `sqlite:///`)
     are never accepted, stored, or delivered in public runtime config.
5. One-Step Exact-Origin CORS Alignment:
   - Automatically registers the project's exact OpsPages origins (including `custom_domain`)
     in both OpsPages (`CorsRule`) and OpsBase (`POST /api/v1/projects/{id}/cors/pages-sync`).
"""
from __future__ import annotations

import json
import logging
import re
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ApplicationError, NotFoundError, ValidationError
from app.models.meta_models import CorsRule, Project, ProjectPublicConfig
from app.services.audit_service import AuditService

logger = logging.getLogger("aiops.opspages.opsbase")


# --- OpsBase admin-login backoff (Item P-22) -------------------------------------------
# A wrong or outdated platform credential must never turn into a login storm against
# OpsBase (incident 2026-10-21 14:44 BRT: ~40 logins in 19 s, both lock counters tripped).
# Process-wide, thread-safe negative cache per OpsBase base URL: after a failed admin
# login no new attempt is made for 30 s, doubling per consecutive failure up to 5 min.
# A successful login resets it. While in backoff callers get OpsBaseAuthBackoffError
# without any request to OpsBase; public-config paths keep serving the last good value.
OPSBASE_AUTH_BACKOFF_BASE_SECONDS = 30.0
OPSBASE_AUTH_BACKOFF_MAX_SECONDS = 300.0
_monotonic = time.monotonic  # patched by offline tests to simulate the clock


class OpsBaseAuthBackoffError(ApplicationError):
    """Raised instead of logging in to OpsBase while the auth backoff window is open."""

    def __init__(self, retry_after_seconds: float, reason: str = "auth backoff"):
        retry = max(0, int(round(retry_after_seconds)))
        super().__init__(
            message=(
                f"OpsBase admin authentication in backoff ({reason}); "
                f"no login attempted, retry in {retry}s."
            ),
            code="OPSBASE_AUTH_BACKOFF",
            status_code=503,
            details={"retry_after_seconds": retry, "reason": reason},
        )
        self.retry_after_seconds = retry


class _OpsBaseAuthBackoff:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._state: Dict[str, Dict[str, Any]] = {}

    def remaining(self, base: str) -> float:
        with self._lock:
            st = self._state.get(base)
            if not st:
                return 0.0
            return max(0.0, st["until"] - _monotonic())

    def check(self, base: str) -> None:
        """Raise OpsBaseAuthBackoffError if base is in backoff (logs once per window)."""
        with self._lock:
            st = self._state.get(base)
            if not st:
                return
            left = st["until"] - _monotonic()
            if left <= 0:
                return
            if not st["logged"]:
                st["logged"] = True
                logger.warning(
                    "OpsBase admin login in backoff for %s: %d consecutive failure(s), last status %s; "
                    "no login attempts for the next %ds (serving cached public config).",
                    base, st["failures"], st["last_status"], int(left),
                )
            reason = st["reason"]
        raise OpsBaseAuthBackoffError(left, reason)

    def record_failure(self, base: str, status_code: Optional[int]) -> float:
        with self._lock:
            st = self._state.get(base) or {"failures": 0}
            failures = int(st.get("failures", 0)) + 1
            window = min(
                OPSBASE_AUTH_BACKOFF_BASE_SECONDS * (2 ** (failures - 1)),
                OPSBASE_AUTH_BACKOFF_MAX_SECONDS,
            )
            self._state[base] = {
                "failures": failures,
                "until": _monotonic() + window,
                "logged": False,
                "last_status": status_code,
                "reason": f"login failed (HTTP {status_code})" if status_code else "login failed",
            }
            return window

    def record_success(self, base: str) -> None:
        with self._lock:
            self._state.pop(base, None)

    def reset_all(self) -> None:
        with self._lock:
            self._state.clear()


opsbase_auth_backoff = _OpsBaseAuthBackoff()


def opsbase_backoff_key(opsbase_base_url: Optional[str] = None) -> str:
    """Normalized OpsBase base URL, same derivation fetch_discovery/_authenticate use."""
    base = (opsbase_base_url or settings.OPSBASE_BASE_URL or "http://localhost:8001").strip().rstrip("/")
    if base.endswith("/api/v1"):
        base = base[: -len("/api/v1")]
    return base

VALID_PUBLIC_CONFIG_ENVIRONMENTS = ("production", "staging", "development", "preview")

FORBIDDEN_SECRET_KEY_PATTERNS = (
    "service_role",
    "service_key",
    "opsbase_service",
    "secret_key",
    "jwt_secret",
    "client_secret",
    "private_key",
    "db_password",
    "database_password",
    "postgres_password",
    "mysql_password",
    "password",
    "passwd",
    "database_url",
    "db_url",
    "db_uri",
    "database_uri",
    "connection_string",
    "pg_dsn",
    "sqlalchemy_database_uri",
    "master_key",
)

FORBIDDEN_SECRET_VALUE_PATTERNS = (
    re.compile(r"^opsbase_service_", re.IGNORECASE),
    re.compile(r"^opsb_srv_", re.IGNORECASE),
    re.compile(r"^opsb_sec_", re.IGNORECASE),
    re.compile(r"^(postgres|postgresql|mysql|mariadb|sqlite|mongodb|redis)(\+[a-z0-9_]+)?://", re.IGNORECASE),
    re.compile(r"password\s*=", re.IGNORECASE),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----", re.IGNORECASE),
)

PLACEHOLDER_KEY_PATTERNS = (
    re.compile(r"^opsb_pub_", re.IGNORECASE),
    re.compile(r"^<.*>$"),
    re.compile(r"^\$\{.*\}$"),
    re.compile(r"(placeholder|changeme|your_key|your-key|example|dummy|mock|fake|todo|insert_key|null|undefined)", re.IGNORECASE),
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OpsBaseIntegrationService:
    """Manages discovery, key synchronization, secret validation, and CORS alignment with OpsBase."""

    @staticmethod
    def validate_environment_name(environment: Optional[str], allow_none: bool = False) -> str:
        """
        Validates the requested environment name strictly.
        Never falls back silently to 'production' when an invalid environment is passed.
        """
        if environment is None:
            if allow_none:
                return "production"
            raise ValidationError(
                f"Parâmetro 'env' ausente. Ambientes válidos: {', '.join(VALID_PUBLIC_CONFIG_ENVIRONMENTS)}."
            )

        clean_env = str(environment).strip().lower()
        if not clean_env or clean_env not in VALID_PUBLIC_CONFIG_ENVIRONMENTS:
            raise ValidationError(
                f"Ambiente '{environment}' inválido. O OpsPages não faz fallback silencioso para 'production'. "
                f"Ambientes suportados: {', '.join(VALID_PUBLIC_CONFIG_ENVIRONMENTS)}."
            )
        return clean_env

    @staticmethod
    def is_placeholder_or_forbidden_key(raw_key: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Checks whether a key string is a placeholder, legacy fake key, or forbidden service_role key.
        Returns (is_invalid, reason).
        """
        if raw_key is None:
            return False, None
        key = str(raw_key).strip()
        if not key:
            return False, None

        for pat in FORBIDDEN_SECRET_VALUE_PATTERNS:
            if pat.search(key):
                return True, (
                    "Chave privilegiada (service_role_key) ou segredo de banco detectado. "
                    "O OpsPages nunca aceita nem expõe service_role_key, senhas ou URIs de banco."
                )

        for pat in PLACEHOLDER_KEY_PATTERNS:
            if pat.search(key):
                return True, (
                    f"Valor placeholder ou chave legada ('{key[:24]}...') rejeitado. "
                    "O OpsPages exige vínculo com o endpoint de descoberta do OpsBase."
                )

        if not re.match(r"^opsbase_anon_[A-Za-z0-9_\-]{16,}$", key):
            return True, (
                "Formato de chave pública inválido. Apenas chaves 'opsbase_anon_...' emitidas e "
                "descobertas diretamente do OpsBase são aceitas."
            )

        return False, None

    @staticmethod
    def validate_and_sanitize_public_vars(
        public_vars: Optional[Dict[str, Any]],
        strict_raise: bool = True,
    ) -> Dict[str, Any]:
        """
        Ensures `public_vars` never contains `service_role_key`, database passwords,
        connection URIs, or manually injected `OPSBASE_PUBLIC_KEY` placeholders.
        """
        if not public_vars or not isinstance(public_vars, dict):
            return {}

        sanitized: Dict[str, Any] = {}
        for k, v in public_vars.items():
            key_str = str(k).strip()
            key_lower = key_str.lower()
            val_str = "" if v is None else str(v).strip()

            # Check forbidden secret key names
            if any(forbidden in key_lower for forbidden in FORBIDDEN_SECRET_KEY_PATTERNS):
                if strict_raise:
                    raise ValidationError(
                        f"A propriedade '{key_str}' é proibida na configuração pública. "
                        "O OpsPages nunca armazena nem entrega service_role_key, senhas ou URIs de banco no frontend."
                    )
                continue

            # Check forbidden secret values (service_role keys, DB URIs, private keys)
            if val_str:
                matched_secret = False
                for pat in FORBIDDEN_SECRET_VALUE_PATTERNS:
                    if pat.search(val_str):
                        matched_secret = True
                        break
                if matched_secret:
                    if strict_raise:
                        raise ValidationError(
                            f"O valor de '{key_str}' contém credencial sensível proibida (service_role_key, senha ou URI de banco)."
                        )
                    continue

            # Prevent manual key injection via public_vars
            if key_lower in ("opsbase_public_key", "opsbase_anon_key", "anon_key", "public_key"):
                if strict_raise:
                    invalid_key, reason = OpsBaseIntegrationService.is_placeholder_or_forbidden_key(val_str)
                    if invalid_key:
                        raise ValidationError(reason or "Chave pública inválida em public_vars.")
                # Always skip storing raw key overrides inside custom public_vars;
                # build_runtime_config_payload injects the authoritative discovered key at runtime.
                continue

            sanitized[key_str] = v

        return sanitized

    @staticmethod
    def validate_opsbase_url(raw_url: str) -> str:
        """
        Validates and normalizes `opsbase_url`.
        Rejects database URIs or malformed URLs and ensures `/api/v1` suffix when pointing to OpsBase root.
        """
        url = (raw_url or "").strip().rstrip("/")
        if not url:
            return settings.OPSBASE_DEFAULT_API_URL

        for pat in FORBIDDEN_SECRET_VALUE_PATTERNS:
            if pat.search(url):
                raise ValidationError(
                    "URL inválida: não é permitido informar URI de banco de dados em opsbase_url."
                )

        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValidationError(
                f"opsbase_url '{raw_url}' inválido. Informe uma URL HTTP/HTTPS válida (ex.: http://localhost:8001/api/v1)."
            )
        if parsed.username or parsed.password:
            raise ValidationError("opsbase_url não pode conter credenciais embutidas na URL.")

        # Normalize `/api/v1` path if caller passed bare root `http://localhost:8001`
        if not parsed.path or parsed.path == "/":
            url = f"{url}/api/v1"

        return url

    @staticmethod
    def compute_project_exact_origins(project: Project) -> List[str]:
        """
        Computes the exact allowed origins for an OpsPages project:
        - Standard OpsPages serving and frontend origins (`http://localhost:8005`, `http://127.0.0.1:8005`, `http://localhost:5176`)
        - Custom domain origin (`https://{custom_domain}`) if configured on the project
        - Any active exact origin rules already registered on the project
        Never includes wildcard `*`.
        """
        origins: List[str] = []

        def _add_origin(candidate: Optional[str]) -> None:
            if not candidate:
                return
            raw = candidate.strip().rstrip("/")
            if not raw or raw == "*" or "null" in raw.lower():
                return
            if not raw.startswith(("http://", "https://")):
                # Custom domain like "portal.loft.com.br" or "localhost:8080"
                scheme = "http" if raw.startswith(("localhost", "127.0.0.1")) else "https"
                raw = f"{scheme}://{raw}"
            parsed = urlparse(raw)
            if parsed.scheme in ("http", "https") and parsed.netloc:
                exact = f"{parsed.scheme}://{parsed.netloc}"
                if exact not in origins:
                    origins.append(exact)

        _add_origin(settings.OPSPAGES_PUBLIC_ORIGIN)
        _add_origin("http://127.0.0.1:8005")
        _add_origin(settings.OPSPAGES_FRONTEND_ORIGIN)
        _add_origin("http://127.0.0.1:5176")

        if project.custom_domain:
            _add_origin(project.custom_domain)

        for rule in project.cors_rules or []:
            if rule.is_active and rule.origin and rule.origin != "*":
                _add_origin(rule.origin)

        return origins

    _token_cache: Dict[str, Tuple[str, datetime]] = {}

    @staticmethod
    def _authenticate_opsbase_client(
        opsbase_base_url: str,
        explicit_token: Optional[str] = None,
    ) -> Optional[str]:
        """
        Obtains a Bearer token to call OpsBase management/discovery endpoints.
        Uses explicit_token if provided and accepted, otherwise logs in with platform admin credentials from .env.
        """
        base = opsbase_base_url.rstrip("/")
        if base.endswith("/api/v1"):
            base = base[: -len("/api/v1")]

        if explicit_token:
            return explicit_token

        cached = OpsBaseIntegrationService._token_cache.get(base)
        if cached:
            cached_tok, cached_at = cached
            if (utc_now() - cached_at).total_seconds() < 300:
                return cached_tok

        # P-22: no login at all while a previous failure's backoff window is open.
        opsbase_auth_backoff.check(base)

        def _distinct(values: List[Optional[str]], casefold: bool) -> List[str]:
            out: List[str] = []
            seen = set()
            for v in values:
                v = (v or "").strip()
                key = v.lower() if casefold else v
                if v and key not in seen:
                    seen.add(key)
                    out.append(v)
            return out

        emails = _distinct(
            [
                settings.aiops_opsbase_user,
                settings.DEFAULT_SUPERADMIN_EMAIL,
                settings.BOOTSTRAP_ADMIN_EMAIL,
                settings.DEFAULT_SUPERADMIN_USERNAME,
            ],
            casefold=True,
        )
        passwords = _distinct(
            [
                settings.aiops_opsbase_password,
                settings.DEFAULT_SUPERADMIN_PASSWORD,
                settings.BOOTSTRAP_ADMIN_PASSWORD,
                settings.aiops_app_builder_password,
            ],
            casefold=False,
        )
        if not emails or not passwords:
            return None

        # P-22: minimal attempts. Each distinct (username, password) pair at most once;
        # a 401 (or any other rejection) for a username skips that username's remaining
        # passwords; the first 429 stops the whole sequence; any failure opens the backoff.
        last_status: Optional[int] = None
        attempted = False
        with httpx.Client(timeout=5.0, trust_env=False) as client:
            for username in emails:
                stop_all = False
                for pwd in passwords:
                    try:
                        attempted = True
                        resp = client.post(
                            f"{base}/api/v1/auth/login",
                            json={"username": username, "password": pwd},
                        )
                    except Exception as exc:
                        # OpsBase unreachable: not a credential failure; stop, no backoff.
                        logger.debug(f"OpsBase auth request failed (network): {type(exc).__name__}")
                        return None
                    last_status = resp.status_code
                    if resp.status_code == 200:
                        token = None
                        try:
                            data = resp.json()
                            if isinstance(data, dict):
                                token = data.get("access_token") or (
                                    (data.get("data") or {}).get("access_token")
                                    if isinstance(data.get("data"), dict)
                                    else None
                                )
                        except Exception:
                            token = None
                        if token:
                            OpsBaseIntegrationService._token_cache[base] = (token, utc_now())
                            opsbase_auth_backoff.record_success(base)
                            return token
                        break  # 200 without token: treat as rejection for this username
                    if resp.status_code == 429:
                        stop_all = True
                    break  # 401/403/422/5xx: never try this username's other passwords
                if stop_all:
                    break

        if attempted:
            window = opsbase_auth_backoff.record_failure(base, last_status)
            logger.warning(
                "OpsBase admin login failed (HTTP %s); backing off for %ds.", last_status, int(window)
            )
            raise OpsBaseAuthBackoffError(window, f"login failed (HTTP {last_status})")
        return None

    @staticmethod
    def fetch_discovery_from_opsbase(
        project: Project,
        opsbase_project_id: Optional[int] = None,
        opsbase_project_slug: Optional[str] = None,
        opsbase_base_url: Optional[str] = None,
        opsbase_token: Optional[str] = None,
        auto_provision_if_missing: bool = True,
    ) -> Dict[str, Any]:
        """
        Calls OpsBase's discovery endpoint (`/api/v1/projects/{id}/public-config` or `/by-slug/{slug}/public-config`)
        to obtain the authoritative `anon_key` (`opsbase_anon_...`), URLs, schema name, and CORS allowlist.
        """
        base_url = (opsbase_base_url or settings.OPSBASE_BASE_URL or "http://localhost:8001").strip().rstrip("/")
        if base_url.endswith("/api/v1"):
            base_url = base_url[: -len("/api/v1")]

        target_id = opsbase_project_id or project.opsbase_project_id
        target_slug = (
            opsbase_project_slug
            or project.opsbase_project_slug
            or project.slug
        ).strip().lower()
        slug_candidates = []
        for s in (target_slug, target_slug.replace("-", "_"), project.slug, project.slug.replace("-", "_")):
            if s and s not in slug_candidates:
                slug_candidates.append(s)

        token = OpsBaseIntegrationService._authenticate_opsbase_client(base_url, opsbase_token)
        headers: Dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        discovery_data: Optional[Dict[str, Any]] = None
        last_status: Optional[int] = None
        last_error: Optional[str] = None

        try:
            with httpx.Client(timeout=8.0, trust_env=False) as client:
                # 1. If caller explicitly passed opsbase_project_id, try it first
                if opsbase_project_id is not None:
                    resp = client.get(
                        f"{base_url}/api/v1/projects/{opsbase_project_id}/public-config",
                        headers=headers,
                    )
                    last_status = resp.status_code
                    if resp.status_code == 200:
                        discovery_data = resp.json()
                    elif resp.status_code != 404:
                        last_error = resp.text

                # 2. Try by slug candidates via /by-slug/{slug}/public-config
                if not discovery_data:
                    for slug_cand in slug_candidates:
                        resp = client.get(
                            f"{base_url}/api/v1/projects/by-slug/{slug_cand}/public-config",
                            headers=headers,
                        )
                        last_status = resp.status_code
                        if resp.status_code == 200:
                            discovery_data = resp.json()
                            break

                # 3. Try stored project.opsbase_project_id if not tried yet
                if not discovery_data and project.opsbase_project_id and project.opsbase_project_id != opsbase_project_id:
                    resp = client.get(
                        f"{base_url}/api/v1/projects/{project.opsbase_project_id}/public-config",
                        headers=headers,
                    )
                    last_status = resp.status_code
                    if resp.status_code == 200:
                        discovery_data = resp.json()

                # 3. If project doesn't exist yet in OpsBase and auto_provision_if_missing is True, create it in OpsBase
                if not discovery_data and auto_provision_if_missing and token:
                    provision_slug = target_slug.replace("-", "_")
                    create_resp = client.post(
                        f"{base_url}/api/v1/projects",
                        headers=headers,
                        json={
                            "name": project.name,
                            "slug": provision_slug,
                            "description": f"Projeto vinculado automaticamente ao AIOps OpsPages ({project.slug})",
                        },
                    )
                    if create_resp.status_code in (200, 201):
                        created_proj = create_resp.json()
                        if isinstance(created_proj.get("public_config"), dict):
                            discovery_data = created_proj["public_config"]
                        else:
                            created_id = (
                                (created_proj.get("project") or {}).get("id")
                                or created_proj.get("id")
                            )
                            if created_id:
                                disc_resp = client.get(
                                    f"{base_url}/api/v1/projects/{created_id}/public-config",
                                    headers=headers,
                                )
                                if disc_resp.status_code == 200:
                                    discovery_data = disc_resp.json()
                    else:
                        logger.warning(
                            f"OpsBase auto-provision POST /api/v1/projects for '{provision_slug}' returned {create_resp.status_code}: {create_resp.text[:200]}"
                        )
                        # Fallback: check existing projects in OpsBase via GET /api/v1/projects
                        list_resp = client.get(f"{base_url}/api/v1/projects", headers=headers)
                        if list_resp.status_code == 200:
                            proj_list = list_resp.json()
                            if isinstance(proj_list, list) and proj_list:
                                matched_proj = None
                                for p_item in proj_list:
                                    p_slug = str(p_item.get("slug") or "").lower()
                                    if p_slug in slug_candidates or target_slug in p_slug or p_slug in target_slug:
                                        matched_proj = p_item
                                        break
                                if not matched_proj:
                                    matched_proj = proj_list[0]
                                matched_id = matched_proj.get("id")
                                if matched_id:
                                    disc_resp = client.get(
                                        f"{base_url}/api/v1/projects/{matched_id}/public-config",
                                        headers=headers,
                                    )
                                    if disc_resp.status_code == 200:
                                        discovery_data = disc_resp.json()
        except Exception as exc:
            last_error = str(exc)
            logger.warning(f"HTTP discovery call to OpsBase ({base_url}) failed: {exc}")

        if not discovery_data:
            if last_status == 404:
                raise NotFoundError(
                    f"Projeto '{target_slug}' (ID={target_id}) não encontrado no OpsBase ({base_url}). "
                    "Verifique se o projeto existe no OpsBase antes de vincular."
                )
            raise ValidationError(
                f"Não foi possível obter a configuração pública do OpsBase em '{base_url}/api/v1'. "
                f"Detalhe: {last_error or f'HTTP {last_status}'}"
            )

        # Validate discovered key strictly (unless key is currently revoked in OpsBase)
        key_status = str(discovery_data.get("key_status") or "active").lower()
        anon_key = (discovery_data.get("anon_key") or discovery_data.get("public_key") or "").strip()
        key_type = str(discovery_data.get("key_type") or "anon").lower()

        if key_type != "anon":
            raise ValidationError(
                f"OpsBase retornou key_type='{key_type}'. O OpsPages aceita exclusivamente chaves 'anon' com RLS ativo."
            )

        if key_status == "active":
            if not anon_key:
                raise ValidationError(
                    "OpsBase retornou key_status='active' mas sem 'anon_key' disponível no endpoint de descoberta."
                )
            is_bad, reason = OpsBaseIntegrationService.is_placeholder_or_forbidden_key(anon_key)
            if is_bad:
                raise ValidationError(
                    reason or "Chave retornada pelo endpoint de descoberta do OpsBase é inválida."
                )
        else:
            # Key is revoked in OpsBase
            anon_key = ""

        discovery_data["anon_key"] = anon_key
        discovery_data["public_key"] = anon_key
        discovery_data["key_status"] = key_status
        return discovery_data

    @staticmethod
    def sync_project_cors_with_opsbase(
        db: Session,
        project: Project,
        opsbase_base_url: Optional[str] = None,
        opsbase_token: Optional[str] = None,
        extra_origins: Optional[List[str]] = None,
        replace_existing: bool = False,
    ) -> Dict[str, Any]:
        """
        Aligns exact CORS origins between OpsPages (`CorsRule`) and OpsBase
        (`POST /api/v1/projects/{opsbase_project_id}/cors/pages-sync`).
        Never registers wildcard `*` with credentials.
        """
        exact_origins = OpsBaseIntegrationService.compute_project_exact_origins(project)
        rejected_origins: List[str] = []
        requested_extra_origins = [o for o in (extra_origins or []) if (o or "").strip()]
        accepted_extra_origins: List[str] = []
        if extra_origins:
            for orig in extra_origins:
                clean = (orig or "").strip().rstrip("/")
                if not clean:
                    continue
                if clean == "*" or not clean.startswith(("http://", "https://")):
                    rejected_origins.append(orig)
                    continue
                accepted_extra_origins.append(clean)
                if clean not in exact_origins:
                    exact_origins.append(clean)

        # If the caller explicitly asked to register extra origins and every single one
        # was rejected, the base project origins syncing fine must not be reported as a
        # blanket "synced: true" — that reads as the caller's request having succeeded
        # when nothing it asked for was actually honored (Item P-16).
        if requested_extra_origins and not accepted_extra_origins:
            raise ValidationError(
                "None of the requested extra_origins could be registered "
                f"(rejected: {rejected_origins}). Origins must be exact http(s):// URLs; "
                "wildcard '*' is never accepted.",
                field="extra_origins",
                details={"rejected_origins": rejected_origins},
                status_code=422,
            )

        # 1. Ensure OpsPages local CorsRule table has exact origins and no active wildcard '*'
        existing_rules = db.query(CorsRule).filter(CorsRule.project_id == project.id).all()
        existing_by_origin = {r.origin.rstrip("/"): r for r in existing_rules}

        for r in existing_rules:
            if r.origin.strip() == "*":
                r.is_active = False
                r.allow_credentials = False

        for origin in exact_origins:
            rule = existing_by_origin.get(origin)
            if not rule:
                db.add(
                    CorsRule(
                        project_id=project.id,
                        origin=origin,
                        allowed_methods="GET,HEAD,OPTIONS",
                        allowed_headers="Authorization,Content-Type,Accept,Origin,X-Requested-With,X-API-Key,apikey",
                        allow_credentials=True,
                        max_age_seconds=3600,
                        cache_control=project.asset_cache_control or "public, max-age=3600",
                        is_active=True,
                    )
                )
            else:
                rule.is_active = True

        # 2. Register exact origins in OpsBase via POST /api/v1/projects/{id}/cors/pages-sync
        base_url = (opsbase_base_url or settings.OPSBASE_BASE_URL or "http://localhost:8001").strip().rstrip("/")
        if base_url.endswith("/api/v1"):
            base_url = base_url[: -len("/api/v1")]

        opsbase_synced = False
        opsbase_allowed_origins: List[str] = list(exact_origins)
        sync_error: Optional[str] = None

        if project.opsbase_project_id:
            try:
                token = OpsBaseIntegrationService._authenticate_opsbase_client(base_url, opsbase_token)
                headers = {"Authorization": f"Bearer {token}"} if token else {}
                with httpx.Client(timeout=8.0, trust_env=False) as client:
                    resp = client.post(
                        f"{base_url}/api/v1/projects/{project.opsbase_project_id}/cors/pages-sync",
                        headers=headers,
                        json={
                            "origins": exact_origins,
                            "replace_existing": replace_existing,
                        },
                    )
                    if resp.status_code == 200:
                        # OpsBase's /cors/pages-sync returns a JSON array of CorsRule objects
                        # (response_model=List[CorsRuleResponse]), not an object with an
                        # "allowed_origins" key — extract the origin from each item.
                        body = resp.json()
                        if isinstance(body, list):
                            opsbase_allowed_origins = [
                                rule.get("origin") for rule in body if isinstance(rule, dict) and rule.get("origin")
                            ] or exact_origins
                        else:
                            opsbase_allowed_origins = exact_origins
                        opsbase_synced = True
                        declined_by_opsbase = [
                            o for o in exact_origins if o not in opsbase_allowed_origins
                        ]
                        if declined_by_opsbase:
                            rejected_origins.extend(declined_by_opsbase)
                            opsbase_synced = False
                            sync_error = (
                                "OpsBase declined to register: " + ", ".join(declined_by_opsbase)
                            )
                    else:
                        sync_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
            except OpsBaseAuthBackoffError as exc:
                sync_error = exc.message  # P-22: no request sent to OpsBase; already logged once per window
            except Exception as exc:
                sync_error = str(exc)
                logger.warning(f"Failed to sync CORS with OpsBase for project {project.slug}: {exc}")

        project.opsbase_cors_synced = opsbase_synced
        project.set_opsbase_allowed_origins(opsbase_allowed_origins)
        db.flush()

        manual_curl = (
            f"curl -X POST '{base_url}/api/v1/projects/{project.opsbase_project_id or '<OPSBASE_PROJECT_ID>'}/cors/pages-sync' "
            f"-H 'Authorization: Bearer <OPSBASE_TOKEN>' -H 'Content-Type: application/json' "
            f"-d '{json.dumps({'origins': exact_origins, 'replace_existing': False})}'"
        )

        return {
            "synced": opsbase_synced,
            "opsbase_project_id": project.opsbase_project_id,
            "opsbase_project_slug": project.opsbase_project_slug,
            "pages_exact_origins": exact_origins,
            "opsbase_allowed_origins": opsbase_allowed_origins,
            "rejected_origins": rejected_origins,
            "custom_domain": project.custom_domain,
            "error": sync_error,
            "manual_registration_guide": {
                "endpoint": f"{base_url}/api/v1/projects/{project.opsbase_project_id or '{id}'}/cors/pages-sync",
                "method": "POST",
                "exact_origins": exact_origins,
                "curl_example": manual_curl,
                "note": (
                    "O OpsPages sincroniza automaticamente a allowlist de CORS de origem exata no OpsBase "
                    "ao vincular o projeto ou atualizar o custom_domain."
                ),
            },
        }

    @staticmethod
    def link_or_sync_project(
        db: Session,
        project: Project,
        opsbase_project_id: Optional[int] = None,
        opsbase_project_slug: Optional[str] = None,
        opsbase_base_url: Optional[str] = None,
        environment_urls: Optional[Dict[str, str]] = None,
        opsbase_token: Optional[str] = None,
        actor_id: Optional[int] = None,
        actor_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        auto_provision_if_missing: bool = True,
        sync_cors: bool = True,
    ) -> Dict[str, Any]:
        """
        Links an OpsPages project to an OpsBase project and synchronizes the public runtime
        configuration across all 4 environments (`production`, `staging`, `development`, `preview`)
        using OpsBase's discovery endpoint (`/api/v1/projects/{id}/public-config`).
        Never accepts manually typed keys or placeholders.
        """
        discovery = OpsBaseIntegrationService.fetch_discovery_from_opsbase(
            project=project,
            opsbase_project_id=opsbase_project_id,
            opsbase_project_slug=opsbase_project_slug,
            opsbase_base_url=opsbase_base_url,
            opsbase_token=opsbase_token,
            auto_provision_if_missing=auto_provision_if_missing,
        )

        discovered_id = int(discovery["project_id"])
        discovered_slug = str(discovery.get("slug") or project.slug)
        discovered_schema = str(discovery.get("schema_name") or f"proj_{discovered_slug}")
        discovered_api_url = OpsBaseIntegrationService.validate_opsbase_url(
            discovery.get("api_base_url") or settings.OPSBASE_DEFAULT_API_URL
        )
        discovered_key = str(discovery.get("anon_key") or "")
        discovered_key_prefix = discovery.get("key_prefix") or (discovered_key[:21] if discovered_key else None)
        discovered_key_status = str(discovery.get("key_status") or ("active" if discovered_key else "revoked"))

        now = utc_now()
        if not project.opsbase_linked_at or project.opsbase_project_id != discovered_id:
            project.opsbase_linked_at = now
        project.opsbase_project_id = discovered_id
        project.opsbase_project_slug = discovered_slug
        project.opsbase_schema_name = discovered_schema
        project.opsbase_last_synced_at = now
        project.opsbase_key_status = discovered_key_status
        project.opsbase_key_prefix = discovered_key_prefix

        env_url_overrides: Dict[str, str] = {}
        if environment_urls:
            for env_k, env_v in environment_urls.items():
                valid_env = OpsBaseIntegrationService.validate_environment_name(env_k)
                env_url_overrides[valid_env] = OpsBaseIntegrationService.validate_opsbase_url(env_v)

        existing_configs = (
            db.query(ProjectPublicConfig)
            .filter(ProjectPublicConfig.project_id == project.id)
            .all()
        )
        cfg_by_env = {c.environment: c for c in existing_configs}

        updated_configs: List[ProjectPublicConfig] = []
        for env_name in VALID_PUBLIC_CONFIG_ENVIRONMENTS:
            cfg = cfg_by_env.get(env_name)
            # Determine URL for this environment:
            # 1. Explicit override passed in environment_urls
            # 2. Existing custom DNS URL on cfg (if not legacy localhost:8000 or empty)
            # 3. Discovered OpsBase api_base_url (http://localhost:8001/api/v1)
            if env_name in env_url_overrides:
                target_api_url = env_url_overrides[env_name]
            elif (
                cfg
                and cfg.opsbase_url
                and not cfg.opsbase_url.startswith("http://localhost:8000")
                and not cfg.opsbase_url.startswith("http://127.0.0.1:8000")
            ):
                target_api_url = OpsBaseIntegrationService.validate_opsbase_url(cfg.opsbase_url)
            else:
                target_api_url = discovered_api_url

            data_plane_url = f"{target_api_url.rstrip('/')}/projects/{discovered_id}"
            auth_url = f"{data_plane_url}/auth"

            if not cfg:
                cfg = ProjectPublicConfig(
                    project_id=project.id,
                    environment=env_name,
                    opsbase_url=target_api_url,
                    opsbase_public_key=discovered_key,
                    opsbase_project_id=discovered_id,
                    opsbase_project_slug=discovered_slug,
                    opsbase_schema_name=discovered_schema,
                    opsbase_key_prefix=discovered_key_prefix,
                    opsbase_key_status=discovered_key_status,
                    opsbase_data_plane_url=data_plane_url,
                    opsbase_auth_url=auth_url,
                    key_source="opsbase_discovery",
                    last_synced_at=now,
                    scopes="public:read,data:query,auth:session,crud:items",
                    inject_in_html=True,
                    is_active=True,
                    updated_by_email=actor_email,
                )
                db.add(cfg)
            else:
                cfg.opsbase_url = target_api_url
                cfg.opsbase_public_key = discovered_key
                cfg.opsbase_project_id = discovered_id
                cfg.opsbase_project_slug = discovered_slug
                cfg.opsbase_schema_name = discovered_schema
                cfg.opsbase_key_prefix = discovered_key_prefix
                cfg.opsbase_key_status = discovered_key_status
                cfg.opsbase_data_plane_url = data_plane_url
                cfg.opsbase_auth_url = auth_url
                cfg.key_source = "opsbase_discovery"
                cfg.last_synced_at = now
                cfg.is_active = True
                if actor_email:
                    cfg.updated_by_email = actor_email

            # Clean and update public_vars without storing secret keys or legacy placeholders
            clean_custom_vars = OpsBaseIntegrationService.validate_and_sanitize_public_vars(
                cfg.get_public_vars(), strict_raise=False
            )
            # Remove any stale auto-generated keys from public_vars JSON; runtime builder populates them dynamically
            for auto_k in (
                "OPSBASE_URL",
                "OPSBASE_API_URL",
                "OPSBASE_PUBLIC_KEY",
                "OPSBASE_ANON_KEY",
                "OPSBASE_PROJECT",
                "OPSBASE_PROJECT_ID",
                "OPSBASE_DATA_PLANE_URL",
                "OPSBASE_AUTH_URL",
                "OPSPAGES_BASE_URL",
                "ENVIRONMENT",
            ):
                clean_custom_vars.pop(auto_k, None)
            cfg.set_public_vars(clean_custom_vars)
            updated_configs.append(cfg)

        cors_result = None
        if sync_cors:
            cors_result = OpsBaseIntegrationService.sync_project_cors_with_opsbase(
                db=db,
                project=project,
                opsbase_base_url=opsbase_base_url,
                opsbase_token=opsbase_token,
            )

        AuditService.log(
            db,
            action="OPSBASE_PROJECT_SYNC",
            resource_type="project_public_config",
            resource_id=project.slug,
            project_id=project.id,
            actor_id=actor_id,
            actor_email=actor_email or "system@opsbase-sync",
            ip_address=ip_address,
            diff={
                "opsbase_project_id": discovered_id,
                "opsbase_project_slug": discovered_slug,
                "opsbase_url": discovered_api_url,
                "key_prefix": discovered_key_prefix,
                "key_status": discovered_key_status,
                "environments_synced": list(VALID_PUBLIC_CONFIG_ENVIRONMENTS),
                "cors_synced": cors_result.get("synced") if cors_result else False,
            },
        )
        db.commit()
        db.refresh(project)

        return {
            "linked": bool(discovered_id),
            "project_id": project.id,
            "project_slug": project.slug,
            "opsbase_project_id": discovered_id,
            "opsbase_project_slug": discovered_slug,
            "opsbase_schema_name": discovered_schema,
            "opsbase_url": discovered_api_url,
            "key_prefix": discovered_key_prefix,
            "opsbase_key_prefix": discovered_key_prefix,
            "key_type": "anon",
            "key_status": discovered_key_status,
            "opsbase_key_status": discovered_key_status,
            "key_source": "opsbase_discovery",
            "linked_at": project.opsbase_linked_at,
            "last_synced_at": project.opsbase_last_synced_at,
            "redeploy_required": False,
            "environments": [c.environment for c in updated_configs],
            "cors_alignment": cors_result,
        }

    @staticmethod
    def handle_opsbase_webhook(
        db: Session,
        payload: Dict[str, Any],
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Processes key rotation (`ROTATE_API_KEY`, `key.rotated`, `rotate`) and revocation
        (`REVOKE_API_KEY`, `key.revoked`, `revoke`) notifications from OpsBase without redeploying sites.
        """
        event = str(payload.get("event") or payload.get("action") or "sync").strip().lower()
        opsbase_project_id = payload.get("opsbase_project_id") or payload.get("project_id")
        opsbase_slug = (
            payload.get("opsbase_project_slug")
            or payload.get("project_slug")
            or payload.get("slug")
            or ""
        ).strip().lower()

        query = db.query(Project)
        matched_projects: List[Project] = []

        if opsbase_project_id is not None:
            try:
                pid = int(opsbase_project_id)
                matched_projects = query.filter(Project.opsbase_project_id == pid).all()
            except (ValueError, TypeError):
                pass

        if not matched_projects and opsbase_slug:
            slug_variants = {opsbase_slug, opsbase_slug.replace("_", "-"), opsbase_slug.replace("-", "_")}
            matched_projects = query.filter(
                (Project.opsbase_project_slug.in_(slug_variants))
                | (Project.slug.in_(slug_variants))
            ).all()

        if not matched_projects:
            raise NotFoundError(
                f"Nenhum projeto do OpsPages vinculado encontrado para opsbase_project_id={opsbase_project_id} / slug='{opsbase_slug}'."
            )

        is_revoke_event = any(tok in event for tok in ("revoke", "revoked", "disable", "delete"))
        results: List[Dict[str, Any]] = []
        now = utc_now()

        for proj in matched_projects:
            if is_revoke_event:
                # Never trust the payload alone for a destructive action: re-confirm the
                # revocation against OpsBase's own discovery endpoint before clearing the
                # key. A forged event that disagrees with OpsBase's authoritative state
                # (or that we can't confirm at all) is ignored (P-14).
                try:
                    live_discovery = OpsBaseIntegrationService.fetch_discovery_from_opsbase(
                        project=proj,
                        opsbase_project_id=proj.opsbase_project_id,
                        opsbase_project_slug=proj.opsbase_project_slug or proj.slug,
                        auto_provision_if_missing=False,
                    )
                    live_key_status = str(live_discovery.get("key_status") or "active").lower()
                except Exception as exc:
                    logger.warning(
                        f"OpsBase webhook revoke for project {proj.slug}: could not confirm "
                        f"live key_status via discovery, ignoring revoke event: {exc}"
                    )
                    results.append(
                        {
                            "project_id": proj.id,
                            "project_slug": proj.slug,
                            "opsbase_project_id": proj.opsbase_project_id,
                            "event": event,
                            "key_status": proj.opsbase_key_status,
                            "key_cleared": False,
                            "redeploy_required": False,
                            "ignored_reason": "could_not_confirm_via_discovery",
                        }
                    )
                    continue

                if live_key_status == "active":
                    logger.warning(
                        f"OpsBase webhook revoke for project {proj.slug}: OpsBase discovery "
                        "still reports key_status=active, ignoring unconfirmed revoke event."
                    )
                    results.append(
                        {
                            "project_id": proj.id,
                            "project_slug": proj.slug,
                            "opsbase_project_id": proj.opsbase_project_id,
                            "event": event,
                            "key_status": proj.opsbase_key_status,
                            "key_cleared": False,
                            "redeploy_required": False,
                            "ignored_reason": "opsbase_reports_key_still_active",
                        }
                    )
                    continue

                proj.opsbase_key_status = "revoked"
                proj.opsbase_last_synced_at = now
                configs = (
                    db.query(ProjectPublicConfig)
                    .filter(ProjectPublicConfig.project_id == proj.id)
                    .all()
                )
                for cfg in configs:
                    cfg.opsbase_public_key = ""
                    cfg.opsbase_key_status = "revoked"
                    cfg.last_synced_at = now
                    cfg.updated_by_email = "webhook@opsbase"
                    clean_vars = OpsBaseIntegrationService.validate_and_sanitize_public_vars(
                        cfg.get_public_vars(), strict_raise=False
                    )
                    cfg.set_public_vars(clean_vars)

                AuditService.log(
                    db,
                    action="OPSBASE_WEBHOOK_KEY_REVOKED",
                    resource_type="project_public_config",
                    resource_id=proj.slug,
                    project_id=proj.id,
                    actor_email="webhook@opsbase",
                    ip_address=ip_address,
                    diff={
                        "event": event,
                        "opsbase_project_id": proj.opsbase_project_id,
                        "key_status": "revoked",
                        "redeploy_required": False,
                    },
                )
                db.commit()
                results.append(
                    {
                        "project_id": proj.id,
                        "project_slug": proj.slug,
                        "opsbase_project_id": proj.opsbase_project_id,
                        "event": event,
                        "key_status": "revoked",
                        "key_cleared": True,
                        "redeploy_required": False,
                    }
                )
            else:
                pushed_raw_key = payload.get("anon_key") or payload.get("public_key")
                pushed_valid_key: Optional[str] = None
                if pushed_raw_key:
                    clean_candidate = str(pushed_raw_key).strip()
                    is_bad, bad_reason = OpsBaseIntegrationService.is_placeholder_or_forbidden_key(clean_candidate)
                    if is_bad:
                        raise ValidationError(bad_reason or "Chave anon inválida no payload de webhook.")
                    pushed_valid_key = clean_candidate

                try:
                    # Rotation or general sync: pull authoritative new key from OpsBase discovery
                    sync_info = OpsBaseIntegrationService.link_or_sync_project(
                        db=db,
                        project=proj,
                        opsbase_project_id=proj.opsbase_project_id,
                        opsbase_project_slug=proj.opsbase_project_slug or proj.slug,
                        actor_email="webhook@opsbase",
                        ip_address=ip_address,
                        auto_provision_if_missing=False,
                        sync_cors=False,
                    )
                except Exception as exc:
                    if not pushed_valid_key:
                        raise exc
                    sync_info = {
                        "opsbase_project_id": proj.opsbase_project_id,
                        "key_status": "active",
                        "key_prefix": pushed_valid_key[:20],
                    }

                if pushed_valid_key:
                    proj.opsbase_key_prefix = pushed_valid_key[:20]
                    proj.opsbase_key_status = "active"
                    proj.opsbase_last_synced_at = now
                    configs = (
                        db.query(ProjectPublicConfig)
                        .filter(ProjectPublicConfig.project_id == proj.id)
                        .all()
                    )
                    for cfg in configs:
                        cfg.opsbase_public_key = pushed_valid_key
                        cfg.opsbase_key_prefix = pushed_valid_key[:20]
                        cfg.opsbase_key_status = "active"
                        cfg.last_synced_at = now
                        cfg.updated_by_email = "webhook@opsbase"
                    db.commit()
                    sync_info["key_prefix"] = pushed_valid_key[:20]
                    sync_info["key_status"] = "active"

                results.append(
                    {
                        "project_id": proj.id,
                        "project_slug": proj.slug,
                        "opsbase_project_id": sync_info["opsbase_project_id"],
                        "event": event,
                        "key_status": sync_info["key_status"],
                        "key_prefix": sync_info["key_prefix"],
                        "redeploy_required": False,
                    }
                )

        return {
            "status": "processed",
            "event": event,
            "redeploy_required": False,
            "projects_updated": len(results),
            "results": results,
        }

    @staticmethod
    def delete_opsbase_project(
        project: Project,
        opsbase_base_url: Optional[str] = None,
        opsbase_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Deletes the OpsBase project linked to this Pages project. Only ever called when
        `project.opsbase_auto_provisioned` is true (i.e. OpsPages itself created that
        OpsBase project with no opt-in from the caller) — never for a project the caller
        explicitly linked to a pre-existing OpsBase project, which must never be deleted
        as a side effect of deleting the Pages project (P-15).
        """
        if not project.opsbase_project_id:
            return {"deleted": False, "reason": "no_linked_opsbase_project"}

        base_url = (opsbase_base_url or settings.OPSBASE_BASE_URL or "http://localhost:8001").strip().rstrip("/")
        if base_url.endswith("/api/v1"):
            base_url = base_url[: -len("/api/v1")]

        try:
            token = OpsBaseIntegrationService._authenticate_opsbase_client(base_url, opsbase_token)
        except OpsBaseAuthBackoffError as exc:
            return {"deleted": False, "opsbase_project_id": project.opsbase_project_id, "error": exc.message}
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        try:
            with httpx.Client(timeout=8.0, trust_env=False) as client:
                resp = client.delete(
                    f"{base_url}/api/v1/projects/{project.opsbase_project_id}",
                    headers=headers,
                )
            if resp.status_code in (200, 204, 404):
                return {"deleted": True, "opsbase_project_id": project.opsbase_project_id}
            return {
                "deleted": False,
                "opsbase_project_id": project.opsbase_project_id,
                "error": f"HTTP {resp.status_code}: {resp.text[:200]}",
            }
        except Exception as exc:
            logger.warning(
                f"Failed to delete auto-provisioned OpsBase project {project.opsbase_project_id} "
                f"for Pages project {project.slug}: {exc}"
            )
            return {"deleted": False, "opsbase_project_id": project.opsbase_project_id, "error": str(exc)}
