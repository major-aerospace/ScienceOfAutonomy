"""Science of Autonomy — FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import csv
import io
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
)
from seed_data import TRACKS, LESSONS, all_lessons_list

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
        "role": u.get("role", "user"),
    }


def xp_to_level(xp: int) -> int:
    # simple curve: 100 XP per level, grows slowly
    return 1 + int(xp ** 0.5 / 5)


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


@api.post("/auth/login")
async def login(body: LoginBody, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"user": public_user(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


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
    modules = []
    for m in track["modules"]:
        ls = []
        for lid in m["lessons"]:
            l = LESSONS.get(lid)
            if not l:
                continue
            ls.append({
                "id": l["id"],
                "title": l["title"],
                "summary": l["summary"],
                "estMinutes": l["estMinutes"],
                "order": l["order"],
                "completed": lid in completed,
            })
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
    l = LESSONS.get(lesson_id)
    if not l:
        raise HTTPException(404, "Lesson not found")
    # next + prev within the track
    track = next((t for t in TRACKS if t["id"] == l["trackId"]), None)
    seq = []
    if track:
        for m in track["modules"]:
            for lid in m["lessons"]:
                seq.append(lid)
    idx = seq.index(lesson_id) if lesson_id in seq else -1
    prev_id = seq[idx - 1] if idx > 0 else None
    next_id = seq[idx + 1] if 0 <= idx < len(seq) - 1 else None
    return {**l, "prevLessonId": prev_id, "nextLessonId": next_id}


# ---------- Progress ----------
@api.post("/progress/complete")
async def complete_lesson(body: CompleteLessonBody, request: Request):
    user = await get_current_user(request, db)
    if body.lesson_id not in LESSONS:
        raise HTTPException(404, "Lesson not found")

    existing = await db.progress.find_one({"user_id": user["id"], "lesson_id": body.lesson_id})
    awarded = 0
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
        if last is None:
            streak = 1
        elif last == today:
            pass  # same day
        else:
            # consecutive day check (any prior day -> +1, gap -> reset)
            streak = streak + 1
        new_xp = user.get("xp", 0) + awarded
        new_level = xp_to_level(new_xp)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"xp": new_xp, "level": new_level, "streak": streak, "last_active_day": today}},
        )
    return {"ok": True, "xpAwarded": awarded}


@api.get("/progress")
async def get_progress(request: Request):
    user = await get_current_user(request, db)
    rows = await db.progress.find({"user_id": user["id"]}, {"_id": 0}).to_list(2000)
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return {"progress": rows, "user": public_user(fresh)}


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
async def calendar_csv():
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["week", "day", "lessonId", "title", "hook", "coreIdea", "takeaway", "hashtags"])
    lessons = all_lessons_list()
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    for i, l in enumerate(lessons):
        week = (i // 5) + 1
        day = days[i % 5]
        c = l["socialClip"]
        w.writerow([
            f"W{week}", day, l["id"], l["title"],
            c["hook"], c["coreIdea"], c["takeaway"], " ".join(c["hashtags"])
        ])
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=content_calendar.csv"},
    )


# --------------------------------------------------------------------------------------
# Startup
# --------------------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.progress.create_index([("user_id", 1), ("lesson_id", 1)], unique=True)
    await db.assessments.create_index("user_id")
    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
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
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
