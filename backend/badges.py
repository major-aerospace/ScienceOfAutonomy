"""Badge catalog + earning rules."""

BADGES = [
    {"id": "first-lesson", "title": "First Light", "description": "Completed your first lesson.", "icon": "sparkles"},
    {"id": "five-lessons", "title": "Getting Started", "description": "Completed 5 lessons.", "icon": "rocket"},
    {"id": "twenty-lessons", "title": "Apprentice", "description": "Completed 20 lessons.", "icon": "award"},
    {"id": "completionist", "title": "Completionist", "description": "Completed every published lesson.", "icon": "trophy"},
    {"id": "control-theorist", "title": "Control Theorist", "description": "Tuned a PID hover.", "icon": "sliders"},
    {"id": "sensor-fusion-adept", "title": "Sensor-Fusion Adept", "description": "Survived the noisy estimate.", "icon": "radar"},
    {"id": "swarm-architect", "title": "Swarm Architect", "description": "Made a flock from three rules.", "icon": "users"},
    {"id": "dronability-taken", "title": "Self-Aware", "description": "Completed the Dronability self-assessment.", "icon": "brain"},
    {"id": "streak-7", "title": "Week One", "description": "7-day streak.", "icon": "flame"},
    {"id": "streak-30", "title": "Monthly Habit", "description": "30-day streak.", "icon": "flame"},
    {"id": "track-foundations-graduate", "title": "Foundations Graduate", "description": "Completed the Foundations track.", "icon": "graduation-cap"},
    {"id": "track-anatomy-graduate", "title": "Anatomy Graduate", "description": "Completed the Anatomy track.", "icon": "graduation-cap"},
    {"id": "track-gnc-graduate", "title": "GNC Graduate", "description": "Completed the GNC track.", "icon": "graduation-cap"},
    {"id": "track-sensing-graduate", "title": "Sensing Graduate", "description": "Completed the Sensing track.", "icon": "graduation-cap"},
    {"id": "track-comms-graduate", "title": "Comms Graduate", "description": "Completed the Comms track.", "icon": "graduation-cap"},
    {"id": "track-stack-graduate", "title": "Stack Graduate", "description": "Completed the AI Stack track.", "icon": "graduation-cap"},
    {"id": "track-swarms-graduate", "title": "Swarms Graduate", "description": "Completed the Swarms track.", "icon": "graduation-cap"},
    {"id": "track-human-graduate", "title": "Human Factors Graduate", "description": "Completed the Human Factors track.", "icon": "graduation-cap"},
    {"id": "track-safety-graduate", "title": "Safety Graduate", "description": "Completed the Safety & Ethics track.", "icon": "graduation-cap"},
    {"id": "track-apps-graduate", "title": "Applications Graduate", "description": "Completed the Real-World Applications track.", "icon": "graduation-cap"},
]

BADGE_MAP = {b["id"]: b for b in BADGES}


def evaluate_badges(user: dict, completed_lesson_ids: set, all_tracks, has_assessment: bool):
    """Return the full set of badge IDs the user has earned now."""
    earned = set(user.get("badges", []))
    total = len(completed_lesson_ids)

    if total >= 1: earned.add("first-lesson")
    if total >= 5: earned.add("five-lessons")
    if total >= 20: earned.add("twenty-lessons")

    if "l-pid" in completed_lesson_ids: earned.add("control-theorist")
    if "l-avoidance" in completed_lesson_ids or "l-filtering" in completed_lesson_ids:
        earned.add("sensor-fusion-adept")
    if "l-emergent" in completed_lesson_ids: earned.add("swarm-architect")

    if has_assessment: earned.add("dronability-taken")

    streak = user.get("streak", 0)
    if streak >= 7: earned.add("streak-7")
    if streak >= 30: earned.add("streak-30")

    # Per-track graduation
    all_track_lesson_ids = set()
    for t in all_tracks:
        track_ids = {lid for m in t["modules"] for lid in m["lessons"]}
        all_track_lesson_ids |= track_ids
        if track_ids and track_ids.issubset(completed_lesson_ids):
            bid = f"{t['id']}-graduate"
            if bid in BADGE_MAP:
                earned.add(bid)

    if all_track_lesson_ids and all_track_lesson_ids.issubset(completed_lesson_ids):
        earned.add("completionist")

    return earned
