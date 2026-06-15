"""Phase 3 backend tests — glossary, search, badges, leaderboard, certificates,
tier preference, lesson comments, and admin CMS (stats + custom lessons)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drone-science-learn.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@scienceofautonomy.app"
ADMIN_PASS = "autonomy2026"

FOUNDATIONS_LESSONS = [
    "l-autonomy-ladder", "l-ooda-loop", "l-lift-drag", "l-airframes", "l-stability",
]


# ---------- Fixtures ----------
def _new_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def anon():
    return _new_session()


@pytest.fixture(scope="module")
def user():
    s = _new_session()
    email = f"TEST_p3_{uuid.uuid4().hex[:10]}@example.com"
    r = s.post(f"{API}/auth/register",
               json={"email": email, "password": "TestPass123!", "name": "P3 User"})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    # Use Bearer (cookie also set, but Bearer used for clarity in headers)
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return {"session": s, "email": email, "token": tok, "user": r.json()["user"]}


@pytest.fixture(scope="module")
def admin():
    s = _new_session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"admin login failed: {r.text}"
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return {"session": s, "token": tok}


# ---------- Glossary ----------
def test_glossary_returns_50_plus(anon):
    r = anon.get(f"{API}/glossary")
    assert r.status_code == 200
    terms = r.json()["terms"]
    assert len(terms) >= 50, f"Expected 50+ terms, got {len(terms)}"


def test_glossary_filter_rtk(anon):
    r = anon.get(f"{API}/glossary", params={"q": "RTK"})
    assert r.status_code == 200
    terms = r.json()["terms"]
    assert any(t["term"].upper() == "RTK" for t in terms), f"RTK not in filtered list: {[t['term'] for t in terms]}"


# ---------- Search ----------
def test_search_swarm(anon):
    r = anon.get(f"{API}/search", params={"q": "swarm"})
    assert r.status_code == 200
    data = r.json()
    assert "lessons" in data and "tracks" in data and "glossary" in data
    # At least one of lessons/tracks should hit, and glossary may hit too
    assert len(data["lessons"]) + len(data["tracks"]) + len(data["glossary"]) > 0


# ---------- Badges ----------
def test_badges_catalog_20(anon):
    r = anon.get(f"{API}/badges/catalog")
    assert r.status_code == 200
    badges = r.json()["badges"]
    assert len(badges) >= 20, f"Expected ≥20 badges, got {len(badges)}"
    # Each badge has id and name
    for b in badges[:3]:
        assert "id" in b and ("name" in b or "title" in b)


def test_badges_me_unauth_401(anon):
    r = anon.get(f"{API}/badges/me")
    assert r.status_code == 401


def test_badges_me_auth_returns_earned(user):
    r = user["session"].get(f"{API}/badges/me")
    assert r.status_code == 200
    data = r.json()
    assert "badges" in data and "earnedCount" in data and "totalCount" in data
    assert data["totalCount"] >= 20
    assert all("earned" in b for b in data["badges"])


# ---------- Leaderboard ----------
def test_leaderboard_xp(anon):
    r = anon.get(f"{API}/leaderboard", params={"metric": "xp"})
    assert r.status_code == 200
    data = r.json()
    assert data["metric"] == "xp"
    assert "entries" in data and isinstance(data["entries"], list)
    if data["entries"]:
        e = data["entries"][0]
        for k in ("name", "xp", "streak", "badges"):
            assert k in e


def test_leaderboard_streak(anon):
    r = anon.get(f"{API}/leaderboard", params={"metric": "streak"})
    assert r.status_code == 200
    assert r.json()["metric"] == "streak"


# ---------- Tier ----------
def test_set_tier_eli12(user):
    r = user["session"].patch(f"{API}/auth/tier", json={"tier": "eli12"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["tier"] == "eli12"
    # GET /me reflects it
    me = user["session"].get(f"{API}/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["tier"] == "eli12"


# ---------- Comments ----------
def test_comments_empty_then_create_then_listed(user):
    lesson = "l-pid"
    # GET (may have prior test comments — accept ≥0)
    r = user["session"].get(f"{API}/lessons/{lesson}/comments")
    assert r.status_code == 200
    before = r.json()["count"]
    body_text = f"TEST p3 comment {uuid.uuid4().hex[:6]}"
    p = user["session"].post(f"{API}/lessons/{lesson}/comments", json={"body": body_text})
    assert p.status_code == 200, p.text
    assert p.json()["comment"]["body"] == body_text
    r2 = user["session"].get(f"{API}/lessons/{lesson}/comments")
    assert r2.status_code == 200
    assert r2.json()["count"] == before + 1
    bodies = [c["body"] for c in r2.json()["comments"]]
    assert body_text in bodies


def test_comments_unauth_post_401(anon):
    r = anon.post(f"{API}/lessons/l-pid/comments", json={"body": "hi"})
    assert r.status_code == 401


# ---------- Certificate: NOT eligible ----------
def test_certificate_not_eligible_for_fresh_user():
    s = _new_session()
    email = f"TEST_p3cert_neg_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Cert Neg"})
    assert r.status_code == 200
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})
    c = s.get(f"{API}/certificates/track-foundations")
    assert c.status_code == 200
    data = c.json()
    assert data["eligible"] is False
    assert data["totalCount"] == 5
    assert data["completedCount"] < 5


# ---------- Certificate: eligible after completing all 5 ----------
def test_certificate_eligible_after_completion_and_badges():
    s = _new_session()
    email = f"TEST_p3cert_pos_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Cert Pos"})
    assert r.status_code == 200
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})

    awarded_badges_across = set()
    pid_badges = set()
    five_badges = set()
    for i, lid in enumerate(FOUNDATIONS_LESSONS):
        resp = s.post(f"{API}/progress/complete", json={"lesson_id": lid, "score": 1.0})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "newBadges" in data and isinstance(data["newBadges"], list)
        awarded_badges_across.update(data["newBadges"])
        if lid == "l-pid":
            pid_badges = set(data["newBadges"])
        if i == 4:
            five_badges = set(data["newBadges"])

    # 5 lessons should trigger 'five-lessons' badge (cumulative)
    me = s.get(f"{API}/auth/me").json()["user"]
    assert "five-lessons" in me["badges"], f"five-lessons not earned: {me['badges']}"

    # Certificate now eligible
    c = s.get(f"{API}/certificates/track-foundations")
    assert c.status_code == 200
    cd = c.json()
    assert cd["eligible"] is True, cd
    assert "cert_id" in cd and cd["cert_id"].startswith("SOA-")
    assert cd["user_name"] == "Cert Pos"
    assert cd["track"]["id"] == "track-foundations"
    assert "awarded_at" in cd


def test_control_theorist_badge_on_pid():
    s = _new_session()
    email = f"TEST_p3pid_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "PIDer"})
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})
    resp = s.post(f"{API}/progress/complete", json={"lesson_id": "l-pid", "score": 1.0})
    assert resp.status_code == 200
    me = s.get(f"{API}/auth/me").json()["user"]
    assert "control-theorist" in me["badges"], f"control-theorist not earned: {me['badges']}"


# ---------- Admin stats ----------
def test_admin_stats_as_admin(admin):
    r = admin["session"].get(f"{API}/admin/stats")
    assert r.status_code == 200
    data = r.json()
    for k in ("users", "lessonsCompleted", "assessments", "customLessons", "comments", "topLessons"):
        assert k in data
    assert isinstance(data["users"], int) and data["users"] >= 1


def test_admin_stats_as_regular_403(user):
    r = user["session"].get(f"{API}/admin/stats")
    assert r.status_code == 403


# ---------- Admin custom lesson CRUD ----------
@pytest.fixture(scope="module")
def custom_lesson_id():
    return f"l-test-custom-{uuid.uuid4().hex[:8]}"


def test_admin_create_custom_lesson(admin, custom_lesson_id):
    payload = {
        "id": custom_lesson_id,
        "title": "TEST Custom Lesson",
        "summary": "A test lesson created by the QA suite",
        "trackId": "track-foundations",
        "moduleId": "mod-foundations-1",
        "estMinutes": 5,
        "blocks": [
            {"type": "caption", "text": "Hello world caption"},
            {"type": "takeaway", "text": "Custom lessons work"},
        ],
        "quiz": [],
    }
    r = admin["session"].post(f"{API}/admin/lessons", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["lesson"]["id"] == custom_lesson_id

    # GET /api/lessons/{newId} resolves it
    g = admin["session"].get(f"{API}/lessons/{custom_lesson_id}")
    assert g.status_code == 200
    assert g.json()["id"] == custom_lesson_id

    # GET /api/tracks/track-foundations includes it
    t = admin["session"].get(f"{API}/tracks/track-foundations")
    assert t.status_code == 200
    all_ids = [l["id"] for m in t.json()["modules"] for l in m["lessons"]]
    assert custom_lesson_id in all_ids


def test_admin_create_lesson_as_user_403(user):
    payload = {
        "id": f"l-test-noaccess-{uuid.uuid4().hex[:6]}",
        "title": "Nope",
        "summary": "Should be rejected",
        "trackId": "track-foundations",
        "moduleId": "mod-foundations-1",
        "blocks": [{"type": "caption", "text": "x"}],
    }
    r = user["session"].post(f"{API}/admin/lessons", json=payload)
    assert r.status_code == 403


def test_admin_delete_seed_lesson_400(admin):
    r = admin["session"].delete(f"{API}/admin/lessons/l-pid")
    assert r.status_code == 400


def test_admin_delete_custom_lesson(admin, custom_lesson_id):
    r = admin["session"].delete(f"{API}/admin/lessons/{custom_lesson_id}")
    assert r.status_code == 200
    # GET should now 404
    g = admin["session"].get(f"{API}/lessons/{custom_lesson_id}")
    assert g.status_code == 404
