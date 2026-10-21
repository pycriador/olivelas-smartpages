"""
Comprehensive test suite for AIOps OpsPages Backend:
- Super Admin seeding (willian.jesus@loft.com.br) & JWT authentication
- HBAC roles (Admin, Editor, Viewer)
- Project lifecycle & /repos Git repository initialization
- Static hosting (/pages/{slug}/ and /pages/{slug}/v/{version}/) + SPA fallback
- .zip archive upload, Quick Web Builder, Auto-Approval, Manual Approval, and Version Lock
- Git commits, tags, diffs, file tree explorer
- API tokens (opsp_deploy_...), Quotas, CORS rules, and Audit trail
"""
from __future__ import annotations

import io
import os
import shutil
import tempfile
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Configure isolated test DB and /repos before importing app
TEST_DIR = Path(tempfile.mkdtemp(prefix="opspages_test_"))
os.environ["OPSPAGES_META_DB_URL"] = f"sqlite:///{TEST_DIR / 'test_opspages.db'}"
os.environ["REPOS_STORAGE_DIR"] = str(TEST_DIR / "repos")

from app.core.config import settings
settings.OPSPAGES_META_DB_URL = os.environ["OPSPAGES_META_DB_URL"]
settings.REPOS_STORAGE_DIR = os.environ["REPOS_STORAGE_DIR"]

from app.main import app
from app.db.session import init_meta_db

# --- Network guard + login fail-fast (round 5, incident 14:44 BRT; GAPS-pages P-21) ---
# The app calls OpsBase (discovery, admin login, cors-sync) through httpx while these tests
# create projects. Those calls must never reach a live OpsBase by accident, and a failing
# login must never be retried: one 401/429 aborts the whole run.
# - Default: every outbound request to a host other than the TestClient ("testserver") is
#   blocked before it leaves the process (the app treats it as "OpsBase unreachable").
# - Opt-in (OPSPAGES_TESTS_ALLOW_LIVE_OPSBASE=1, only against a dedicated test OpsBase):
#   requests go out, but the first 401/429 from any /auth/login stops the run.
import httpx

LOGIN_FAILFAST_STATUSES = {401, 429}
_ALLOW_LIVE_OPSBASE = os.environ.get("OPSPAGES_TESTS_ALLOW_LIVE_OPSBASE") == "1"
_login_failure: dict = {}
_original_client_send = httpx.Client.send


def _is_login_request(request: httpx.Request) -> bool:
    return request.method == "POST" and request.url.path.rstrip("/").endswith("/auth/login")


def _guarded_send(self, request, *args, **kwargs):
    if _login_failure:
        # A login already failed: no further requests of any kind (no retry, no next candidate).
        raise httpx.ConnectError("test run aborted after login failure (fail-fast)", request=request)
    if request.url.host != "testserver" and not _ALLOW_LIVE_OPSBASE:
        raise httpx.ConnectError(
            f"outbound request blocked by test guard: {request.method} {request.url.host}{request.url.path}",
            request=request,
        )
    response = _original_client_send(self, request, *args, **kwargs)
    if _is_login_request(request) and response.status_code in LOGIN_FAILFAST_STATUSES:
        _login_failure.update(
            status=response.status_code, host=request.url.host, path=request.url.path
        )
    return response


httpx.Client.send = _guarded_send


def _abort_if_login_failed() -> None:
    if _login_failure:
        pytest.exit(
            "fail-fast: login returned HTTP {status} at {host}{path}; aborting the whole run "
            "without retrying (incident 14:44, P-21)".format(**_login_failure),
            returncode=1,
        )


@pytest.fixture(autouse=True)
def _login_failfast_guard():
    _abort_if_login_failed()
    yield
    _abort_if_login_failed()


def create_zip_bytes(files: dict[str, str]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for path, content in files.items():
            zf.writestr(path, content)
    return buf.getvalue()


@pytest.fixture(scope="module")
def client():
    init_meta_db()
    with TestClient(app) as c:
        yield c
    shutil.rmtree(TEST_DIR, ignore_errors=True)


def test_health_and_superadmin_login(client: TestClient):
    # Health check
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["default_superadmin"] == "willian.jesus@loft.com.br"

    # Public overview endpoint (real backend data for LandingPage)
    pub_res = client.get("/api/v1/public/overview")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert "stats" in pub_data
    assert "public_projects" in pub_data

    # Login with default Super Admin (by email)
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "willian.jesus@loft.com.br",
            "password": settings.effective_superadmin_password,
        },
    )
    assert login_res.status_code == 200, login_res.text
    token_data = login_res.json()
    assert token_data["user"]["email"] == "willian.jesus@loft.com.br"
    assert token_data["user"]["is_superuser"] is True


