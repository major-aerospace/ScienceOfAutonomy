"""Launch hardening — password sign-in lockout and admin account safety."""
import os
import uuid

import pytest
import requests

BASE_URL = (os.environ.get("BACKEND_URL") or os.environ.get("REACT_APP_BACKEND_URL") or "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

MAX_FAILURES = 10  # keep in sync with LOGIN_MAX_FAILURES in server.py


def _register():
    email = f"TEST_lock_{uuid.uuid4().hex[:10]}@example.com"
    password = f"Pw-{uuid.uuid4().hex}"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": password, "name": "Lock Test"})
    assert r.status_code == 200, r.text
    return email, password


def test_wrong_password_is_401():
    email, _ = _register()
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": "definitely-wrong"})
    assert r.status_code == 401


def test_successful_login_resets_failure_count():
    email, password = _register()
    for _ in range(MAX_FAILURES - 1):
        assert requests.post(f"{API}/auth/login", json={"email": email, "password": "nope"}).status_code == 401
    assert requests.post(f"{API}/auth/login", json={"email": email, "password": password}).status_code == 200
    # Counter was cleared, so the next wrong password is a plain 401 again, not a lock.
    for _ in range(MAX_FAILURES - 1):
        assert requests.post(f"{API}/auth/login", json={"email": email, "password": "nope"}).status_code == 401


def test_lockout_after_repeated_failures():
    email, password = _register()
    for i in range(MAX_FAILURES):
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": f"wrong-{i}"})
        assert r.status_code == 401, (i, r.text)
    # Locked now — even the correct password is refused until the lock expires.
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 429
    assert "try again" in r.json()["detail"].lower()
    assert "token" not in r.json()


def test_lockout_is_per_email():
    locked_email, _ = _register()
    for i in range(MAX_FAILURES):
        requests.post(f"{API}/auth/login", json={"email": locked_email, "password": f"wrong-{i}"})
    other_email, other_password = _register()
    r = requests.post(f"{API}/auth/login", json={"email": other_email, "password": other_password})
    assert r.status_code == 200


def test_register_cannot_grant_admin_role():
    email = f"TEST_role_{uuid.uuid4().hex[:10]}@example.com"
    r = requests.post(
        f"{API}/auth/register",
        json={"email": email, "password": "Pw-ok-123456", "name": "Sneaky", "role": "admin"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "user"
    token = r.json()["token"]
    r = requests.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


@pytest.mark.parametrize("email,password", [
    ("admin@example.com", "admin123"),  # the old built-in default
])
def test_no_default_admin_account(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code in (401, 429)
