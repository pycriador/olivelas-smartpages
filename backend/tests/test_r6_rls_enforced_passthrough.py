"""
c4 / P-24 (round6): the public runtime config passes OpsBase's real `rls_enforced` through
(True / False) and reports None when discovery does not say — never a hard-coded True.
Offline: discovery is mocked; uses a throwaway SQLite meta DB.
"""
from __future__ import annotations

import os
import sys
import tempfile
import uuid
from unittest.mock import patch

_TMP = tempfile.mkdtemp(prefix="opspages_r6c4_")
os.environ.setdefault("OPSPAGES_META_DB_URL", f"sqlite:///{_TMP}/meta.db")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest  # noqa: E402

from app.db.session import SessionLocal, init_meta_db  # noqa: E402
from app.models.meta_models import Project  # noqa: E402
from app.services.opsbase_service import OpsBaseIntegrationService  # noqa: E402
from app.services.project_service import ProjectService  # noqa: E402

BASE = {
    "project_id": 124, "project_name": "R6 C4", "slug": "r6c4", "schema_name": "app_r6c4",
    "api_base_url": "http://localhost:8001/api/v1", "anon_key": "opsbase_anon_" + "a" * 32,
    "key_prefix": "opsbase_anon_aaaaaa", "key_status": "active",
}


@pytest.mark.parametrize("reported,expected", [(True, True), (False, False), ("missing", None), ("yes", None)])
def test_runtime_config_passes_rls_enforced_through(reported, expected):
    init_meta_db()
    db = SessionLocal()
    try:
        proj = Project(name="R6 C4", slug=f"r6c4-{uuid.uuid4().hex[:8]}")
        db.add(proj)
        db.commit()
        disc = dict(BASE)
        if reported != "missing":
            disc["rls_enforced"] = reported
        with patch.object(OpsBaseIntegrationService, "fetch_discovery_from_opsbase", return_value=disc):
            OpsBaseIntegrationService.link_or_sync_project(db=db, project=proj, opsbase_project_id=124, sync_cors=False)
            db.refresh(proj)
            payload = ProjectService.build_runtime_config_payload(db, proj, "production")
        assert payload["opsbase"]["rls_enforced"] is expected
    finally:
        db.close()
