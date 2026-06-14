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

## What's been implemented (Feb 2026 · MVP)
- Landing page with hero 3D drone (rotating quadrotor, animated props, status HUD).
- Auth: email/password register + login + logout + /auth/me.
- Onboarding goal picker → recommends starting track.
- Curriculum: 3 tracks live (Foundations, Anatomy, GNC), 16 lessons, structured Track → Module → Lesson.
- Lesson player with block types: widget · diagram · chart · caption · takeaway · deepdive · quiz.
- Interactive widgets: PID Tuner, Lift Lab, Sensor Fusion, Swarm Sandbox, Exploded Drone, Autonomy Ladder, RTK Visualizer, BLDC Motor Commutation, Signal/Filter, Waypoint Planner, Stability Drone.
- Quiz engine (MCQ with explanations) + XP award + streak tracking.
- Dashboard (XP / level / streak / recent activity).
- Dronability self-assessment (3 mini-tasks: Mental Rotation, Vigilance, Trainability ×2) → radar chart + track recommendation.
- Content Studio: lists all lesson socialClips, copy-to-clipboard, downloadable 4-week CSV calendar.
- PWA manifest + responsive design.

## Backlog / Next
- P1: Remaining 7 tracks (Sensing & Perception, Comms, Autonomy Stack & AI, Swarms, Human Factors, Safety, Applications).
- P1: Service worker offline cache for visited lessons + assets.
- P2: Adaptive learning path (recommend next lesson based on quiz performance).
- P2: Spaced-repetition review queue.
- P2: Difficulty tiers (ELI12 / Standard / Deep dive) per lesson.
- P2: Badges, leaderboards, certificates.
- P2: Glossary + global search.
- P2: Capacitor Android wrapper + push notifications.
- P3: CMS admin for content authoring.
- P3: Community / per-lesson discussion.

## Credentials
See `/app/memory/test_credentials.md`.
