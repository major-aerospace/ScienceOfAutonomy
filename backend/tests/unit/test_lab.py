"""Learning-course contracts, grading, retakes, and instructor data isolation.

Uses an isolated in-memory database. These tests do not certify production Mongo
concurrency or the application's capacity for a particular class size.
"""
import asyncio
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "isolated_review")
os.environ.setdefault("JWT_SECRET", "isolated-test-secret-at-least-32-characters")
import server
import lab
from auth import create_access_token
from lab_content import CONTENT_VERSION, LESSON_KEYS


@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv("ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.setattr(server, "db", AsyncMongoMockClient().lab_test)
    with TestClient(server.app) as client:
        yield client


def account(name="learner", role="user"):
    email = f"{name}@example.com"
    asyncio.run(server.db.users.insert_one({
        "id": name, "name": name.title(), "email": email, "role": role,
        "password_hash": "never-return-this", "xp": 0,
    }))
    return {"Authorization": f"Bearer {create_access_token(name, email)}"}


def attempt(client, headers, answers=None, **extra):
    return client.post("/api/lab/attempts", headers=headers, json={
        "content_version": CONTENT_VERSION,
        "lesson_id": "sense", "answers": [1, 0] if answers is None else answers,
        "presentation": "standard", **extra,
    })


def create_cohort(client, headers, name="Foundations group"):
    response = client.post("/api/lab/cohorts", headers=headers, json={"name": name})
    assert response.status_code == 200, response.text
    return response.json()["cohort"]


@pytest.mark.parametrize("method,path,body", [
    ("get", "/api/lab/me", None),
    ("post", "/api/lab/attempts", {"content_version": CONTENT_VERSION, "lesson_id": "sense", "answers": [1, 0]}),
    ("get", "/api/lab/cohorts", None),
    ("post", "/api/lab/cohorts", {"name": "Class"}),
    ("post", "/api/lab/join", {"code": "ABCDEFGH"}),
    ("get", "/api/lab/cohorts/unknown", None),
    ("patch", "/api/lab/instructors", {"email": "person@example.com"}),
])
def test_all_learning_records_require_authentication(client, method, path, body):
    kwargs = {"json": body} if body is not None else {}
    assert client.request(method, path, **kwargs).status_code == 401


def test_server_grades_and_retakes_keep_best_without_xp(client):
    headers = account()
    result = attempt(client, headers, [0, 2]).json()
    assert result["score"] == 0
    assert result["correct"] == [False, False]
    assert result["completed"] is False
    result = attempt(client, headers).json()
    assert result["score"] == 1
    assert result["completed"] is True
    result = attempt(client, headers, [1, 1]).json()
    assert result["score"] == .5
    assert result["best_score"] == 1
    assert result["completed"] is True
    assert result["attempts"] == 3
    progress = client.get("/api/lab/me", headers=headers).json()["progress"]
    assert len(progress) == 1
    assert progress[0]["attempts"] == 3
    assert progress[0]["latest_score"] == .5
    assert asyncio.run(server.db.users.find_one({"id": "learner"}))["xp"] == 0


@pytest.mark.parametrize("payload", [
    {"answers": []}, {"answers": [1]}, {"answers": [1, 0, 2]},
    {"answers": [-1, 0]}, {"answers": [1, 3]}, {"answers": [True, 0]},
    {"answers": ["1", 0]}, {"answers": [1.0, 0]}, {"lesson_id": "unknown"},
    {"score": 1}, {"user_id": "another"}, {"presentation": "admin"},
    {"content_version": "old-version"}, {"content_version": None},
    {"reflection": "x" * 4001}, {"prediction": "x" * 2001},
    {"experiment": {"noise": -1, "samples": 4}},
    {"experiment": {"noise": 4, "samples": 0}},
    {"experiment": {"noise": 4, "samples": True}},
    {"experiment": {"noise": 4, "samples": 4, "biased": "true"}},
])
def test_invalid_attempts_do_not_create_records(client, payload):
    headers = account()
    response = attempt(client, headers, **payload)
    assert response.status_code == 422, response.text
    assert asyncio.run(server.db.lab_attempts.count_documents({})) == 0


def test_attempt_preserves_versioned_evidence_and_privacy(client):
    first = account("first")
    second = account("second")
    result = attempt(client, first, lesson_id="uncertainty", prediction="Offset remains",
                     reflection="Check against a reference", presentation="advanced",
                     experiment={"noise": 5, "samples": 20, "biased": True})
    assert result.status_code == 200
    row = asyncio.run(server.db.lab_attempts.find_one({}))
    assert row["answers"] == [1, 0]
    assert row["content_version"] == CONTENT_VERSION
    assert row["scoring_version"] == CONTENT_VERSION
    assert row["reflection"] == "Check against a reference"
    assert row["experiment"] == {"noise": 5, "samples": 20, "biased": True}
    assert row["user_id"] == "first"
    assert client.get("/api/lab/me", headers=second).json()["progress"] == []


def test_course_version_does_not_mix_previous_evidence(client):
    headers = account()
    attempt(client, headers)
    asyncio.run(server.db.lab_attempts.update_many({}, {"$set": {"content_version": "old-version"}}))
    assert client.get("/api/lab/me", headers=headers).json()["progress"] == []
    assert attempt(client, headers, [0, 2]).json()["best_score"] == 0


def test_parallel_attempts_are_all_retained(client):
    headers = account()
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(pool.map(lambda index: attempt(client, headers, [1, 0] if index == 0 else [0, 2]), range(8)))
    assert all(response.status_code == 200 for response in responses)
    progress = client.get("/api/lab/me", headers=headers).json()["progress"][0]
    assert progress["attempts"] == 8
    assert progress["best_score"] == 1
    assert progress["completed"] is True


def test_join_is_idempotent_and_does_not_grant_roster_access(client):
    instructor = account("teacher", "instructor")
    learner = account()
    cohort = create_cohort(client, instructor)
    code = " " + cohort["join_code"].lower() + " "
    for _ in range(2):
        response = client.post("/api/lab/join", headers=learner, json={"code": code})
        assert response.status_code == 200
        assert "join_code" not in response.json()["cohort"]
    assert asyncio.run(server.db.lab_memberships.count_documents({})) == 1
    assert client.get("/api/lab/me", headers=learner).json()["cohorts"][0]["id"] == cohort["id"]
    assert client.get("/api/lab/cohorts", headers=learner).status_code == 403
    assert client.get(f"/api/lab/cohorts/{cohort['id']}", headers=learner).status_code == 403
    assert client.post("/api/lab/cohorts", headers=learner, json={"name": "Unauthorized"}).status_code == 403
    assert client.post("/api/lab/join", headers=learner, json={"code": "MISSING"}).status_code == 404


def test_cohort_isolation_and_admin_visibility(client):
    first = account("first", "instructor")
    second = account("second", "instructor")
    admin = account("admin", "admin")
    a = create_cohort(client, first, "First cohort")
    b = create_cohort(client, second, "Second cohort")
    assert client.get(f"/api/lab/cohorts/{a['id']}", headers=second).status_code == 404
    assert client.get(f"/api/lab/cohorts/{b['id']}", headers=first).status_code == 404
    assert [row["id"] for row in client.get("/api/lab/cohorts", headers=first).json()["cohorts"]] == [a["id"]]
    assert len(client.get("/api/lab/cohorts", headers=admin).json()["cohorts"]) == 2
    assert client.get(f"/api/lab/cohorts/{a['id']}", headers=admin).status_code == 200


def test_roster_reports_evidence_not_attempt_count_as_learners(client):
    teacher = account("teacher", "instructor")
    learner = account()
    outsider = account("outsider")
    cohort = create_cohort(client, teacher)
    client.post("/api/lab/join", headers=learner, json={"code": cohort["join_code"]})
    attempt(client, learner, [0, 2])
    attempt(client, learner, [0, 2])
    attempt(client, learner, [1, 2], reflection="Need to observe again")
    attempt(client, outsider, reflection="Private outsider reflection")
    data = client.get(f"/api/lab/cohorts/{cohort['id']}", headers=teacher).json()
    assert len(data["learners"]) == 1
    person = data["learners"][0]
    assert person["total_lessons"] == len(LESSON_KEYS)
    assert person["completed_lessons"] == 0
    assert person["quiz_average"] == 50
    assert person["lesson_records"][0]["attempts"] == 3
    assert person["lesson_records"][0]["reflection"] == "Need to observe again"
    assert len(data["misconceptions"]) == 1
    assert data["misconceptions"][0]["id"] == "sense-1"
    assert data["misconceptions"][0]["count"] == 1
    assert "password_hash" not in str(data)
    assert "Private outsider reflection" not in str(data)
    attempt(client, learner)
    data = client.get(f"/api/lab/cohorts/{cohort['id']}", headers=teacher).json()
    assert data["misconceptions"] == []
    assert data["learners"][0]["completed_lessons"] == 1


def test_only_admin_can_grant_existing_account_instructor_role(client):
    learner = account()
    instructor = account("teacher", "instructor")
    admin = account("admin", "admin")
    body = {"email": "LEARNER@example.com"}
    assert client.patch("/api/lab/instructors", headers=learner, json=body).status_code == 403
    assert client.patch("/api/lab/instructors", headers=instructor, json=body).status_code == 403
    assert client.patch("/api/lab/instructors", headers=admin, json={"email": "absent@example.com"}).status_code == 404
    assert client.patch("/api/lab/instructors", headers=admin, json={"email": "admin@example.com"}).status_code == 409
    assert client.patch("/api/lab/instructors", headers=admin, json={**body, "role": "admin"}).status_code == 422
    response = client.patch("/api/lab/instructors", headers=admin, json=body)
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "instructor"
    assert "password_hash" not in response.text
    assert client.get("/api/lab/cohorts", headers=learner).status_code == 200
    assert asyncio.run(server.db.lab_audit.count_documents({"action": "grant_instructor"})) == 1


def test_cohort_input_cannot_assign_owner_or_change_course(client):
    teacher = account("teacher", "instructor")
    for body in ({"name": "   "}, {"name": "Class", "owner_id": "someone"},
                 {"name": "Class", "assignment_id": "another-course"}):
        assert client.post("/api/lab/cohorts", headers=teacher, json=body).status_code == 422


def test_content_version_is_required_before_grading(client):
    headers = account()
    response = client.post("/api/lab/attempts", headers=headers, json={"lesson_id": "sense", "answers": [1, 0]})
    assert response.status_code == 422
    assert asyncio.run(server.db.lab_attempts.count_documents({})) == 0


def test_attempt_quota_keeps_saved_progress_readable(client, monkeypatch):
    monkeypatch.setattr(lab, "MAX_ATTEMPTS_PER_USER", 2)
    learner = account()
    another = account("another")
    assert attempt(client, learner).status_code == 200
    assert attempt(client, learner, [0, 2]).status_code == 200
    response = attempt(client, learner)
    assert response.status_code == 409
    assert "limit reached" in response.json()["detail"]
    progress = client.get("/api/lab/me", headers=learner).json()["progress"]
    assert progress[0]["attempts"] == 2
    assert progress[0]["completed"] is True
    assert attempt(client, another).status_code == 200


def test_cohort_limit_rejects_new_members_but_existing_join_is_idempotent(client, monkeypatch):
    monkeypatch.setattr(lab, "MAX_COHORT_MEMBERS", 1)
    teacher = account("teacher", "instructor")
    first = account("first")
    second = account("second")
    cohort = create_cohort(client, teacher)
    payload = {"code": cohort["join_code"]}
    assert client.post("/api/lab/join", headers=first, json=payload).status_code == 200
    assert client.post("/api/lab/join", headers=second, json=payload).status_code == 409
    assert client.post("/api/lab/join", headers=first, json=payload).status_code == 200
    roster = client.get(f"/api/lab/cohorts/{cohort['id']}", headers=teacher).json()
    assert roster["cohort"]["member_count"] == 1


def test_progress_aggregation_returns_latest_notes_and_full_counts(client):
    headers = account()
    assert attempt(client, headers, reflection="Original note").status_code == 200
    initial = asyncio.run(server.db.lab_attempts.find_one({}, {"_id": 0}))
    more = [{
        **initial, "id": f"later-{index:04d}", "created_at": f"2099-01-01T00:{index // 60:02d}:{index % 60:02d}+00:00",
        "score": 0, "correct": [False, False], "reflection": f"Note {index}",
    } for index in range(100)]
    asyncio.run(server.db.lab_attempts.insert_many(more))
    progress = client.get("/api/lab/me", headers=headers).json()["progress"]
    assert len(progress) == 1
    assert progress[0]["attempts"] == 101
    assert progress[0]["best_score"] == 1
    assert progress[0]["latest_score"] == 0
    assert progress[0]["reflection"] == "Note 99"
