"""Phase 5 — Mission catalog + Psychomotor wiring tests.

Covers:
  * GET /api/sim/missions returns 4 missions with required fields
  * POST /api/sim/score per-mission gate validation (precision-hover, pylon-slalom, no-gps-landing)
  * GET /api/sim/best?mission=... is mission-specific
  * GET /api/sim/leaderboard?mission=... is mission-specific
  * GET /api/sim/psychomotor aggregates correctly (0 when none, > 0.5 after fast gate-course-1 run)
  * Regression: /api/, /api/tracks, /api/lessons/l-pid
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

REQUIRED_MISSIONS = {"gate-course-1", "precision-hover", "pylon-slalom", "no-gps-landing"}


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _register(s, tag):
    email = f"TEST_p5{tag}_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass123!", "name": f"P5 {tag}", "goal": "student",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    return {"email": email, "token": body["token"]}


@pytest.fixture(scope="module")
def user_a(s):
    return _register(s, "a")


@pytest.fixture(scope="module")
def user_b(s):
    return _register(s, "b")


@pytest.fixture(scope="module")
def user_fresh(s):
    return _register(s, "fresh")


def hdr(u):
    return {"Authorization": f"Bearer {u['token']}", "Content-Type": "application/json"}


# ---------------- regression ----------------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_tracks(s):
    r = s.get(f"{API}/tracks")
    assert r.status_code == 200
    assert isinstance(r.json()["tracks"], list)
    assert len(r.json()["tracks"]) >= 1


def test_lesson_pid(s):
    r = s.get(f"{API}/lessons/l-pid")
    assert r.status_code == 200
    assert r.json()["id"] == "l-pid"


# ---------------- /api/sim/missions ----------------
def test_sim_missions_catalog(s):
    r = s.get(f"{API}/sim/missions")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "missions" in data
    ids = {m["id"] for m in data["missions"]}
    assert REQUIRED_MISSIONS.issubset(ids), f"missing missions: {REQUIRED_MISSIONS - ids}"
    for m in data["missions"]:
        # name, gates, min_time, max_time
        assert "name" in m and isinstance(m["name"], str)
        assert "gates" in m and isinstance(m["gates"], int)
        assert "min_time" in m and isinstance(m["min_time"], (int, float))
        assert "max_time" in m and isinstance(m["max_time"], (int, float))


# ---------------- precision-hover ----------------
def test_precision_hover_requires_1_gate(s, user_a):
    # 0 gates -> 400
    r0 = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "precision-hover", "time_sec": 12.0, "gates_cleared": 0,
    })
    assert r0.status_code == 400, r0.text

    # 1 gate, time_sec=12 (>= min 8) -> 200
    r1 = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "precision-hover", "time_sec": 12.0, "gates_cleared": 1,
    })
    assert r1.status_code == 200, r1.text
    data = r1.json()
    assert data["is_new_best"] is True
    assert data["best"]["time_sec"] == 12.0


# ---------------- pylon-slalom ----------------
def test_pylon_slalom_requires_6_gates(s, user_a):
    r5 = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "pylon-slalom", "time_sec": 30.0, "gates_cleared": 5,
    })
    assert r5.status_code == 400, r5.text

    r6 = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "pylon-slalom", "time_sec": 30.0, "gates_cleared": 6,
    })
    assert r6.status_code == 200, r6.text
    assert r6.json()["best"]["time_sec"] == 30.0


# ---------------- no-gps-landing ----------------
def test_no_gps_landing_requires_1_gate_and_min_time(s, user_a):
    # gates 0 -> 400
    r0 = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "no-gps-landing", "time_sec": 20.0, "gates_cleared": 0,
    })
    assert r0.status_code == 400

    # time_sec < 5 -> 400
    rfast = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "no-gps-landing", "time_sec": 3.0, "gates_cleared": 1,
    })
    assert rfast.status_code == 400, rfast.text

    # ok
    rok = s.post(f"{API}/sim/score", headers=hdr(user_a), json={
        "mission": "no-gps-landing", "time_sec": 20.0, "gates_cleared": 1,
    })
    assert rok.status_code == 200, rok.text
    assert rok.json()["best"]["time_sec"] == 20.0


# ---------------- /api/sim/best mission-specific ----------------
def test_sim_best_mission_specific(s, user_a):
    r = s.get(f"{API}/sim/best?mission=precision-hover", headers=hdr(user_a))
    assert r.status_code == 200
    data = r.json()
    assert data["best"] is not None
    assert data["best"]["mission"] == "precision-hover"
    assert data["best"]["time_sec"] == 12.0

    r2 = s.get(f"{API}/sim/best?mission=pylon-slalom", headers=hdr(user_a))
    assert r2.json()["best"]["mission"] == "pylon-slalom"
    assert r2.json()["best"]["time_sec"] == 30.0


# ---------------- /api/sim/leaderboard mission-specific ----------------
def test_sim_leaderboard_mission_specific(s, user_a, user_b):
    # user_b posts on pylon-slalom only
    rb = s.post(f"{API}/sim/score", headers=hdr(user_b), json={
        "mission": "pylon-slalom", "time_sec": 50.0, "gates_cleared": 6,
    })
    assert rb.status_code == 200

    r = s.get(f"{API}/sim/leaderboard?mission=pylon-slalom")
    assert r.status_code == 200
    data = r.json()
    assert data["mission"] == "pylon-slalom"
    times = [e["time_sec"] for e in data["entries"]]
    assert times == sorted(times)
    assert data["entries"][0]["time_sec"] == 30.0  # user_a leads

    # precision-hover leaderboard should NOT include user_b (didn't post there)
    r2 = s.get(f"{API}/sim/leaderboard?mission=precision-hover")
    assert r2.status_code == 200
    entries2 = r2.json()["entries"]
    # user_a posted 12s on precision-hover -> should be present
    assert any(e["time_sec"] == 12.0 for e in entries2)


# ---------------- /api/sim/psychomotor ----------------
def test_psychomotor_zero_when_no_runs(s, user_fresh):
    r = s.get(f"{API}/sim/psychomotor", headers=hdr(user_fresh))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["score"] == 0.0
    assert data["missions_completed"] == 0
    assert data["details"] == []


def test_psychomotor_high_after_fast_gate_course(s, user_fresh):
    # Post a fast run (30s vs max 90s) on gate-course-1
    rp = s.post(f"{API}/sim/score", headers=hdr(user_fresh), json={
        "mission": "gate-course-1", "time_sec": 30.0, "gates_cleared": 5,
    })
    assert rp.status_code == 200, rp.text

    r = s.get(f"{API}/sim/psychomotor", headers=hdr(user_fresh))
    assert r.status_code == 200
    data = r.json()
    # (90-30)/90 = 0.667; breadth bonus 0.025 -> > 0.5
    assert data["score"] > 0.5, f"expected > 0.5, got {data['score']}"
    assert data["missions_completed"] == 1
    assert len(data["details"]) == 1
    d0 = data["details"][0]
    assert d0["mission"] == "gate-course-1"
    assert d0["best"] == 30.0
    assert 0.0 <= d0["score"] <= 1.0


def test_psychomotor_requires_auth(s):
    fresh = requests.Session()
    r = fresh.get(f"{API}/sim/psychomotor")
    assert r.status_code in (401, 403)
