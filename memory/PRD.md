# Science of Autonomy — PRD

## Original Problem Statement (summary)
Build a vendor-neutral, visual-first, PWA-ready interactive learning platform for the science of unmanned and autonomous systems. Visual lessons (3D, diagrams, graphs) — never paragraphs. 10 tracks total; MVP ships 3. Includes a Dronability self-assessment with a Trainability slope, gamification (XP/streak), and a social Content Studio.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes under `/api`.
- **Frontend**: React 19 + CRA + Tailwind + Shadcn + react-three-fiber + Recharts.
- **Auth**: JWT (email/password) + Bearer in localStorage + httpOnly cookie fallback.
- **3D**: procedural Three.js drones via R3F (using `React.createElement` to bypass the visual-edits babel plugin which conflicts with R3F).

## User Personas
- The Curious · The Student · The Operator · The Professional.

## What's been implemented (Feb 2026)

### MVP (initial release)
- Landing page with hero 3D drone (rotating quadrotor, animated props, status HUD).
- Auth: email/password register + login + logout + /auth/me.
- Onboarding goal picker → recommends starting track.
- Curriculum browser, Track → Module → Lesson navigation.
- Lesson player with block types: widget · diagram · chart · caption · takeaway · deepdive · quiz.
- Interactive widgets: PID Tuner, Lift Lab, Sensor Fusion, Swarm Sandbox, Exploded Drone, Autonomy Ladder, RTK Visualizer, BLDC Motor Commutation, Signal/Filter, Waypoint Planner, Stability Drone.
- Quiz engine + XP award + streak tracking.
- Dashboard + Dronability self-assessment (3 mini-tasks) → radar chart + recommendation.
- Content Studio: per-lesson socialClips + 4-week CSV calendar.
- PWA manifest + responsive design.

### Phase 3 (Feb 2026 update)
- **Difficulty tiers** per lesson — ELI12 / Standard / Deep dive selector inline on every lesson; ELI12 hides deepdive blocks + shows a yellow "Explained simply" banner; Deep dive auto-expands the math expander. Persisted to user profile (`PATCH /api/auth/tier`) and locally for guests.
- **Badges + Leaderboard + Certificates**:
  - 20-badge catalog auto-evaluated on lesson completion + assessment (`/api/badges/me`, `/api/badges/catalog`). Visible on Dashboard as a 5-column grid with earned/locked states.
  - `/api/leaderboard?metric=xp|streak` powers the public `/leaderboard` page with two tabs.
  - Track-completion certificates at `/certificates/:trackId` — printable / save-as-PDF, unique cert IDs, hidden chrome via print stylesheet. TrackDetail surfaces a "View certificate" CTA on 100% completion.
- **Glossary + Global Search**:
  - 68-term vendor-neutral glossary at `/glossary` with live filter.
  - **⌘K / Ctrl-K command palette** in the nav — searches lessons, tracks, and glossary in one box via `/api/search`.
- **CMS + Discussions**:
  - Admin-only `/admin` console: stats tiles (users, completions, assessments, custom lessons, comments), top-10 lessons, full "Create lesson" form with track/module dropdowns + simple caption/takeaway/MCQ blocks. Custom lessons are persisted in `db.custom_lessons` and merged into `/api/tracks/:id` + `/api/lessons/:id`.
  - Per-lesson **Discussion** section beneath every lesson (`/api/lessons/:id/comments` GET/POST), admin moderation via `/api/admin/comments/:id` DELETE.
- **Production polish**: stripped MVP/v1.0/LIVE labels from UI. Header now reads VENDOR-NEUTRAL · VISUAL-FIRST · PRESENT-DAY.

### Testing
- 47/47 backend pytest pass after the Phase 3 glossary fix. All requested Phase 3 frontend flows verified.

### Maintenance (Feb 2026)
- Fixed React Hook `exhaustive-deps` warnings in `Comments.jsx` (wrapped `load` in `useCallback`) and `Vigilance.jsx` (wrapped `end` in `useCallback`, mirrored state into refs to keep effect stable, escaped apostrophe). Frontend now compiles clean (no warnings).

## Backlog
- P1 — Content Studio export (real CSV calendar download + auto-generated square/vertical takeaway cards for Reels/Shorts).
- P1 — CMS authoring DB migration (move `seed_data.py` curriculum into MongoDB so Admin CMS can fully CRUD).
- P0/V2 — Emergent-managed Google Auth alongside JWT.

## Credentials
See `/app/memory/test_credentials.md`.
