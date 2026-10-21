"""
Offline tests for Item P-22 (OpsBase admin-login backoff), round 5.

Never touches a real OpsBase: sockets are blocked, every non-TestClient HTTP request goes to an
in-memory fake, credentials are synthetic (uitest_*), OPSBASE_BASE_URL points to a .invalid host,
and no .env is read by these tests.
"""
from __future__ import annotations

import os
import socket
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import pytest

TEST_DIR = Path(tempfile.mkdtemp(prefix="opspages_p22_"))
os.environ.setdefault("OPSPAGES_META_DB_URL", f"sqlite:///{TEST_DIR / 'p22.db'}")
os.environ.setdefault("REPOS_STORAGE_DIR", str(TEST_DIR / "repos"))

from app.core.config import settings  # noqa: E402

settings.OPSPAGES_META_DB_URL = os.environ["OPSPAGES_META_DB_URL"]
settings.REPOS_STORAGE_DIR = os.environ["REPOS_STORAGE_DIR"]

import app.services.opsbase_service as obs  # noqa: E402
from app.services.opsbase_service import (  # noqa: E402
    OpsBaseAuthBackoffError,
    OpsBaseIntegrationService,
    opsbase_auth_backoff,
    opsbase_backoff_key,
)

FAKE_BASE = "http://opsbase.invalid:8001"
GOOD_KEY = "opsbase_anon_" + "a1b2c3d4" * 4
_ORIGINAL_SEND = httpx.Client.send


class FakeOpsBase:
    """Records every outbound request; answers /auth/login with a scripted status."""

    def __init__(self) -> None:
        self.login_status = 401
        self.requests: list[tuple[str, str]] = []
        self.logins: list[tuple[str, str]] = []

    def send(self, client, request, *args, **kwargs):
        if request.url.host == "testserver":
            return _ORIGINAL_SEND(client, request, *args, **kwargs)
        self.requests.append((request.method, request.url.path))
        if request.url.path.endswith("/auth/login"):
            import json as _json

            body = _json.loads(request.content or b"{}")
            self.logins.append((body.get("username"), body.get("password")))
            if self.login_status == 200:
                return httpx.Response(200, json={"access_token": "uitest_fake_token", "expires_in": 900}, request=request)
            return httpx.Response(self.login_status, json={"error": "simulated"}, request=request)
        return httpx.Response(401, json={"error": "simulated"}, request=request)


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    def _deny(*a, **k):
        raise OSError("network disabled in P-22 offline tests")

    monkeypatch.setattr(socket.socket, "connect", _deny)
    monkeypatch.setattr(socket, "create_connection", _deny)
    fake = FakeOpsBase()
    monkeypatch.setattr(httpx.Client, "send", lambda self, req, *a, **k: fake.send(self, req, *a, **k))
    clock = {"now": 1000.0}
    monkeypatch.setattr(obs, "_monotonic", lambda: clock["now"])
    monkeypatch.setattr(settings, "OPSBASE_BASE_URL", FAKE_BASE)
    monkeypatch.setattr(settings, "aiops_opsbase_user", "uitest_p22_admin")
    monkeypatch.setattr(settings, "aiops_opsbase_password", "uitest_pw_one_123")
    monkeypatch.setattr(settings, "DEFAULT_SUPERADMIN_EMAIL", "UITEST_P22_ADMIN")  # same user, other case
    monkeypatch.setattr(settings, "DEFAULT_SUPERADMIN_PASSWORD", "uitest_pw_two_456")
    monkeypatch.setattr(settings, "BOOTSTRAP_ADMIN_EMAIL", "uitest_p22_other")
    monkeypatch.setattr(settings, "BOOTSTRAP_ADMIN_PASSWORD", "uitest_pw_one_123")  # duplicate password
    monkeypatch.setattr(settings, "DEFAULT_SUPERADMIN_USERNAME", "uitest_p22_admin")  # duplicate user
    monkeypatch.setattr(settings, "aiops_app_builder_password", "")
    opsbase_auth_backoff.reset_all()
    OpsBaseIntegrationService._token_cache.clear()
    yield fake, clock
    opsbase_auth_backoff.reset_all()
    OpsBaseIntegrationService._token_cache.clear()


def _auth():
    return OpsBaseIntegrationService._authenticate_opsbase_client(FAKE_BASE)


def test_429_single_attempt_then_backoff_with_zero_attempts(offline):
    fake, clock = offline
    fake.login_status = 429
    with pytest.raises(OpsBaseAuthBackoffError):
        _auth()
    assert len(fake.logins) == 1, fake.logins
    for _ in range(5):
        clock["now"] += 5
        with pytest.raises(OpsBaseAuthBackoffError) as exc:
            _auth()
        assert exc.value.code == "OPSBASE_AUTH_BACKOFF"
    assert len(fake.logins) == 1
    assert len(fake.requests) == 1


def test_401_skips_same_user_other_passwords_and_dedupes(offline):
    fake, _ = offline
    fake.login_status = 401
    with pytest.raises(OpsBaseAuthBackoffError):
        _auth()
    # distinct users (case-insensitive): uitest_p22_admin, uitest_p22_other; first password only per user
    assert fake.logins == [
        ("uitest_p22_admin", "uitest_pw_one_123"),
        ("uitest_p22_other", "uitest_pw_one_123"),
    ]
    assert len(set(fake.logins)) == len(fake.logins)


