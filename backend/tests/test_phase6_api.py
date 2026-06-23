"""Phase 6 — Content Studio cards, CMS overrides, Google Auth surface."""
import os
import uuid

import pytest
import requests

API = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(
        f"{API}/auth/login",
        json={
            "email": os.environ.get("ADMIN_EMAIL", "admin@scienceofautonomy.app"),
            "password": os.environ.get("ADMIN_PASSWORD", "autonomy2026"),
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- Google Auth surface ----------------


def test_google_session_missing_id(s):
    r = s.post(f"{API}/auth/google-session", json={})
    assert r.status_code == 400
    assert "session_id" in r.json()["detail"].lower()


def test_google_session_invalid_id(s):
    # Bogus session_id reaches Emergent but should be rejected (401 from us).
    r = s.post(
        f"{API}/auth/google-session",
        json={},
        headers={"X-Session-ID": f"definitely-not-real-{uuid.uuid4().hex}"},
    )
    assert r.status_code in (401, 502)


def test_existing_jwt_login_still_works(s, admin_token):
    # Sanity: regression that email/password JWT login was not broken.
    assert isinstance(admin_token, str) and len(admin_token) > 50


# ---------------- Admin CMS — lesson overrides ----------------


def test_admin_all_lessons_lists_seed_and_custom(s, admin_headers):
    r = s.get(f"{API}/admin/all-lessons", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 46
    origins = {l["origin"] for l in data["lessons"]}
    assert "seed" in origins
    # Each item must expose edit flags
    for l in data["lessons"][:3]:
        assert "edited" in l
        assert "origin" in l


def test_admin_all_lessons_requires_admin():
    r = requests.get(f"{API}/admin/all-lessons")
    assert r.status_code == 401


def test_admin_lesson_get_and_override_roundtrip(s, admin_headers):
    # GET base
    r = s.get(f"{API}/admin/lessons/l-pid", headers=admin_headers)
    assert r.status_code == 200
    original_title = r.json()["lesson"]["title"]
    assert r.json()["origin"] == "seed"

    # PUT a title override
    new_title = f"PID — Edited {uuid.uuid4().hex[:6]}"
    r = s.put(
        f"{API}/admin/lessons/l-pid",
        headers=admin_headers,
        json={"title": new_title},
    )
    assert r.status_code == 200, r.text
    assert r.json()["lesson"]["title"] == new_title
    assert r.json()["lesson"].get("edited") is True

    # Public /tracks/ reflects the override
    r = s.get(f"{API}/tracks/track-gnc")
    titles = [l["title"] for m in r.json()["modules"] for l in m["lessons"]]
    assert new_title in titles

    # all-lessons marks it as edited
    r = s.get(f"{API}/admin/all-lessons", headers=admin_headers)
    pid_row = next(l for l in r.json()["lessons"] if l["id"] == "l-pid")
    assert pid_row["edited"] is True
    assert pid_row["title"] == new_title

    # Revert
    r = s.delete(f"{API}/admin/lessons/l-pid/override", headers=admin_headers)
    assert r.status_code == 200 and r.json()["reverted"] is True

    # Restored to original
    r = s.get(f"{API}/admin/lessons/l-pid", headers=admin_headers)
    assert r.json()["lesson"]["title"] == original_title


def test_admin_update_seed_blocks(s, admin_headers):
    new_blocks = [{"type": "caption", "text": "PATCHED CAPTION"}]
    r = s.put(
        f"{API}/admin/lessons/l-pid",
        headers=admin_headers,
        json={"blocks": new_blocks},
    )
    assert r.status_code == 200
    assert r.json()["lesson"]["blocks"] == new_blocks
    # Public /lessons/ reflects override too
    r = s.get(f"{API}/lessons/l-pid")
    assert any(b.get("text") == "PATCHED CAPTION" for b in r.json()["blocks"])
    # Cleanup
    s.delete(f"{API}/admin/lessons/l-pid/override", headers=admin_headers)


def test_admin_update_unknown_lesson_404(s, admin_headers):
    r = s.put(
        f"{API}/admin/lessons/does-not-exist",
        headers=admin_headers,
        json={"title": "x"},
    )
    assert r.status_code == 404


def test_admin_update_empty_patch_400(s, admin_headers):
    r = s.put(
        f"{API}/admin/lessons/l-pid",
        headers=admin_headers,
        json={},
    )
    assert r.status_code == 400


def test_admin_update_requires_admin():
    r = requests.put(f"{API}/admin/lessons/l-pid", json={"title": "x"})
    assert r.status_code == 401


# ---------------- Calendar export ----------------


def test_calendar_weeks_and_track_combined(s):
    r = s.get(f"{API}/studio/calendar.csv", params={"weeks": 3, "trackId": "track-foundations"})
    assert r.status_code == 200
    rows = r.text.strip().splitlines()
    assert len(rows) == 1 + 15  # 3 weeks × 5 days
    for row in rows[1:]:
        assert "track-foundations" in row
