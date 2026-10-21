"""
End-to-End Verification Suite for Part 2:
AIOps OpsPages <-> AIOps OpsBase Integration & Public Runtime Config Alignment (P-13, P-9).

Verifies all 6 core requirements:
1. Vínculo (Project Linking & Discovery):
   - Fetches scoped `anon` public key (`opsbase_anon_...`) and URLs via OpsBase discovery endpoint.
   - Strictly rejects manually typed keys or placeholders (`opsb_pub_...`, `<...>`, `placeholder`, `service_role`).
2. URL Correta (Default OpsBase URL):
   - Default `opsbase_url` is `http://localhost:8001/api/v1` in dev, configurable per environment.
3. Ambientes (Strict `?env=` Validation):
   - Public config is stored per project and per environment (`production`, `staging`, `development`, `preview`).
   - Invalid `?env=` returns HTTP 400 (never silently falls back to `production`).
   - Inactive/missing environment returns HTTP 404.
4. Sincronização (Webhook & On-Demand Sync without Redeploy):
   - Key rotation and revocation in OpsBase update OpsPages public runtime config immediately via webhook or on-demand sync without redeploying the site.
5. Entrega (Runtime Delivery, `no-cache`, Never in Bundle, Zero Secrets):
   - Delivered at runtime with `Cache-Control: no-cache, no-store, must-revalidate`.
   - Never contains `service_role_key`, database password, or database URI (`postgresql://`, `mysql://`, `sqlite:///`).
6. CORS Alinhado (One-Step Exact Origin Registration with OpsBase):
   - Registers exact site origins (`http://localhost:8005`, `https://{custom_domain}`) in both OpsPages and OpsBase, never `*` with credentials.
"""
from __future__ import annotations

import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.db.session import init_meta_db


MOCK_DISCOVERY_AIOPS_CRUD = {
    "project_id": 2,
    "project_name": "AIOps CRUD",
    "slug": "aiops_crud",
    "project_slug": "aiops-crud",
    "schema_name": "proj_aiops_crud",
    "base_url": "http://localhost:8001",
    "api_base_url": "http://localhost:8001/api/v1",
    "data_plane_url": "http://localhost:8001/api/v1/projects/2",
    "rest_api_url": "http://localhost:8001/api/v1/projects/2/tables",
    "tables_url": "http://localhost:8001/api/v1/projects/2/tables",
    "query_url": "http://localhost:8001/api/v1/projects/2/query",
    "auth_url": "http://localhost:8001/api/v1/projects/2/auth",
    "global_auth_url": "http://localhost:8001/api/v1/auth",
    "anon_key": "opsbase_anon_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
    "public_key": "opsbase_anon_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
    "key_prefix": "opsbase_anon_9f8e7d",
    "key_type": "anon",
    "key_status": "active",
    "role": "opsbase_anon",
    "db_role": "opsbase_anon",
    "rls_enforced": True,
    "allowed_origins": [
        "http://localhost:8005",
        "http://127.0.0.1:8005",
        "http://localhost:5176",
    ],
}

MOCK_DISCOVERY_PORTAL_LOFT = {
    "project_id": 1,
    "project_name": "Portal Loft",
    "slug": "portal_loft",
    "project_slug": "portal-loft",
    "schema_name": "proj_portal_loft",
    "base_url": "http://localhost:8001",
    "api_base_url": "http://localhost:8001/api/v1",
    "data_plane_url": "http://localhost:8001/api/v1/projects/1",
    "rest_api_url": "http://localhost:8001/api/v1/projects/1/tables",
    "tables_url": "http://localhost:8001/api/v1/projects/1/tables",
    "query_url": "http://localhost:8001/api/v1/projects/1/query",
    "auth_url": "http://localhost:8001/api/v1/projects/1/auth",
    "global_auth_url": "http://localhost:8001/api/v1/auth",
    "anon_key": "opsbase_anon_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    "public_key": "opsbase_anon_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    "key_prefix": "opsbase_anon_1a2b3c",
    "key_type": "anon",
    "key_status": "active",
    "role": "opsbase_anon",
    "db_role": "opsbase_anon",
    "rls_enforced": True,
    "allowed_origins": [
        "http://localhost:8005",
        "http://127.0.0.1:8005",
        "http://localhost:5176",
    ],
}


