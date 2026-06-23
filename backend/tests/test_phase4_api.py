"""Phase 4 simulator backend tests (sim/score, sim/best, sim/leaderboard) + regression."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drone-science-learn.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ----- fixtures -----
@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def user_a(s):
    email = f"TEST_p4a_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass123!", "name": "P4 User A", "goal": "student",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    return {"email": email, "token": body["token"], "user": body["user"]}


@pytest.fixture(scope="module")
def user_b(s):
    email = f"TEST_p4b_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass123!", "name": "P4 User B", "goal": "student",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    return {"email": email, "token": body["token"], "user": body["user"]}


def hdr(u):
    return {"Authorization": f"Bearer {u['token']}", "Content-Type": "application/json"}


# ---------- regression ----------
def test_root_still_ok(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_tracks_ten(s):
    r = s.get(f"{API}/tracks")
    assert r.status_code == 200
    tracks = r.json()["tracks"]
    assert len(tracks) == 10, f"expected 10 tracks, got {len(tracks)}"


def test_lesson_pid(s):
    r = s.get(f"{API}/lessons/l-pid")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "l-pid"
    assert "title" in data


# ---------- sim/score: first run is a new best ----------
def test_sim_score_first_run_is_new_best(s, user_a):
    # capture initial xp
    me0 = s.get(f"{API}/auth/me", headers=hdr(user_a))
    assert me0.status_code == 200
    xp0 = me0.json()["user"]["xp"]

    r = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "gate-course-1", "time_sec": 42.5, "gates_cleared": 5,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["is_new_best"] is True
    assert data["xpAwarded"] > 0
    assert "best" in data and "time_sec" in data["best"]
    assert data["best"]["time_sec"] == 42.5

    # XP should increase
    me1 = s.get(f"{API}/auth/me", headers=hdr(user_a)).json()["user"]
    assert me1["xp"] == xp0 + data["xpAwarded"], f"xp delta mismatch: {xp0} -> {me1['xp']}, awarded={data['xpAwarded']}"


# ---------- slower run: not a new best, no xp ----------
def test_sim_score_slower_not_new_best(s, user_a):
    me_before = s.get(f"{API}/auth/me", headers=hdr(user_a)).json()["user"]
    r = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "gate-course-1", "time_sec": 60.0, "gates_cleared": 5,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["is_new_best"] is False
    assert data["xpAwarded"] == 0
    assert data["best"]["time_sec"] == 42.5  # previous best
    me_after = s.get(f"{API}/auth/me", headers=hdr(user_a)).json()["user"]
    assert me_after["xp"] == me_before["xp"]


# ---------- faster run: new best, more xp ----------
def test_sim_score_faster_new_best(s, user_a):
    me_before = s.get(f"{API}/auth/me", headers=hdr(user_a)).json()["user"]
    r = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "gate-course-1", "time_sec": 30.0, "gates_cleared": 5,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["is_new_best"] is True
    assert data["xpAwarded"] > 0
    assert data["best"]["time_sec"] == 30.0
    me_after = s.get(f"{API}/auth/me", headers=hdr(user_a)).json()["user"]
    assert me_after["xp"] == me_before["xp"] + data["xpAwarded"]


# ---------- sim/best ----------
def test_sim_best_returns_personal_best(s, user_a):
    r = s.get(f"{API}/sim/best", headers=hdr(user_a))
    assert r.status_code == 200
    data = r.json()
    assert data["best"] is not None
    assert data["best"]["time_sec"] == 30.0
    assert data["best"]["mission"] == "gate-course-1"


def test_sim_best_null_for_fresh_user(s, user_b):
    r = s.get(f"{API}/sim/best", headers=hdr(user_b))
    assert r.status_code == 200
    data = r.json()
    assert data["best"] is None


# ---------- sim/leaderboard ----------
def test_sim_leaderboard_sorted_ascending(s, user_a, user_b):
    # User B posts a slower run
    rb = s.post(f"{API}/sim/score", headers=hdr(user_b), json={
        "mission": "gate-course-1", "time_sec": 75.0, "gates_cleared": 5,
    })
    assert rb.status_code == 200

    r = s.get(f"{API}/sim/leaderboard")
    assert r.status_code == 200
    data = r.json()
    entries = data["entries"]
    assert len(entries) >= 2
    # Validate ascending order
    times = [e["time_sec"] for e in entries]
    assert times == sorted(times), f"leaderboard not ascending: {times}"
    # Validate shape
    for i, e in enumerate(entries):
        assert "rank" in e and "name" in e and "time_sec" in e
        assert e["rank"] == i + 1
    # Top entry should be 30.0 from user_a
    assert entries[0]["time_sec"] == 30.0


# ---------- auth gating ----------
def test_sim_score_requires_auth():
    # Use a fresh session (no cookies) to verify Bearer-less / cookie-less
    fresh = requests.Session()
    r = fresh.post(f"{API}/sim/score", json={
        "mission": "gate-course-1", "time_sec": 40.0, "gates_cleared": 5,
    })
    assert r.status_code in (401, 403)


def test_sim_best_requires_auth():
    fresh = requests.Session()
    r = fresh.get(f"{API}/sim/best")
    assert r.status_code in (401, 403)