def test_public_config_serves_last_good_value_with_zero_logins_during_backoff(offline):
    fake, clock = offline
    from app.db.session import SessionLocal, engine, init_meta_db
    from app.models.meta_models import Project, ProjectPublicConfig
    from app.services.project_service import ProjectService
    from app.services.opsbase_service import VALID_PUBLIC_CONFIG_ENVIRONMENTS

    # When collected after test_opspages.py, that module removes its temp DB dir on teardown;
    # recreate the directory and reopen the engine so this test always has a writable sqlite DB.
    db_url = str(engine.url)
    if db_url.startswith("sqlite:///"):
        Path(db_url[len("sqlite:///"):]).parent.mkdir(parents=True, exist_ok=True)
    engine.dispose()
    init_meta_db()
    db = SessionLocal()
    try:
        slug = f"uitest-p22-{int(datetime.now().timestamp())}"
        project = Project(name="uitest p22", slug=slug, opsbase_project_id=2, opsbase_project_slug="uitest_p22")
        db.add(project)
        db.flush()
        stale = datetime.now(timezone.utc) - timedelta(hours=1)
        for env in VALID_PUBLIC_CONFIG_ENVIRONMENTS:
            db.add(
                ProjectPublicConfig(
                    project_id=project.id,
                    environment=env,
                    opsbase_url=f"{FAKE_BASE}/api/v1",
                    opsbase_public_key=GOOD_KEY,
                    opsbase_project_id=2,
                    opsbase_project_slug="uitest_p22",
                    last_synced_at=stale,
                )
            )
        db.commit()
        db.refresh(project)

        fake.login_status = 401
        payloads = [ProjectService.build_runtime_config_payload(db, project, "production") for _ in range(10)]
        # first request: one failed login round (<= distinct users), then backoff; the rest: 0 logins
        assert 1 <= len(fake.logins) <= 2, fake.logins
        logins_after_first = len(fake.logins)
        requests_after_first = len(fake.requests)
        for p in payloads:
            assert p["opsbase"]["public_key"] == GOOD_KEY
        more = [ProjectService.build_runtime_config_payload(db, project, env) for env in VALID_PUBLIC_CONFIG_ENVIRONMENTS * 5]
        assert all(p["opsbase"]["public_key"] == GOOD_KEY for p in more)
        assert len(fake.logins) == logins_after_first
        assert len(fake.requests) == requests_after_first
        assert opsbase_auth_backoff.remaining(opsbase_backoff_key()) > 0
    finally:
        db.close()


def test_after_backoff_expiry_single_attempt_and_success_resets(offline):
    fake, clock = offline
    fake.login_status = 429
    with pytest.raises(OpsBaseAuthBackoffError):
        _auth()
    assert opsbase_auth_backoff.remaining(FAKE_BASE) == pytest.approx(30)
    clock["now"] += 31
    fake.login_status = 200
    token = _auth()
    assert token == "uitest_fake_token"
    assert len(fake.logins) == 2  # exactly one new attempt after expiry
    assert opsbase_auth_backoff.remaining(FAKE_BASE) == 0
    # success reset the failure counter: next failure starts again at 30 s
    OpsBaseIntegrationService._token_cache.clear()
    fake.login_status = 429
    with pytest.raises(OpsBaseAuthBackoffError):
        _auth()
    assert opsbase_auth_backoff.remaining(FAKE_BASE) == pytest.approx(30)


def test_backoff_doubles_up_to_five_minutes(offline):
    fake, clock = offline
    fake.login_status = 429
    windows = []
    for _ in range(7):
        with pytest.raises(OpsBaseAuthBackoffError):
            _auth()
        w = opsbase_auth_backoff.remaining(FAKE_BASE)
        windows.append(round(w))
        clock["now"] += w + 0.5
    assert windows == [30, 60, 120, 240, 300, 300, 300]
    assert len(fake.logins) == 7  # one attempt per expired window


def test_cors_sync_during_backoff_sends_nothing_to_opsbase(offline):
    fake, _ = offline
    fake.login_status = 429
    with pytest.raises(OpsBaseAuthBackoffError):
        _auth()
    n = len(fake.requests)

    class _P:  # minimal stand-in; sync only reads these attributes before the auth step
        id = 999999
        slug = "uitest-p22-cors"
        opsbase_project_id = 2
        opsbase_project_slug = "uitest_p22"
        custom_domain = None
        cors_rules = []
        asset_cache_control = None
        opsbase_cors_synced = False

        def set_opsbase_allowed_origins(self, _):
            pass

    class _Q:
        def filter(self, *a, **k):
            return self

        def all(self):
            return []

    class _DB:
        def query(self, *a, **k):
            return _Q()

        def add(self, *a, **k):
            pass

        def flush(self):
            pass

    res = OpsBaseIntegrationService.sync_project_cors_with_opsbase(_DB(), _P(), opsbase_base_url=FAKE_BASE)
    assert res["synced"] is False
    assert len(fake.requests) == n
