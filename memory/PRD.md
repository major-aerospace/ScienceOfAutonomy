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

### Phase 2 (Feb 2026 update)
- **All 10 tracks live · 46 lessons total**: added Sensing & Perception, Communications, Autonomy Stack & AI, Multi-Agent & Swarms, Human Factors, Safety & Ethics, and Real-World Applications.
- **23 new diagram components** + 4 new chart types (edge-ai, reward-curve, payload-range, workload-curve).
- **Adaptive next-lesson recommendation** (`/api/recommend/next`) — picks up where the user left off and re-routes to review when last quiz was rough.
- **Spaced-repetition review queue** (`/api/review/*`) — missed-quiz lessons are scheduled at 1/3/7/14/30-day intervals and graduate out after 5 cycles. Visible in nav (`/review`) and on Dashboard.
- **Service-worker PWA offline cache** (`/public/service-worker.js`) — cache-first static assets, network-first API for `/tracks`, `/lessons`, `/studio/social-clips`. Visited lessons survive offline.
- **Capacitor Android wrapper config** (`/capacitor.config.js`) + **daily streak push notifications** via `@capacitor/local-notifications` (`src/lib/notifications.js`). Build instructions in `/app/frontend/ANDROID.md`.

## Backlog / Next
- P1: Service-worker push notifications for web (web-push subscription + backend trigger).
- P2: Difficulty tiers (ELI12 / Standard / Deep dive).
- P2: Badges, leaderboards, certificates.
- P2: Glossary + global search.
- P3: CMS admin for content authoring.
- P3: Community / per-lesson discussion threads.

## Credentials
See `/app/memory/test_credentials.md`.
