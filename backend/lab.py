"""Authenticated formative learning records and instructor-owned cohorts.

Attempts are append-only and scored from a published server key. Progress is
derived from those records so simultaneous submissions cannot lose a best score
or an attempt count. This module deliberately does not award general XP or infer
aptitude, professional suitability, or certification.
"""
import secrets
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StrictBool, StrictInt, field_validator
from pymongo.errors import DuplicateKeyError

from auth import get_current_user
from lab_content import ASSIGNMENT_ID, CHECK_TOPICS, CONTENT_VERSION, LESSON_KEYS, LESSON_TITLES

MAX_ATTEMPTS_PER_USER = 5000
MAX_COHORT_MEMBERS = 500


class StrictBody(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Experiment(StrictBody):
    noise: float = Field(ge=0, le=100, allow_inf_nan=False, strict=True)
    samples: StrictInt = Field(ge=1, le=1000)
    biased: StrictBool = False


class AttemptBody(StrictBody):
    content_version: Literal["foundations-1"]
    lesson_id: str
    answers: list[StrictInt] = Field(min_length=2, max_length=2)
    prediction: Optional[str] = Field(default=None, max_length=2000)
    reflection: Optional[str] = Field(default=None, max_length=4000)
    experiment: Optional[Experiment] = None
    presentation: Literal["explorer", "standard", "advanced"] = "standard"

    @field_validator("lesson_id")
    @classmethod
    def known_lesson(cls, value):
        if value not in LESSON_KEYS:
            raise ValueError("Unknown Foundations lesson")
        return value

    @field_validator("answers")
    @classmethod
    def valid_answers(cls, value):
        if any(answer < 0 or answer > 2 for answer in value):
            raise ValueError("Each answer must be an option index from 0 to 2")
        return value


class CohortBody(StrictBody):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Cohort name must not be blank")
        return value


class JoinBody(StrictBody):
    code: str = Field(min_length=1, max_length=32)


class InstructorBody(StrictBody):
    email: EmailStr


async def create_lab_indexes(db):
    await db.lab_attempts.create_index("id", unique=True)
    await db.lab_attempts.create_index([
        ("user_id", 1), ("content_version", 1), ("lesson_id", 1), ("created_at", 1), ("id", 1),
    ])
    await db.lab_cohorts.create_index("id", unique=True)
    await db.lab_cohorts.create_index("join_code", unique=True)
    await db.lab_cohorts.create_index("owner_id")
    await db.lab_memberships.create_index([("cohort_id", 1), ("user_id", 1)], unique=True)
    await db.lab_memberships.create_index("user_id")


def _public_cohort(cohort, include_code=False):
    fields = ["id", "name", "assignment_id", "content_version", "created_at"]
    if include_code:
        fields.append("join_code")
    return {key: cohort[key] for key in fields}


async def _progress_for(db, user_ids, include_notes=True):
    """Return at most six records per learner, without loading raw histories.

Mongo computes counts and best results; only the latest notes for each lesson
cross into application memory. A grade response omits notes entirely. The
published lesson set and cohort membership cap bound the result size.
    """
    query = {
        "user_id": {"$in": user_ids}, "content_version": CONTENT_VERSION,
        "lesson_id": {"$in": list(LESSON_KEYS)},
    }
    latest_fields = ["presentation", "correct"]
    if include_notes:
        latest_fields += ["reflection", "prediction", "experiment"]
    fields = {key: 1 for key in ["id", "user_id", "lesson_id", "score", "created_at", *latest_fields]}
    grouped = {
        "_id": {"user_id": "$user_id", "lesson_id": "$lesson_id"},
        "attempts": {"$sum": 1}, "best_score": {"$max": "$score"},
        "last_attempt": {"$last": "$created_at"}, "latest_score": {"$last": "$score"},
        **{key: {"$last": f"${key}"} for key in latest_fields},
    }
    pipeline = [
        {"$match": query}, {"$project": fields},
        {"$sort": {"user_id": 1, "lesson_id": 1, "created_at": 1, "id": 1}},
        {"$group": grouped},
    ]
    records = {user_id: {} for user_id in user_ids}
    async for record in db.lab_attempts.aggregate(pipeline, allowDiskUse=True):
        identity = record.pop("_id")
        record["lesson_id"] = identity["lesson_id"]
        record["completed"] = record["best_score"] == 1
        records[identity["user_id"]][identity["lesson_id"]] = record
    return {
        user_id: [lessons[lesson_id] for lesson_id in LESSON_KEYS if lesson_id in lessons]
        for user_id, lessons in records.items()
    }


def create_lab_router(get_db):
    """Use a database getter so the app's configured DB and test DB stay aligned."""
    router = APIRouter(prefix="/lab", tags=["learning"])

    async def instructor(request, admin_only=False):
        user = await get_current_user(request, get_db())
        allowed = {"admin"} if admin_only else {"instructor", "admin"}
        if user.get("role") not in allowed:
            raise HTTPException(403, "Administrator access required" if admin_only else "Instructor access required")
        return user

    async def owned_cohort(cohort_id, user):
        query = {"id": cohort_id}
        if user.get("role") != "admin":
            query["owner_id"] = user["id"]
        cohort = await get_db().lab_cohorts.find_one(query, {"_id": 0})
        if not cohort:
            raise HTTPException(404, "Cohort not found")
        return cohort

    @router.get("/me")
    async def me(request: Request):
        db = get_db()
        user = await get_current_user(request, db)
        progress = (await _progress_for(db, [user["id"]]))[user["id"]]
        memberships = [row async for row in db.lab_memberships.find({"user_id": user["id"]})]
        cohort_ids = [row["cohort_id"] for row in memberships]
        cohorts = [_public_cohort(row) async for row in db.lab_cohorts.find({"id": {"$in": cohort_ids}})]
        return {"progress": progress, "cohorts": cohorts, "content_version": CONTENT_VERSION}

    @router.post("/attempts")
    async def submit_attempt(body: AttemptBody, request: Request):
        db = get_db()
        user = await get_current_user(request, db)
        if await db.lab_attempts.count_documents({"user_id": user["id"]}) >= MAX_ATTEMPTS_PER_USER:
            raise HTTPException(409, "Learning record limit reached; contact your administrator")
        correct = [answer == expected for answer, expected in zip(body.answers, LESSON_KEYS[body.lesson_id])]
        score = sum(correct) / len(correct)
        attempt = {
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "assignment_id": ASSIGNMENT_ID, "content_version": CONTENT_VERSION,
            "scoring_version": CONTENT_VERSION, "created_at": datetime.now(timezone.utc).isoformat(),
            **body.model_dump(), "correct": correct, "score": score,
        }
        await db.lab_attempts.insert_one(attempt)
        progress = (await _progress_for(db, [user["id"]], include_notes=False))[user["id"]]
        current = next(row for row in progress if row["lesson_id"] == body.lesson_id)
        return {
            "attempt_id": attempt["id"], "lesson_id": body.lesson_id,
            "score": score, "correct": correct, "completed": current["completed"],
            "best_score": current["best_score"], "attempts": current["attempts"],
            "content_version": CONTENT_VERSION,
        }

    @router.get("/cohorts")
    async def cohorts(request: Request):
        user = await instructor(request)
        db = get_db()
        query = {} if user.get("role") == "admin" else {"owner_id": user["id"]}
        result = []
        async for cohort in db.lab_cohorts.find(query).sort("created_at", -1):
            public = _public_cohort(cohort, include_code=True)
            public["member_count"] = await db.lab_memberships.count_documents({"cohort_id": cohort["id"]})
            result.append(public)
        return {"cohorts": result}

    @router.post("/cohorts")
    async def create_cohort(body: CohortBody, request: Request):
        user = await instructor(request)
        db = get_db()
        for _ in range(5):
            cohort = {
                "id": str(uuid.uuid4()), "name": body.name, "owner_id": user["id"],
                "assignment_id": ASSIGNMENT_ID, "content_version": CONTENT_VERSION,
                "join_code": "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8)),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            try:
                await db.lab_cohorts.insert_one(cohort)
                return {"cohort": {**_public_cohort(cohort, include_code=True), "member_count": 0}}
            except DuplicateKeyError:
                continue
        raise HTTPException(503, "Could not create a unique invitation code. Please try again.")

    @router.post("/join")
    async def join_cohort(body: JoinBody, request: Request):
        db = get_db()
        user = await get_current_user(request, db)
        code = body.code.strip().upper()
        cohort = await db.lab_cohorts.find_one({"join_code": code}, {"_id": 0})
        if not cohort:
            raise HTTPException(404, "Invitation code not found")
        membership = {"cohort_id": cohort["id"], "user_id": user["id"]}
        if await db.lab_memberships.find_one(membership):
            return {"cohort": _public_cohort(cohort)}
        if await db.lab_memberships.count_documents({"cohort_id": cohort["id"]}) >= MAX_COHORT_MEMBERS:
            raise HTTPException(409, "This cohort has reached its learner limit; contact your instructor")
        try:
            await db.lab_memberships.update_one(
                membership,
                {"$setOnInsert": {"joined_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
        except DuplicateKeyError:
            pass  # Another simultaneous join already created this membership.
        return {"cohort": _public_cohort(cohort)}

    @router.get("/cohorts/{cohort_id}")
    async def cohort_detail(cohort_id: str, request: Request):
        user = await instructor(request)
        db = get_db()
        cohort = await owned_cohort(cohort_id, user)
        memberships = [row async for row in db.lab_memberships.find({"cohort_id": cohort_id})]
        user_ids = [row["user_id"] for row in memberships]
        members = [row async for row in db.users.find({"id": {"$in": user_ids}}, {
            "_id": 0, "id": 1, "name": 1, "email": 1,
        })]
        by_user = await _progress_for(db, user_ids)
        learners = []
        support_counts = {}
        for member in members:
            progress = by_user[member["id"]]
            completed = sum(row["completed"] for row in progress)
            latest = max((row["last_attempt"] for row in progress), default=None)
            best_average = round(sum(row["best_score"] for row in progress) / len(progress) * 100, 1) if progress else None
            learners.append({
                **member, "total_lessons": len(LESSON_KEYS), "completed_lessons": completed,
                "progress_percent": round(completed / len(LESSON_KEYS) * 100, 1),
                "quiz_average": best_average, "last_activity": latest, "lesson_records": progress,
            })
            for record in progress:
                for question_index, correct in enumerate(record["correct"]):
                    if not correct:
                        key = (record["lesson_id"], question_index)
                        support_counts[key] = support_counts.get(key, 0) + 1
        misconceptions = [{
            "id": f"{lesson_id}-{index}", "title": CHECK_TOPICS[lesson_id][index],
            "description": f"{LESSON_TITLES[lesson_id]} · check {index + 1}: learners whose latest response was incorrect.",
            "count": count,
        } for (lesson_id, index), count in sorted(support_counts.items(), key=lambda item: (-item[1], item[0]))]
        return {
            "cohort": {**_public_cohort(cohort, include_code=True), "member_count": len(members)},
            "learners": sorted(learners, key=lambda member: member["name"].casefold()),
            "misconceptions": misconceptions,
        }

    @router.patch("/instructors")
    async def promote_instructor(body: InstructorBody, request: Request):
        admin = await instructor(request, admin_only=True)
        db = get_db()
        email = str(body.email).strip().lower()
        target = await db.users.find_one({"email": email}, {"_id": 0})
        if not target:
            raise HTTPException(404, "Create the learner account before granting instructor access")
        if target.get("role") == "admin":
            raise HTTPException(409, "This account already has administrator access")
        await db.users.update_one({"id": target["id"], "role": {"$ne": "admin"}}, {"$set": {"role": "instructor"}})
        await db.lab_audit.insert_one({
            "id": str(uuid.uuid4()), "actor_id": admin["id"], "target_id": target["id"],
            "action": "grant_instructor", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"user": {"id": target["id"], "name": target["name"], "email": target["email"], "role": "instructor"}}

    return router
