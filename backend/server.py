"""Science of Autonomy — FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import csv
import io
import math
import time
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from google.auth import exceptions as google_auth_exceptions

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
)
from seed_data import TRACKS, LESSONS, all_lessons_list
from glossary import GLOSSARY, search_glossary
from badges import BADGES, BADGE_MAP, evaluate_badges

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------------------
# Config — fail fast on unsafe settings
# --------------------------------------------------------------------------------------
if len(os.environ.get("JWT_SECRET", "")) < 32:
    raise RuntimeError(
        "JWT_SECRET is missing or shorter than 32 characters. Set it to a long random value, e.g. "
        "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
    )

# Google OAuth "Web application" client ID(s), comma-separated. Empty = Google sign-in off.
GOOGLE_CLIENT_IDS = [c.strip() for c in os.environ.get("GOOGLE_CLIENT_ID", "").split(",") if c.strip()]

# Admin account is created/updated from env at startup — there is deliberately no default.
MIN_ADMIN_PASSWORD_LENGTH = 12

# Sign-in throttling: after this many wrong passwords for one email inside the window,
# that email is locked for LOGIN_LOCK_SECONDS.
LOGIN_MAX_FAILURES = 10
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_LOCK_SECONDS = 15 * 60

# --------------------------------------------------------------------------------------
# DB
# --------------------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


# --------------------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    goal: Optional[Literal["curious", "student", "operator", "professional"]] = "curious"


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class CompleteLessonBody(BaseModel):
    lesson_id: str
    score: float = 0.0


class GoalUpdate(BaseModel):
    goal: Literal["curious", "student", "operator", "professional"]


class AssessmentSubmit(BaseModel):
    # 0..1 normalized scores
    perceptual_spatial: float
    attentional: float
    psychomotor: float
    higher_order: float
    dispositional: float
    trainability_slope: float  # improvement delta, -1..1


class ReviewAnswerBody(BaseModel):
    review_id: str
    correct: bool


class TierUpdate(BaseModel):
    tier: Literal["eli12", "standard", "deep"]


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class AdminLessonCreate(BaseModel):
    id: str = Field(min_length=3, max_length=80)
    title: str = Field(min_length=2, max_length=120)
    summary: str = Field(min_length=2, max_length=300)
    trackId: str
    moduleId: str
    estMinutes: int = 5
    blocks: List[dict]
    quiz: List[dict] = []
    socialClip: Optional[dict] = None


class SimScore(BaseModel):
    mission: str
    time_sec: float = Field(gt=0)
    gates_cleared: int = Field(ge=0)


class LessonPatch(BaseModel):
    """Editable fields for any lesson (seed or custom). All optional."""
    title: Optional[str] = None
    summary: Optional[str] = None
    estMinutes: Optional[int] = None
    blocks: Optional[List[dict]] = None
    quiz: Optional[List[dict]] = None
    socialClip: Optional[dict] = None


class GoogleCredentialBody(BaseModel):
    # The ID token ("credential") returned to the browser by Google Identity Services.
    credential: str = Field(min_length=20, max_length=8192)


# --------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------
def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "goal": u.get("goal", "curious"),
        "xp": u.get("xp", 0),
        "level": u.get("level", 1),
        "streak": u.get("streak", 0),
        "badges": u.get("badges", []),
        "tier": u.get("tier", "standard"),
        "role": u.get("role", "user"),
    }


def xp_to_level(xp: int) -> int:
    # simple curve: 100 XP per level, grows slowly
    return 1 + int(xp ** 0.5 / 5)


async def _custom_lessons_map():
    rows = await db.custom_lessons.find({}, {"_id": 0}).to_list(2000)
    return {r["id"]: r for r in rows}


async def _apply_override(lesson: dict) -> dict:
    """Merge any admin override on top of a lesson dict (seed or custom)."""
    if not lesson:
        return lesson
    ov = await db.lesson_overrides.find_one({"id": lesson["id"]}, {"_id": 0})
    if not ov:
        return lesson
    merged = {**lesson}
    for k in ("title", "summary", "estMinutes", "blocks", "quiz", "socialClip"):
        if k in ov and ov[k] is not None:
            merged[k] = ov[k]
    merged["edited"] = True
    return merged


async def _resolve_lesson(lesson_id: str):
    base = LESSONS.get(lesson_id)
    if base is None:
        base = await db.custom_lessons.find_one({"id": lesson_id}, {"_id": 0})
    return await _apply_override(base) if base else None


async def _grant_badges(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        return []
    rows = await db.progress.find({"user_id": user_id, "completed": True}).to_list(2000)
    completed = {r["lesson_id"] for r in rows}
    has_assess = await db.assessments.count_documents({"user_id": user_id}) > 0
    earned = evaluate_badges(user, completed, TRACKS, has_assess)
    current = set(user.get("badges", []))
    new_badges = list(earned - current)
    if new_badges:
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"badges": list(earned)}},
        )
    return new_badges


# --------------------------------------------------------------------------------------
# App + Router
# --------------------------------------------------------------------------------------
app = FastAPI(title="Science of Autonomy API")
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"app": "Science of Autonomy", "status": "ok"}


# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid,
        "email": email,
        "name": body.name.strip(),
        "password_hash": hash_password(body.password),
        "goal": body.goal or "curious",
        "xp": 0,
        "level": 1,
        "streak": 0,
        "badges": [],
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(uid, email)
    set_auth_cookie(response, token)
    return {"user": public_user(user_doc), "token": token}


async def _login_lock_remaining(email: str) -> int:
    """Seconds until this email may try a password again (0 = not locked)."""
    doc = await db.login_attempts.find_one({"email": email}, {"_id": 0})
    if not doc:
        return 0
    remaining = (doc.get("locked_until") or 0) - time.time()
    return math.ceil(remaining) if remaining > 0 else 0


async def _record_login_failure(email: str) -> None:
    now = time.time()
    doc = await db.login_attempts.find_one({"email": email}, {"_id": 0})
    if not doc or now - (doc.get("window_start") or 0) > LOGIN_WINDOW_SECONDS:
        failures, window_start = 1, now
    else:
        failures, window_start = (doc.get("failures") or 0) + 1, doc["window_start"]
    update = {
        "failures": failures,
        "window_start": window_start,
        "locked_until": 0,
        # TTL index clears stale rows on its own.
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=LOGIN_WINDOW_SECONDS + LOGIN_LOCK_SECONDS),
    }
    if failures >= LOGIN_MAX_FAILURES:
        update["locked_until"] = now + LOGIN_LOCK_SECONDS
        logger.warning("Password sign-in locked for %s after %d failed attempts", email, failures)
    await db.login_attempts.update_one({"email": email}, {"$set": update}, upsert=True)


@api.post("/auth/login")
async def login(body: LoginBody, response: Response):
    email = body.email.lower().strip()
    wait = await _login_lock_remaining(email)
    if wait:
        minutes = max(1, math.ceil(wait / 60))
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed sign-in attempts. Try again in {minutes} minute{'s' if minutes > 1 else ''}.",
        )
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        await _record_login_failure(email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"email": email})
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"user": public_user(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


# Google sign-in (Google Identity Services).
# The browser receives a Google-signed ID token ("credential") and posts it here. We verify
# its signature, audience (our client ID), issuer and expiry, then find-or-create the user
# and issue our own JWT — the same token the rest of the app already uses.
def _verify_google_credential(credential: str) -> dict:
    return google_id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        GOOGLE_CLIENT_IDS,
        clock_skew_in_seconds=10,
    )


@api.post("/auth/google")
async def google_sign_in(body: GoogleCredentialBody, response: Response):
    if not GOOGLE_CLIENT_IDS:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on this server")
    if body.credential.count(".") != 2:  # not a JWT at all — don't bother asking Google
        raise HTTPException(status_code=401, detail="Google sign-in could not be verified. Please try again.")
    try:
        payload = await asyncio.to_thread(_verify_google_credential, body.credential)
    except google_auth_exceptions.TransportError as e:
        logger.warning("Could not fetch Google signing keys: %s", e)
        raise HTTPException(status_code=502, detail="Could not reach Google to verify sign-in. Please try again.")
    except (ValueError, google_auth_exceptions.GoogleAuthError):
        raise HTTPException(status_code=401, detail="Google sign-in could not be verified. Please try again.")

    email = (payload.get("email") or "").lower().strip()
    if not email or payload.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Your Google account's email address is not verified.")
    name = (payload.get("name") or "").strip()[:80] or email.split("@")[0]
    picture = payload.get("picture", "")
    now = datetime.now(timezone.utc).isoformat()

    existing = await db.users.find_one({"email": email})
    if existing:
        # Link Google to the existing account (Google has verified the email); never duplicate.
        providers = existing.get("auth_provider") or "password"
        if "google" not in providers.split(","):
            providers = f"{providers},google"
        await db.users.update_one(
            {"id": existing["id"]},
            {"$set": {
                "auth_provider": providers,
                "google_sub": payload.get("sub"),
                "google_picture": picture,
                "last_login_at": now,
            }},
        )
        user_doc = await db.users.find_one({"id": existing["id"]})
    else:
        user_doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "password_hash": "",  # no password; Google-only account
            "goal": "curious",
            "xp": 0,
            "level": 1,
            "streak": 0,
            "badges": [],
            "role": "user",
            "auth_provider": "google",
            "google_sub": payload.get("sub"),
            "google_picture": picture,
            "created_at": now,
            "last_login_at": now,
        }
        await db.users.insert_one(user_doc)

    token = create_access_token(user_doc["id"], user_doc["email"])
    set_auth_cookie(response, token)
    return {"user": public_user(user_doc), "token": token, "isNewUser": existing is None}


@api.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request, db)
    return {"user": public_user(user)}


@api.patch("/auth/goal")
async def set_goal(body: GoalUpdate, request: Request):
    user = await get_current_user(request, db)
    await db.users.update_one({"id": user["id"]}, {"$set": {"goal": body.goal}})
    user["goal"] = body.goal
    return {"user": public_user(user)}


# ---------- Curriculum ----------
@api.get("/tracks")
async def list_tracks():
    # Enrich with lesson counts and (if authenticated) progress
    enriched = []
    for t in TRACKS:
        lesson_ids = [lid for m in t["modules"] for lid in m["lessons"]]
        enriched.append({
            "id": t["id"],
            "order": t["order"],
            "title": t["title"],
            "summary": t["summary"],
            "color": t["color"],
            "lessonCount": len(lesson_ids),
            "moduleCount": len(t["modules"]),
        })
    return {"tracks": enriched}


@api.get("/tracks/{track_id}")
async def get_track(track_id: str, request: Request):
    track = next((t for t in TRACKS if t["id"] == track_id), None)
    if not track:
        raise HTTPException(404, "Track not found")
    user = await get_optional_user(request, db)
    completed = set()
    if user:
        rows = await db.progress.find({"user_id": user["id"]}).to_list(2000)
        completed = {r["lesson_id"] for r in rows if r.get("completed")}
    custom_map = await _custom_lessons_map()
    overrides = {r["id"]: r for r in await db.lesson_overrides.find({}, {"_id": 0}).to_list(5000)}
    modules = []
    for m in track["modules"]:
        # Seed lessons in the module
        lesson_ids = list(m["lessons"])
        # Plus any admin-added custom lessons attached to this module
        for cid, cl in custom_map.items():
            if cl.get("moduleId") == m["id"] and cid not in lesson_ids:
                lesson_ids.append(cid)
        ls = []
        for lid in lesson_ids:
            l = LESSONS.get(lid) or custom_map.get(lid)
            if not l:
                continue
            ov = overrides.get(lid, {})
            ls.append({
                "id": l["id"],
                "title": ov.get("title") or l["title"],
                "summary": ov.get("summary") or l["summary"],
                "estMinutes": ov.get("estMinutes") or l.get("estMinutes", 5),
                "order": l.get("order", 99),
                "completed": lid in completed,
                "custom": lid in custom_map,
                "edited": lid in overrides,
            })
        ls.sort(key=lambda x: x.get("order", 99))
        modules.append({"id": m["id"], "order": m["order"], "title": m["title"], "lessons": ls})
    return {
        "id": track["id"],
        "title": track["title"],
        "summary": track["summary"],
        "color": track["color"],
        "modules": modules,
    }


@api.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    l = await _resolve_lesson(lesson_id)
    if not l:
        raise HTTPException(404, "Lesson not found")
    # next + prev within the track (seed + custom)
    track_id = l["trackId"]
    track = next((t for t in TRACKS if t["id"] == track_id), None)
    seq = []
    if track:
        custom_map = await _custom_lessons_map()
        for m in track["modules"]:
            mod_ids = list(m["lessons"])
            for cid, cl in custom_map.items():
                if cl.get("moduleId") == m["id"] and cid not in mod_ids:
                    mod_ids.append(cid)
            # Sort by order
            mod_ids.sort(key=lambda lid: (LESSONS.get(lid) or custom_map.get(lid, {})).get("order", 99))
            seq.extend(mod_ids)
    idx = seq.index(lesson_id) if lesson_id in seq else -1
    prev_id = seq[idx - 1] if idx > 0 else None
    next_id = seq[idx + 1] if 0 <= idx < len(seq) - 1 else None
    return {**l, "prevLessonId": prev_id, "nextLessonId": next_id}


# ---------- Progress ----------
@api.post("/progress/complete")
async def complete_lesson(body: CompleteLessonBody, request: Request):
    user = await get_current_user(request, db)
    l = await _resolve_lesson(body.lesson_id)
    if not l:
        raise HTTPException(404, "Lesson not found")

    existing = await db.progress.find_one({"user_id": user["id"], "lesson_id": body.lesson_id})
    awarded = 0
    new_badges: list = []
    if not existing:
        awarded = 25 + int(body.score * 15)  # base + quiz bonus
        await db.progress.insert_one({
            "user_id": user["id"],
            "lesson_id": body.lesson_id,
            "completed": True,
            "score": body.score,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        # update user xp / streak
        today = datetime.now(timezone.utc).date().isoformat()
        last = user.get("last_active_day")
        streak = user.get("streak", 0)
        if last is None or last != today:
            streak = streak + 1 if last else 1
        new_xp = user.get("xp", 0) + awarded
        new_level = xp_to_level(new_xp)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"xp": new_xp, "level": new_level, "streak": streak, "last_active_day": today}},
        )
        # Spaced-repetition: if user missed any question, schedule a review.
        # We schedule the FIRST review slightly in the past so users see immediate
        # feedback on the dashboard "Spaced Repetition" card right after the lesson.
        if body.score < 1.0:
            await db.reviews.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "lesson_id": body.lesson_id,
                "ease": 1,  # interval index
                "next_review_at": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        new_badges = await _grant_badges(user["id"])
    return {"ok": True, "xpAwarded": awarded, "newBadges": new_badges}


@api.get("/progress")
async def get_progress(request: Request):
    user = await get_current_user(request, db)
    rows = await db.progress.find({"user_id": user["id"]}, {"_id": 0}).to_list(2000)
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return {"progress": rows, "user": public_user(fresh)}


# ---------- Adaptive learning ----------
def _track_lesson_sequence(track):
    return [lid for m in track["modules"] for lid in m["lessons"]]


@api.get("/recommend/next")
async def recommend_next(request: Request):
    user = await get_optional_user(request, db)
    # Default: first lesson of first track
    default = LESSONS[TRACKS[0]["modules"][0]["lessons"][0]]
    if not user:
        return {"lesson": _public_lesson(default), "reason": "Start with the foundations."}
    rows = await db.progress.find({"user_id": user["id"]}).to_list(2000)
    completed = {r["lesson_id"] for r in rows if r.get("completed")}
    # Build flat order across all tracks
    flat = []
    for t in sorted(TRACKS, key=lambda x: x["order"]):
        flat.extend(_track_lesson_sequence(t))
    # Find first not completed
    for lid in flat:
        if lid not in completed:
            l = LESSONS[lid]
            # If last completed lesson had a low score, suggest reviewing (recommend same)
            last = max(rows, key=lambda r: r.get("completed_at", ""), default=None) if rows else None
            if last and last.get("score", 1.0) < 0.5:
                review_lesson = LESSONS.get(last["lesson_id"], l)
                return {"lesson": _public_lesson(review_lesson), "reason": "Your last quiz was rough — let's revisit this one first."}
            return {"lesson": _public_lesson(l), "reason": "Picking up where you left off."}
    return {"lesson": None, "reason": "You've completed everything published. New tracks coming soon."}


def _public_lesson(l):
    return {"id": l["id"], "title": l["title"], "summary": l["summary"], "trackId": l["trackId"], "estMinutes": l["estMinutes"]}


# ---------- Review queue (spaced repetition) ----------
SR_INTERVALS_DAYS = [1, 3, 7, 14, 30]


@api.get("/review/queue")
async def review_queue(request: Request):
    user = await get_current_user(request, db)
    now_iso = datetime.now(timezone.utc).isoformat()
    rows = await db.reviews.find(
        {"user_id": user["id"], "next_review_at": {"$lte": now_iso}},
        {"_id": 0},
    ).sort("next_review_at", 1).to_list(50)
    enriched = []
    for r in rows:
        l = LESSONS.get(r["lesson_id"])
        if not l:
            continue
        enriched.append({
            **r,
            "lesson": {"id": l["id"], "title": l["title"], "trackId": l["trackId"], "summary": l["summary"]},
            # Pick a sample question for quick recall
            "sample_question": l["quiz"][0] if l.get("quiz") else None,
        })
    return {"items": enriched, "count": len(enriched)}


@api.post("/review/answer")
async def review_answer(body: ReviewAnswerBody, request: Request):
    user = await get_current_user(request, db)
    item = await db.reviews.find_one({"id": body.review_id, "user_id": user["id"]})
    if not item:
        raise HTTPException(404, "Review item not found")
    if body.correct:
        new_ease = min(item.get("ease", 1) + 1, len(SR_INTERVALS_DAYS))
        if new_ease >= len(SR_INTERVALS_DAYS):
            # Graduate — remove from review queue
            await db.reviews.delete_one({"id": body.review_id})
            return {"ok": True, "graduated": True}
        days = SR_INTERVALS_DAYS[new_ease - 1]
        next_iso = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
        await db.reviews.update_one(
            {"id": body.review_id},
            {"$set": {"ease": new_ease, "next_review_at": next_iso, "last_answered_at": datetime.now(timezone.utc).isoformat()}},
        )
        return {"ok": True, "graduated": False, "next_in_days": days}
    else:
        # Reset to interval 1
        next_iso = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        await db.reviews.update_one(
            {"id": body.review_id},
            {"$set": {"ease": 1, "next_review_at": next_iso, "last_answered_at": datetime.now(timezone.utc).isoformat()}},
        )
        return {"ok": True, "graduated": False, "next_in_days": 1}


# ---------- Assessment ----------
@api.post("/assessment/submit")
async def submit_assessment(body: AssessmentSubmit, request: Request):
    user = await get_current_user(request, db)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "taken_at": datetime.now(timezone.utc).isoformat(),
        "perceptual_spatial": body.perceptual_spatial,
        "attentional": body.attentional,
        "psychomotor": body.psychomotor,
        "higher_order": body.higher_order,
        "dispositional": body.dispositional,
        "trainability_slope": body.trainability_slope,
    }
    await db.assessments.insert_one(doc)
    rec = _recommend_track(body)
    await _grant_badges(user["id"])
    return {"result": {k: v for k, v in doc.items() if k != "_id"}, "recommendedTrack": rec}


def _recommend_track(b: AssessmentSubmit) -> dict:
    scores = {
        "perceptual_spatial": b.perceptual_spatial,
        "attentional": b.attentional,
        "psychomotor": b.psychomotor,
        "higher_order": b.higher_order,
        "dispositional": b.dispositional,
    }
    weakest = min(scores, key=scores.get)
    mapping = {
        "perceptual_spatial": ("track-foundations", "Build perspective and spatial intuition first."),
        "attentional": ("track-gnc", "Train sustained attention with control-loop drills."),
        "psychomotor": ("track-foundations", "Start with rotor and stability fundamentals."),
        "higher_order": ("track-anatomy", "Anchor knowledge in real component reasoning."),
        "dispositional": ("track-foundations", "Build confidence with bite-sized first wins."),
    }
    tid, reason = mapping[weakest]
    track = next((t for t in TRACKS if t["id"] == tid), None)
    return {
        "trackId": tid,
        "title": track["title"] if track else tid,
        "reason": reason,
        "weakestDomain": weakest,
    }


@api.get("/assessment/me")
async def my_assessments(request: Request):
    user = await get_current_user(request, db)
    rows = await db.assessments.find({"user_id": user["id"]}, {"_id": 0}).sort("taken_at", -1).to_list(50)
    return {"results": rows}


# ---------- Content Studio ----------
@api.get("/studio/social-clips")
async def list_social_clips():
    items = []
    for l in all_lessons_list():
        items.append({
            "lessonId": l["id"],
            "lessonTitle": l["title"],
            "trackId": l["trackId"],
            "clip": l["socialClip"],
        })
    return {"items": items}


@api.get("/studio/calendar.csv")
async def calendar_csv(weeks: int = 4, trackId: Optional[str] = None):
    weeks = max(1, min(weeks, 12))
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["week", "day", "lessonId", "title", "trackId", "hook", "coreIdea", "takeaway", "hashtags"])
    pool = [l for l in all_lessons_list() if (not trackId or l["trackId"] == trackId)]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    target = weeks * len(days)
    selected = pool[:target] if len(pool) >= target else (pool * ((target // max(1, len(pool))) + 1))[:target]
    for i, l in enumerate(selected):
        week = (i // len(days)) + 1
        day = days[i % len(days)]
        c = l["socialClip"]
        w.writerow([
            f"W{week}", day, l["id"], l["title"], l["trackId"],
            c["hook"], c["coreIdea"], c["takeaway"], " ".join(c["hashtags"])
        ])
    filename = f"content_calendar_{weeks}w{('_' + trackId) if trackId else ''}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# --------------------------------------------------------------------------------------
# User tier preference
# --------------------------------------------------------------------------------------
@api.patch("/auth/tier")
async def set_tier(body: TierUpdate, request: Request):
    user = await get_current_user(request, db)
    await db.users.update_one({"id": user["id"]}, {"$set": {"tier": body.tier}})
    user["tier"] = body.tier
    return {"user": public_user(user)}


# --------------------------------------------------------------------------------------
# Badges
# --------------------------------------------------------------------------------------
@api.get("/badges/catalog")
async def badges_catalog():
    return {"badges": BADGES}


@api.get("/badges/me")
async def my_badges(request: Request):
    user = await get_current_user(request, db)
    earned = set(user.get("badges", []))
    enriched = [{**b, "earned": b["id"] in earned} for b in BADGES]
    return {"badges": enriched, "earnedCount": len(earned), "totalCount": len(BADGES)}


# --------------------------------------------------------------------------------------
# Leaderboard
# --------------------------------------------------------------------------------------
@api.get("/leaderboard")
async def leaderboard(metric: str = "xp", limit: int = 20):
    if metric not in ("xp", "streak"):
        raise HTTPException(400, "metric must be xp or streak")
    rows = await db.users.find(
        {metric: {"$gt": 0}},
        {"_id": 0, "name": 1, "xp": 1, "level": 1, "streak": 1, "badges": 1},
    ).sort(metric, -1).limit(limit).to_list(limit)
    return {
        "metric": metric,
        "entries": [
            {"rank": i + 1, "name": r.get("name", "Anonymous"),
             "xp": r.get("xp", 0), "level": r.get("level", 1),
             "streak": r.get("streak", 0), "badges": len(r.get("badges", []))}
            for i, r in enumerate(rows)
        ],
    }


# --------------------------------------------------------------------------------------
# Certificates
# --------------------------------------------------------------------------------------
@api.get("/certificates/{track_id}")
async def certificate(track_id: str, request: Request):
    user = await get_current_user(request, db)
    track = next((t for t in TRACKS if t["id"] == track_id), None)
    if not track:
        raise HTTPException(404, "Track not found")
    track_lessons = {lid for m in track["modules"] for lid in m["lessons"]}
    rows = await db.progress.find({"user_id": user["id"]}).to_list(2000)
    completed = {r["lesson_id"] for r in rows if r.get("completed")}
    eligible = track_lessons.issubset(completed)
    if not eligible:
        return {
            "eligible": False,
            "completedCount": len(track_lessons & completed),
            "totalCount": len(track_lessons),
            "track": {"id": track["id"], "title": track["title"]},
        }
    # Award date = max completed_at across track lessons
    track_rows = [r for r in rows if r["lesson_id"] in track_lessons]
    award_date = max(r.get("completed_at", "") for r in track_rows) if track_rows else datetime.now(timezone.utc).isoformat()
    cert_id = f"SOA-{track['id'].split('-')[-1].upper()}-{user['id'][:8].upper()}"
    return {
        "eligible": True,
        "cert_id": cert_id,
        "user_name": user["name"],
        "track": {"id": track["id"], "title": track["title"], "summary": track["summary"]},
        "awarded_at": award_date,
    }


# --------------------------------------------------------------------------------------
# Glossary + Search
# --------------------------------------------------------------------------------------
@api.get("/glossary")
async def glossary(q: str = ""):
    return {"terms": search_glossary(q, limit=len(GLOSSARY))}


@api.get("/search")
async def search(q: str = "", limit: int = 12):
    """Global search across lessons, tracks and glossary."""
    if not q or len(q.strip()) < 2:
        return {"lessons": [], "tracks": [], "glossary": []}
    q_low = q.lower().strip()
    lessons = []
    for lid, l in LESSONS.items():
        if q_low in l["title"].lower() or q_low in l["summary"].lower():
            lessons.append({"id": l["id"], "title": l["title"], "trackId": l["trackId"], "summary": l["summary"]})
    # Custom lessons
    for cl in (await db.custom_lessons.find({}, {"_id": 0}).to_list(2000)):
        if q_low in cl.get("title", "").lower() or q_low in cl.get("summary", "").lower():
            lessons.append({"id": cl["id"], "title": cl["title"], "trackId": cl["trackId"], "summary": cl["summary"], "custom": True})
    tracks = [
        {"id": t["id"], "title": t["title"], "summary": t["summary"]}
        for t in TRACKS
        if q_low in t["title"].lower() or q_low in t["summary"].lower()
    ]
    glossary_hits = search_glossary(q_low, limit=10)
    return {"lessons": lessons[:limit], "tracks": tracks[:limit], "glossary": glossary_hits}


# --------------------------------------------------------------------------------------
# Comments / Discussion
# --------------------------------------------------------------------------------------
@api.get("/lessons/{lesson_id}/comments")
async def get_comments(lesson_id: str):
    rows = await db.comments.find(
        {"lesson_id": lesson_id},
        {"_id": 0},
    ).sort("created_at", -1).limit(100).to_list(100)
    return {"comments": rows, "count": len(rows)}


@api.post("/lessons/{lesson_id}/comments")
async def post_comment(lesson_id: str, body: CommentCreate, request: Request):
    user = await get_current_user(request, db)
    l = await _resolve_lesson(lesson_id)
    if not l:
        raise HTTPException(404, "Lesson not found")
    doc = {
        "id": str(uuid.uuid4()),
        "lesson_id": lesson_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "body": body.body.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.comments.insert_one(doc)
    return {"comment": {k: v for k, v in doc.items() if k != "_id"}}


@api.delete("/admin/comments/{comment_id}")
async def delete_comment(comment_id: str, request: Request):
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    await db.comments.delete_one({"id": comment_id})
    return {"ok": True}


# --------------------------------------------------------------------------------------
# Admin CMS — custom lessons
# --------------------------------------------------------------------------------------
@api.get("/admin/stats")
async def admin_stats(request: Request):
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    user_count = await db.users.count_documents({})
    progress_count = await db.progress.count_documents({})
    assessments = await db.assessments.count_documents({})
    custom_lessons = await db.custom_lessons.count_documents({})
    comments = await db.comments.count_documents({})
    # Lesson completion tally
    pipeline = [
        {"$group": {"_id": "$lesson_id", "n": {"$sum": 1}}},
        {"$sort": {"n": -1}},
        {"$limit": 10},
    ]
    top = await db.progress.aggregate(pipeline).to_list(10)
    return {
        "users": user_count,
        "lessonsCompleted": progress_count,
        "assessments": assessments,
        "customLessons": custom_lessons,
        "comments": comments,
        "topLessons": [{"lessonId": r["_id"], "completions": r["n"]} for r in top],
    }


@api.get("/admin/lessons")
async def list_custom_lessons(request: Request):
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    rows = await db.custom_lessons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"lessons": rows}


@api.post("/admin/lessons")
async def create_custom_lesson(body: AdminLessonCreate, request: Request):
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    if body.id in LESSONS:
        raise HTTPException(400, "Lesson ID collides with seed content")
    track = next((t for t in TRACKS if t["id"] == body.trackId), None)
    if not track:
        raise HTTPException(400, "Unknown trackId")
    if not any(m["id"] == body.moduleId for m in track["modules"]):
        raise HTTPException(400, "Unknown moduleId for this track")
    existing = await db.custom_lessons.find_one({"id": body.id})
    if existing:
        raise HTTPException(400, "Lesson with this ID already exists")
    doc = {
        "id": body.id,
        "title": body.title,
        "summary": body.summary,
        "trackId": body.trackId,
        "moduleId": body.moduleId,
        "estMinutes": body.estMinutes,
        "order": 100,
        "blocks": body.blocks,
        "quiz": body.quiz,
        "socialClip": body.socialClip or {
            "hook": body.title,
            "coreIdea": body.summary,
            "visualSuggestion": "",
            "takeaway": "",
            "hashtags": [],
        },
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.custom_lessons.insert_one(doc)
    return {"lesson": {k: v for k, v in doc.items() if k != "_id"}}


@api.delete("/admin/lessons/{lesson_id}")
async def delete_custom_lesson(lesson_id: str, request: Request):
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    if lesson_id in LESSONS:
        raise HTTPException(400, "Cannot delete a seed lesson")
    await db.custom_lessons.delete_one({"id": lesson_id})
    await db.lesson_overrides.delete_one({"id": lesson_id})
    return {"ok": True}


@api.get("/admin/all-lessons")
async def admin_all_lessons(request: Request):
    """Full curriculum index for the CMS — seed + custom, with edit/origin flags."""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    overrides = {r["id"]: r for r in await db.lesson_overrides.find({}, {"_id": 0}).to_list(5000)}
    customs = {r["id"]: r for r in await db.custom_lessons.find({}, {"_id": 0}).to_list(5000)}
    items = []
    for lid, l in LESSONS.items():
        ov = overrides.get(lid, {})
        items.append({
            "id": l["id"],
            "title": ov.get("title") or l["title"],
            "summary": ov.get("summary") or l["summary"],
            "trackId": l["trackId"],
            "moduleId": l["moduleId"],
            "estMinutes": ov.get("estMinutes") or l.get("estMinutes", 5),
            "origin": "seed",
            "edited": lid in overrides,
        })
    for lid, l in customs.items():
        ov = overrides.get(lid, {})
        items.append({
            "id": l["id"],
            "title": ov.get("title") or l["title"],
            "summary": ov.get("summary") or l["summary"],
            "trackId": l["trackId"],
            "moduleId": l["moduleId"],
            "estMinutes": ov.get("estMinutes") or l.get("estMinutes", 5),
            "origin": "custom",
            "edited": lid in overrides,
        })
    items.sort(key=lambda x: (x["trackId"], x["moduleId"], x["id"]))
    return {"lessons": items, "total": len(items)}


@api.get("/admin/lessons/{lesson_id}")
async def admin_get_lesson(lesson_id: str, request: Request):
    """Returns the FULL editable lesson (seed + override OR custom + override merged)."""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    l = await _resolve_lesson(lesson_id)
    if not l:
        raise HTTPException(404, "Lesson not found")
    origin = "seed" if lesson_id in LESSONS else "custom"
    return {"lesson": l, "origin": origin}


@api.put("/admin/lessons/{lesson_id}")
async def admin_update_lesson(lesson_id: str, body: LessonPatch, request: Request):
    """Edit any lesson. Seed lessons → overrides collection. Custom → in place."""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    patch = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    if not patch:
        raise HTTPException(400, "No fields to update")

    is_seed = lesson_id in LESSONS
    is_custom = await db.custom_lessons.find_one({"id": lesson_id}, {"_id": 0}) is not None
    if not (is_seed or is_custom):
        raise HTTPException(404, "Lesson not found")

    if is_seed:
        patch["id"] = lesson_id
        patch["updated_at"] = datetime.now(timezone.utc).isoformat()
        patch["updated_by"] = user["id"]
        await db.lesson_overrides.update_one(
            {"id": lesson_id},
            {"$set": patch},
            upsert=True,
        )
    else:
        patch["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.custom_lessons.update_one({"id": lesson_id}, {"$set": patch})

    merged = await _resolve_lesson(lesson_id)
    return {"lesson": merged, "origin": "seed" if is_seed else "custom"}


@api.delete("/admin/lessons/{lesson_id}/override")
async def admin_revert_lesson(lesson_id: str, request: Request):
    """Revert a seed lesson back to its original content by deleting its override."""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    res = await db.lesson_overrides.delete_one({"id": lesson_id})
    return {"reverted": res.deleted_count > 0}


# --------------------------------------------------------------------------------------
# Simulator runs (also feeds the Psychomotor assessment domain)
# --------------------------------------------------------------------------------------
MISSIONS_CONFIG = {
    "gate-course-1": {"name": "Gate Course", "gates": 5, "min_time": 5.0, "max_time": 90.0},
    "precision-hover": {"name": "Precision Hover", "gates": 1, "min_time": 8.0, "max_time": 60.0},
    "pylon-slalom": {"name": "Pylon Slalom", "gates": 6, "min_time": 6.0, "max_time": 75.0},
    "no-gps-landing": {"name": "No-GPS Landing", "gates": 1, "min_time": 5.0, "max_time": 60.0},
}
MISSION_GATES = {k: v["gates"] for k, v in MISSIONS_CONFIG.items()}


@api.get("/sim/missions")
async def sim_missions():
    return {"missions": [{"id": k, **v} for k, v in MISSIONS_CONFIG.items()]}


@api.post("/sim/score")
async def sim_score(body: SimScore, request: Request):
    user = await get_current_user(request, db)
    cfg = MISSIONS_CONFIG.get(body.mission)
    if not cfg:
        raise HTTPException(400, "Unknown mission")
    if body.gates_cleared < cfg["gates"]:
        raise HTTPException(400, f"Run incomplete: {body.gates_cleared}/{cfg['gates']} gates")
    if body.time_sec < cfg["min_time"]:
        raise HTTPException(400, "Implausibly fast run rejected")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "mission": body.mission,
        "time_sec": body.time_sec,
        "gates_cleared": body.gates_cleared,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Best BEFORE inserting the new run
    existing = await db.sim_runs.find(
        {"user_id": user["id"], "mission": body.mission},
        {"_id": 0, "time_sec": 1},
    ).sort("time_sec", 1).limit(1).to_list(1)
    prev_best_time = existing[0]["time_sec"] if existing else None

    await db.sim_runs.insert_one(doc)

    is_new_best = (prev_best_time is None) or (body.time_sec < prev_best_time)
    awarded = 0
    if is_new_best:
        # XP scales with how fast vs the mission's max_time
        max_t = cfg["max_time"]
        ratio = max(0.0, min(1.0, (max_t - body.time_sec) / max_t))
        awarded = max(10, int(20 + ratio * 100))
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"xp": awarded}},
        )
        fresh = await db.users.find_one({"id": user["id"]})
        if fresh:
            await db.users.update_one({"id": user["id"]}, {"$set": {"level": xp_to_level(fresh.get("xp", 0))}})
    await _grant_badges(user["id"])
    return {
        "is_new_best": is_new_best,
        "xpAwarded": awarded,
        "best": {"time_sec": min(body.time_sec, prev_best_time) if prev_best_time else body.time_sec},
    }


@api.get("/sim/psychomotor")
async def sim_psychomotor(request: Request):
    """Aggregate the user's sim performance into a normalized psychomotor score (0..1).

    For each mission the user has completed, score = clip((max_time - best) / max_time, 0..1).
    Final = mean across missions completed, with a small bonus for breadth (more missions = more confidence).
    Returns 0 if no runs.
    """
    user = await get_current_user(request, db)
    rows = await db.sim_runs.find(
        {"user_id": user["id"]},
        {"_id": 0, "mission": 1, "time_sec": 1},
    ).to_list(2000)
    if not rows:
        return {"score": 0.0, "missions_completed": 0, "details": []}
    bests = {}
    for r in rows:
        m = r["mission"]
        if m not in bests or r["time_sec"] < bests[m]:
            bests[m] = r["time_sec"]
    details = []
    total = 0.0
    n = 0
    for m, t in bests.items():
        cfg = MISSIONS_CONFIG.get(m)
        if not cfg:
            continue
        s = max(0.0, min(1.0, (cfg["max_time"] - t) / cfg["max_time"]))
        details.append({"mission": m, "best": t, "score": round(s, 3)})
        total += s
        n += 1
    base = (total / n) if n else 0.0
    # Breadth bonus: up to +0.1 if you've completed all 4 missions
    breadth = min(0.1, 0.025 * n)
    final = max(0.0, min(1.0, base + breadth))
    return {"score": round(final, 3), "missions_completed": n, "details": details}


@api.get("/sim/best")
async def sim_best(request: Request, mission: str = "gate-course-1"):
    user = await get_current_user(request, db)
    row = await db.sim_runs.find(
        {"user_id": user["id"], "mission": mission},
        {"_id": 0},
    ).sort("time_sec", 1).limit(1).to_list(1)
    return {"best": row[0] if row else None}


@api.get("/sim/leaderboard")
async def sim_leaderboard(mission: str = "gate-course-1", limit: int = 20):
    pipeline = [
        {"$match": {"mission": mission}},
        {"$sort": {"time_sec": 1}},
        {"$group": {"_id": "$user_id", "best": {"$first": "$time_sec"}, "at": {"$first": "$created_at"}}},
        {"$sort": {"best": 1}},
        {"$limit": limit},
    ]
    rows = await db.sim_runs.aggregate(pipeline).to_list(limit)
    out = []
    for i, r in enumerate(rows):
        u = await db.users.find_one({"id": r["_id"]}, {"_id": 0, "name": 1})
        out.append({"rank": i + 1, "name": u.get("name", "Anonymous") if u else "Anonymous", "time_sec": r["best"]})
    return {"mission": mission, "entries": out}


# --------------------------------------------------------------------------------------
# Startup
# --------------------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.progress.create_index([("user_id", 1), ("lesson_id", 1)], unique=True)
    await db.assessments.create_index("user_id")
    await db.reviews.create_index([("user_id", 1), ("next_review_at", 1)])
    await db.custom_lessons.create_index("id", unique=True)
    await db.lesson_overrides.create_index("id", unique=True)
    await db.comments.create_index([("lesson_id", 1), ("created_at", -1)])
    await db.sim_runs.create_index([("user_id", 1), ("mission", 1), ("time_sec", 1)])
    await db.login_attempts.create_index("email", unique=True)
    await db.login_attempts.create_index("expires_at", expireAfterSeconds=0)
    await _ensure_admin()
    logger.info("CORS origins: %s", ", ".join(CORS_ORIGINS))
    logger.info("Google sign-in: %s", "enabled" if GOOGLE_CLIENT_IDS else "disabled (GOOGLE_CLIENT_ID not set)")


async def _ensure_admin():
    """Create or update the single admin account from ADMIN_EMAIL / ADMIN_PASSWORD.

    No defaults: if either is missing or the password is too short, no admin is touched.
    The env var is the source of truth — change ADMIN_PASSWORD and restart to rotate it.
    """
    admin_email = (os.environ.get("ADMIN_EMAIL") or "").lower().strip()
    admin_pw = os.environ.get("ADMIN_PASSWORD") or ""
    if not admin_email or not admin_pw:
        logger.warning("ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin account created or updated.")
        return
    if len(admin_pw) < MIN_ADMIN_PASSWORD_LENGTH:
        logger.error(
            "ADMIN_PASSWORD is shorter than %d characters — admin account NOT created or updated.",
            MIN_ADMIN_PASSWORD_LENGTH,
        )
        return
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_pw),
            "goal": "professional",
            "xp": 0,
            "level": 1,
            "streak": 0,
            "badges": [],
            "role": "admin",
            "auth_provider": "password",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin account created for %s", admin_email)
        return
    updates = {}
    if existing.get("role") != "admin":
        updates["role"] = "admin"
    if not verify_password(admin_pw, existing.get("password_hash") or ""):
        updates["password_hash"] = hash_password(admin_pw)
        providers = existing.get("auth_provider") or "password"
        if "password" not in providers.split(","):
            updates["auth_provider"] = f"{providers},password"
    if updates:
        await db.users.update_one({"id": existing["id"]}, {"$set": updates})
        logger.info("Admin account %s updated (%s)", admin_email, ", ".join(sorted(updates)))


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

# The frontend authenticates with a Bearer token, so browsers only need CORS from the
# deployed frontend origin(s). Set CORS_ORIGINS to e.g. "https://scienceofautonomy.pages.dev".
CORS_ORIGINS = [
    o.strip().rstrip("/")
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    # Cookies are only ever allowed for explicitly listed origins, never with "*".
    allow_credentials="*" not in CORS_ORIGINS,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