def test_full_project_git_deploy_lock_and_approval_flow(client: TestClient):
    # Authenticate as Super Admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "willian.jesus@loft.com.br",
            "password": settings.effective_superadmin_password,
        },
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a new project with auto_approval=True
    proj_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "Loft Checkout Portal",
            "slug": "loft-checkout",
            "description": "Frontend static build for Loft Checkout",
            "environment": "production",
            "auto_approval": True,
            "spa_mode": True,
            "github_repo_url": "https://github.com/loft-br/checkout-pages.git",
            "github_branch": "main",
            "github_subpath": "/repos/loft-checkout",
        },
    )
    assert proj_res.status_code == 201, proj_res.text
    project = proj_res.json()
    project_id = project["id"]
    assert project["active_version"] == "v1.0.0"
    assert project["auto_approval"] is True
    assert project["is_locked"] is False

    # Verify initial static page is served at /pages/loft-checkout/
    page_res = client.get("/pages/loft-checkout/")
    assert page_res.status_code == 200
    assert "Loft Checkout Portal" in page_res.text

    # Verify SPA fallback works for deep route
    spa_res = client.get("/pages/loft-checkout/checkout/step-2")
    assert spa_res.status_code == 200
    assert "Loft Checkout Portal" in spa_res.text

    # 2. Upload a .zip build (v1.1.0) with auto_approval=True -> auto publishes
    zip_v110 = create_zip_bytes({
        "dist/index.html": "<!DOCTYPE html><html><body><h1>Checkout v1.1.0 Live</h1></body></html>",
        "dist/app.js": "console.log('v1.1.0');",
    })
    up_res = client.post(
        f"/api/v1/projects/{project_id}/deployments/upload",
        headers=headers,
        data={
            "version": "v1.1.0",
            "release_notes": "Added Pix checkout",
        },
        files={"file": ("build-v1.1.0.zip", zip_v110, "application/zip")},
    )
    assert up_res.status_code == 201, up_res.text
    dep_v110 = up_res.json()
    assert dep_v110["status"] == "published"
    assert dep_v110["version"] == "v1.1.0"
    assert dep_v110["git_tag"] == "v1.1.0"
    assert len(dep_v110["git_commit_sha"]) >= 7

    # Verify live production page is now v1.1.0
    live_res = client.get("/pages/loft-checkout/")
    assert "Checkout v1.1.0 Live" in live_res.text

    # Verify v1.0.0 is still accessible via immutable version preview URL
    prev_res = client.get("/pages/loft-checkout/v/v1.0.0/")
    assert prev_res.status_code == 200
    assert "Loft Checkout Portal" in prev_res.text

    # 3. Lock project at v1.1.0
    lock_res = client.post(
        f"/api/v1/projects/{project_id}/lock",
        headers=headers,
        json={"is_locked": True, "version": "v1.1.0"},
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["is_locked"] is True
    assert lock_res.json()["locked_version"] == "v1.1.0"

    # 4. Upload v1.2.0 while locked -> should NOT overwrite production, status should be 'ready'
    zip_v120 = create_zip_bytes({
        "index.html": "<!DOCTYPE html><html><body><h1>Checkout v1.2.0 Canary</h1></body></html>",
    })
    up_res_120 = client.post(
        f"/api/v1/projects/{project_id}/deployments/upload",
        headers=headers,
        data={"version": "v1.2.0", "release_notes": "Canary release while locked"},
        files={"file": ("build-v1.2.0.zip", zip_v120, "application/zip")},
    )
    assert up_res_120.status_code == 201
    dep_v120 = up_res_120.json()
    assert dep_v120["status"] == "ready"

    # Production URL must still serve v1.1.0!
    assert "Checkout v1.1.0 Live" in client.get("/pages/loft-checkout/").text
    # Preview URL serves v1.2.0!
    assert "Checkout v1.2.0 Canary" in client.get("/pages/loft-checkout/v/v1.2.0/").text

    # 5. Disable auto_approval and unlock project
    client.put(
        f"/api/v1/projects/{project_id}",
        headers=headers,
        json={"auto_approval": False},
    )
    client.post(
        f"/api/v1/projects/{project_id}/lock",
        headers=headers,
        json={"is_locked": False},
    )

    # 6. Upload v1.3.0 via Quick Web Builder -> should enter 'pending_approval'
    quick_res = client.post(
        f"/api/v1/projects/{project_id}/deployments/quick-build",
        headers=headers,
        json={
            "version": "v1.3.0",
            "release_notes": "Requires manual approval",
            "files": {
                "index.html": "<!DOCTYPE html><html><body><h1>Checkout v1.3.0 Approved</h1></body></html>",
                "styles.css": "body { color: #F56738; }",
                "app.js": "console.log('v1.3.0');",
            },
        },
    )
    assert quick_res.status_code == 201
    dep_v130 = quick_res.json()
    assert dep_v130["status"] == "pending_approval"

    # Production is still v1.1.0 before approval
    assert "Checkout v1.1.0 Live" in client.get("/pages/loft-checkout/").text

    # Approve v1.3.0 -> becomes 'published' and live!
    app_res = client.post(
        f"/api/v1/projects/{project_id}/deployments/v1.3.0/approve",
        headers=headers,
        json={"publish_immediately": True, "notes": "LGTM!"},
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "published"
    assert "Checkout v1.3.0 Approved" in client.get("/pages/loft-checkout/").text

    # 7. Check Git status, commits, tags, diff, and file explorer
    git_res = client.get(f"/api/v1/projects/{project_id}/git/status", headers=headers)
    assert git_res.status_code == 200
    git_data = git_res.json()
    assert git_data["initialized"] is True
    assert len(git_data["commits"]) >= 4
    assert "v1.0.0" in git_data["tags"]
    assert "v1.3.0" in git_data["tags"]

    diff_res = client.get(
        f"/api/v1/projects/{project_id}/git/diff?base_version=v1.1.0&target_version=v1.3.0",
        headers=headers,
    )
    assert diff_res.status_code == 200
    assert "diff_text" in diff_res.json()

    files_res = client.get(
        f"/api/v1/projects/{project_id}/deployments/v1.3.0/files",
        headers=headers,
    )
    assert files_res.status_code == 200
    paths = [f["path"] for f in files_res.json()]
    assert "index.html" in paths
    assert "styles.css" in paths


def test_hbac_roles_and_audit(client: TestClient):
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "username": "willian.jesus@loft.com.br",
            "password": settings.effective_superadmin_password,
        },
    )
    admin_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Create a Viewer user
    viewer_res = client.post(
        "/api/v1/users",
        headers=admin_headers,
        json={
            "username": "ana.viewer",
            "email": "ana.viewer@loft.com.br",
            "full_name": "Ana Viewer",
            "password": "Viewer@OpsPages2026",
            "role": "viewer",
        },
    )
    assert viewer_res.status_code == 201

    # Login as Viewer
    v_login = client.post(
        "/api/v1/auth/login",
        json={"username": "ana.viewer", "password": "Viewer@OpsPages2026"},
    )
    viewer_headers = {"Authorization": f"Bearer {v_login.json()['access_token']}"}

    # Viewer can list projects
    list_res = client.get("/api/v1/projects", headers=viewer_headers)
    assert list_res.status_code == 200
    project_id = list_res.json()[0]["id"]

    # Permissions list endpoint works and returns user_email/username
    perms_res = client.get(f"/api/v1/projects/{project_id}/permissions", headers=admin_headers)
    assert perms_res.status_code == 200
    assert len(perms_res.json()) >= 1

    # Viewer CANNOT lock/unlock project (requires editor/admin)
    lock_attempt = client.post(
        f"/api/v1/projects/{project_id}/lock",
        headers=viewer_headers,
        json={"is_locked": True},
    )
    assert lock_attempt.status_code == 403

    # Audit logs recorded actions
    audit_res = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert audit_res.status_code == 200
    assert audit_res.json()["total"] >= 5