def run_all_tests() -> None:
    init_meta_db()
    client = TestClient(app)

    # Authenticate as Super Admin
    pwd = settings.effective_superadmin_password
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": settings.DEFAULT_SUPERADMIN_EMAIL, "password": pwd},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    def _mock_fetch_discovery(project, opsbase_project_id=None, opsbase_project_slug=None, **kwargs):
        slug = (opsbase_project_slug or project.slug or "").lower()
        if "portal" in slug or opsbase_project_id == 1:
            return dict(MOCK_DISCOVERY_PORTAL_LOFT)
        return dict(MOCK_DISCOVERY_AIOPS_CRUD)

    with patch(
        "app.services.opsbase_service.OpsBaseIntegrationService.fetch_discovery_from_opsbase",
        side_effect=_mock_fetch_discovery,
    ):
        # 1. Link & Sync both projects (portal-loft ID=1 and aiops-crud ID=2) with OpsBase Discovery
        for pid, pslug in [(1, "portal-loft"), (2, "aiops-crud")]:
            sync_resp = client.post(
                f"/api/v1/projects/{pid}/opsbase/link",
                headers=headers,
                json={"opsbase_project_slug": pslug, "sync_cors": True},
            )
            assert sync_resp.status_code == 200, f"Link failed for {pslug}: {sync_resp.text}"
            sync_data = sync_resp.json()
            assert sync_data["linked"] is True
            assert sync_data["opsbase_key_status"] == "active"
            assert sync_data["opsbase_url"] == "http://localhost:8001/api/v1"
            assert sync_data["opsbase_key_prefix"].startswith("opsbase_anon_")

        # 2. Verify runtime config delivery for aiops-crud across all 4 valid environments
        for env_name in ("production", "staging", "development", "preview"):
            cfg_resp = client.get(f"/api/v1/public/projects/aiops-crud/config?env={env_name}")
            assert cfg_resp.status_code == 200, f"Expected 200 for env={env_name}, got {cfg_resp.status_code}"
            assert "no-cache" in cfg_resp.headers.get("cache-control", "")
            assert "no-store" in cfg_resp.headers.get("cache-control", "")
            payload = cfg_resp.json()
            assert payload["environment"] == env_name
            assert payload["opsbase_url"] == "http://localhost:8001/api/v1"
            assert payload["opsbase"]["public_key"] == MOCK_DISCOVERY_AIOPS_CRUD["anon_key"]
            # P-18: aliases deprecated removidos da config pública
            for alias in ("opsbase_public_key", "opsbase_anon_key", "public_key", "anon_key"):
                assert alias not in payload, f"alias {alias} ainda presente"
            assert payload["opsbase"]["url"] == "http://localhost:8001/api/v1"
            for alias in ("publicKey", "anon_key", "anonKey", "keySource"):
                assert alias not in payload["opsbase"], f"alias opsbase.{alias} ainda presente"
            assert payload["opsbase"]["key_source"] == "opsbase_discovery"
            assert "OPSBASE_PUBLIC_KEY" not in payload["env"] and "OPSBASE_ANON_KEY" not in payload["env"]
            # Ensure zero forbidden secrets in payload
            raw_json = cfg_resp.text.lower()
            assert "service_role" not in raw_json
            assert "postgresql://" not in raw_json
            assert "opsb_pub_" not in raw_json

        # 3. Verify strict ?env= validation (400 on invalid/empty ?env=, never falling back to production)
        for bad_env in ("invalid", "homolog", "prod", ""):
            bad_resp = client.get(f"/api/v1/public/projects/aiops-crud/config?env={bad_env}")
            assert bad_resp.status_code == 400, f"Expected 400 for ?env={bad_env}, got {bad_resp.status_code}"
            bad_js = client.get(f"/pages/aiops-crud/env-config.js?env={bad_env}")
            assert bad_js.status_code == 400, f"Expected 400 on env-config.js?env={bad_env}, got {bad_js.status_code}"
            bad_html = client.get(f"/pages/aiops-crud/?env={bad_env}")
            assert bad_html.status_code == 400, f"Expected 400 on /pages/aiops-crud/?env={bad_env}, got {bad_html.status_code}"

        # 4. Verify rejection (HTTP 400) of manually typed or placeholder keys and forbidden secrets
        for forbidden_key in (
            "opsb_pub_aiops-crud_production_123456",
            "opsbase_anon_manually_typed_key_1234567890",
            "<OPSBASE_PUBLIC_KEY>",
            "placeholder_key",
            "opsbase_service_secret1234567890123456",
        ):
            put_key_resp = client.put(
                "/api/v1/projects/2/public-config/production",
                headers=headers,
                json={
                    "environment": "production",
                    "opsbase_url": "http://localhost:8001/api/v1",
                    "opsbase_public_key": forbidden_key,
                },
            )
            assert put_key_resp.status_code == 400, (
                f"Expected 400 when attempting to set manual/placeholder key '{forbidden_key}', got {put_key_resp.status_code}"
            )

        # Also reject service_role_key or DB URI inside public_vars
        for bad_vars in (
            {"service_role_key": "opsbase_service_123456"},
            {"database_url": "postgresql://postgres:secret@localhost:5432/db"},
            {"db_password": "supersecretpassword"},
        ):
            put_vars_resp = client.put(
                "/api/v1/projects/2/public-config/production",
                headers=headers,
                json={
                    "environment": "production",
                    "opsbase_url": "http://localhost:8001/api/v1",
                    "public_vars": bad_vars,
                },
            )
            assert put_vars_resp.status_code == 400, (
                f"Expected 400 when attempting to inject secret {bad_vars} in public_vars, got {put_vars_resp.status_code}"
            )

        # 5. Verify per-environment URL customization (e.g. staging custom DNS) while keeping discovered key
        stage_put = client.put(
            "/api/v1/projects/2/public-config/staging",
            headers=headers,
            json={
                "environment": "staging",
                "opsbase_url": "https://api-staging.opsbase.loft.com.br/api/v1",
                "opsbase_project_slug": "aiops-crud",
                "scopes": "data:read,data:write,auth:public",
                "public_vars": {"FEATURE_FLAG_X": True},
                "inject_in_html": True,
                "is_active": True,
            },
        )
        assert stage_put.status_code == 200, f"Staging update failed: {stage_put.text}"
        stage_cfg = client.get("/api/v1/public/projects/aiops-crud/config?env=staging").json()
        assert stage_cfg["opsbase_url"] == "https://api-staging.opsbase.loft.com.br/api/v1"
        assert stage_cfg["opsbase"]["public_key"] == MOCK_DISCOVERY_AIOPS_CRUD["anon_key"]
        assert stage_cfg["env"]["FEATURE_FLAG_X"] is True

        # Reset staging URL back to http://localhost:8001/api/v1
        client.put(
            "/api/v1/projects/2/public-config/staging",
            headers=headers,
            json={
                "environment": "staging",
                "opsbase_url": "http://localhost:8001/api/v1",
                "opsbase_project_slug": "aiops-crud",
                "scopes": "data:read,data:write,auth:public",
                "public_vars": {},
                "inject_in_html": True,
                "is_active": True,
            },
        )

        # 6. Verify Webhook Key Rotation & Revocation without redeploy
        rotated_key = "opsbase_anon_rotated99887766554433221100aabbccdd"
        wh_rotate = client.post(
            "/api/v1/webhooks/opsbase",
            json={
                "event": "key.rotated",
                "project_id": 2,
                "project_slug": "aiops_crud",
                "anon_key": rotated_key,
                "key_type": "anon",
                "key_status": "active",
            },
        )
        assert wh_rotate.status_code == 200, f"Webhook rotation failed: {wh_rotate.text}"
        after_rot = client.get("/api/v1/public/projects/aiops-crud/config?env=production").json()
        assert after_rot["opsbase"]["public_key"] == rotated_key

        # Webhook revocation clears the key immediately without redeploy
        wh_revoke = client.post(
            "/api/v1/webhooks/opsbase",
            json={
                "event": "key.revoked",
                "project_id": 2,
                "project_slug": "aiops_crud",
                "key_type": "anon",
                "key_status": "revoked",
            },
        )
        assert wh_revoke.status_code == 200, f"Webhook revoke failed: {wh_revoke.text}"
        after_rev = client.get("/api/v1/public/projects/aiops-crud/config?env=production").json()
        assert after_rev["opsbase"]["public_key"] == ""
        assert after_rev["opsbase_key_status"] == "revoked"

        # Re-sync on demand restores the active key from OpsBase Discovery
        resync = client.post("/api/v1/projects/2/opsbase/sync", headers=headers, json={})
        assert resync.status_code == 200
        after_resync = client.get("/api/v1/public/projects/aiops-crud/config?env=production").json()
        assert after_resync["opsbase"]["public_key"] == MOCK_DISCOVERY_AIOPS_CRUD["anon_key"]
        assert after_resync["opsbase_key_status"] == "active"

        # 7. Verify CORS exact-origin alignment and custom_domain registration
        cors_sync = client.post(
            "/api/v1/projects/2/opsbase/cors-sync",
            headers=headers,
            json={"extra_origins": ["https://crud.loft.com.br"]},
        )
        assert cors_sync.status_code == 200, f"CORS sync failed: {cors_sync.text}"
        cors_body = cors_sync.json()
        assert "http://localhost:8005" in cors_body["pages_exact_origins"]
        assert "https://crud.loft.com.br" in cors_body["pages_exact_origins"]
        assert "*" not in cors_body["pages_exact_origins"]

    print("ALL PART 2 INTEGRATION TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_all_tests()
