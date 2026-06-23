"""End-to-end backend tests for Science of Autonomy MVP."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drone-science-learn.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def test_user(s):
    """Create a brand-new TEST_ user; reused across the session."""
    email = f"TEST_user_{uuid.uuid4().hex[:10]}@example.com"
    password = "TestPass123!"
    name = "Test User"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": password, "name": name, "goal": "student"})
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    return {"email": email, "password": password, "name": name, "token": body["token"], "user": body["user"]}


@pytest.fixture(scope="session")
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['token']}", "Content-Type": "application/json"}


# ---------- Root / health ----------
def test_root_ok(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["app"] == "Science of Autonomy"


# ---------- Curriculum ----------
def test_tracks_returns_three(s):
    r = s.get(f"{API}/tracks")
    assert r.status_code == 200
    tracks = r.json()["tracks"]
    # Phase 2: now 10 tracks. Verify the 3 MVP tracks are still present.
    assert len(tracks) >= 3
    ids = {t["id"] for t in tracks}
    assert {"track-foundations", "track-anatomy", "track-gnc"}.issubset(ids)
    for t in tracks:
        assert "title" in t and "lessonCount" in t and "moduleCount" in t


def test_foundations_has_modules_and_lessons(s):
    r = s.get(f"{API}/tracks/track-foundations")
    assert r.status_code == 200
    track = r.json()
    assert len(track["modules"]) == 2
    total_lessons = sum(len(m["lessons"]) for m in track["modules"])
    assert total_lessons == 5, f"expected 5 lessons in foundations, got {total_lessons}"


def test_lesson_pid(s):
    r = s.get(f"{API}/lessons/l-pid")
    assert r.status_code == 200
    l = r.json()
    assert l["id"] == "l-pid"
    assert isinstance(l.get("quiz"), list) and len(l["quiz"]) >= 1
    assert "socialClip" in l
    assert "prevLessonId" in l and "nextLessonId" in l
    # Per problem statement: first question 'P' has answer index 0
    q = l["quiz"][0]
    assert "answer" in q


def test_lesson_404(s):
    r = s.get(f"{API}/lessons/does-not-exist")
    assert r.status_code == 404


# ---------- Auth ----------
def test_register_and_login(s, test_user):
    # login with same creds returns same user.id
    r = s.post(f"{API}/auth/login", json={"email": test_user["email"], "password": test_user["password"]})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["id"] == test_user["user"]["id"]
    assert "token" in body


def test_login_invalid(s):
    r = s.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "wrongpass"})
    assert r.status_code == 401


def test_me_with_bearer(s, auth_headers, test_user):
    r = s.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["id"] == test_user["user"]["id"]


def test_me_without_token(s):
    # Use a fresh session to avoid cookie auth
    bare = requests.Session()
    r = bare.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_admin_login(s):
    r = s.post(f"{API}/auth/login", json={"email": "admin@scienceofautonomy.app", "password": "autonomy2026"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "admin"


# ---------- Progress ----------
def test_complete_lesson_awards_xp(s, auth_headers, test_user):
    # Clear cookies so Bearer auth is honored (cookie takes precedence in get_current_user)
    s.cookies.clear()
    r = s.post(f"{API}/progress/complete", json={"lesson_id": "l-pid", "score": 1.0}, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    awarded = body["xpAwarded"]
    assert 25 <= awarded <= 40, f"xp out of range: {awarded}"

    # GET /api/progress reflects the completion + xp persisted on user
    r2 = s.get(f"{API}/progress", headers=auth_headers)
    assert r2.status_code == 200
    data = r2.json()
    assert any(p["lesson_id"] == "l-pid" and p["completed"] for p in data["progress"])
    assert data["user"]["xp"] >= awarded
    assert data["user"]["level"] >= 1


def test_complete_lesson_idempotent(s, auth_headers):
    # second call should NOT re-award xp
    r = s.post(f"{API}/progress/complete", json={"lesson_id": "l-pid", "score": 1.0}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["xpAwarded"] == 0


def test_complete_bad_lesson(s, auth_headers):
    r = s.post(f"{API}/progress/complete", json={"lesson_id": "bogus-id", "score": 0.5}, headers=auth_headers)
    assert r.status_code == 404


# ---------- Assessment ----------
def test_assessment_submit(s, auth_headers):
    payload = {
        "perceptual_spatial": 0.4,
        "attentional": 0.7,
        "psychomotor": 0.6,
        "higher_order": 0.5,
        "dispositional": 0.8,
        "trainability_slope": 0.2,
    }
    r = s.post(f"{API}/assessment/submit", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "recommendedTrack" in body
    rec = body["recommendedTrack"]
    assert rec["trackId"] in {"track-foundations", "track-anatomy", "track-gnc"}
    # weakest domain in our payload is perceptual_spatial (0.4) -> foundations
    assert rec["weakestDomain"] == "perceptual_spatial"
    assert rec["trackId"] == "track-foundations"


# ---------- Studio ----------
def test_social_clips_one_per_lesson(s):
    r1 = s.get(f"{API}/studio/social-clips")
    assert r1.status_code == 200
    items = r1.json()["items"]
    # Phase 2: 10 tracks, 46 lessons -> 46 clips
    tracks = s.get(f"{API}/tracks").json()["tracks"]
    total = 0
    for t in tracks:
        td = s.get(f"{API}/tracks/{t['id']}").json()
        total += sum(len(m["lessons"]) for m in td["modules"])
    assert len(items) == total, f"expected {total} clips, got {len(items)}"
    for it in items:
        clip = it["clip"]
        for k in ("hook", "coreIdea", "takeaway", "hashtags"):
            assert k in clip, f"missing {k} in clip"


def test_calendar_csv(s):
    r = s.get(f"{API}/studio/calendar.csv")
    assert r.status_code == 200
    cd = r.headers.get("content-disposition", "")
    assert "attachment" in cd and "content_calendar" in cd and ".csv" in cd
    text = r.text
    assert text.startswith("week,day,lessonId,title,trackId,hook,coreIdea,takeaway,hashtags")
    # Default = 4 weeks × 5 weekdays = 20 rows
    assert len(text.strip().splitlines()) == 21  # header + 20 rows


def test_calendar_csv_weeks_param(s):
    r = s.get(f"{API}/studio/calendar.csv", params={"weeks": 6})
    assert r.status_code == 200
    rows = r.text.strip().splitlines()
    assert len(rows) == 1 + 30  # header + 6 weeks × 5 days


def test_calendar_csv_track_filter(s):
    r = s.get(f"{API}/studio/calendar.csv", params={"trackId": "track-foundations"})
    assert r.status_code == 200
    rows = r.text.strip().splitlines()
    # Every data row should reference the requested track
    for row in rows[1:]:
        assert "track-foundations" in row
