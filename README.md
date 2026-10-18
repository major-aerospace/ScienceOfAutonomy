# Science of Autonomy

Online learning application: React frontend, FastAPI backend, MongoDB. Version 0.3 adds Autonomy Foundations: six guided lessons, three explanation depths, interactive models, formative checks, saved attempts, and instructor cohorts. The existing 10-track, 46-lesson topic library and flight playground remain available. Assessments are practice feedback, not validated aptitude or selection measures.

See [the version history](VERSIONS.md) and [the online preview guide](docs/ONLINE-PREVIEW.md). Offline lab packaging is deferred.

## Local setup

1. Use an isolated Python environment and install `backend/requirements.txt`.
2. Provide `MONGO_URL`, `DB_NAME`, and a randomly generated `JWT_SECRET` (at least 32 bytes). Keep secrets outside source control.
3. Run `uvicorn server:app --host 127.0.0.1 --port 8000` from `backend/`.
4. From `frontend/`, install using the declared Yarn 1.22.22 package manager, then run `yarn start`. For split-origin development set `REACT_APP_BACKEND_URL=http://127.0.0.1:8000` and set backend `CORS_ORIGINS` to the exact frontend origin.

The frontend defaults to same-origin `/api` when `REACT_APP_BACKEND_URL` is absent. Production hosting must proxy `/api` to FastAPI and serve the built React app, rewriting non-file frontend routes to `index.html`. Use HTTPS. Database indexes are installed at API startup; failures must block readiness.

## Administrator setup

No administrator is created unless both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are explicitly configured. The password must be at least 12 characters and at most 72 UTF-8 bytes. Existing accounts are never silently promoted or overwritten. Remove bootstrap credentials from runtime configuration after provisioning.

**Migration requirement:** removing default credentials from code does not change existing database accounts. Audit existing admin users, rotate any credentials previously used in public tests/defaults, and rotate `JWT_SECRET` to invalidate previously issued tokens before a public release. Do this through the operator's controlled deployment process.

## Completion API

`POST /api/progress/complete` accepts `{"lesson_id":"...","answers":[0,1]}` with one integer option index per question. The backend resolves the current lesson (including CMS overrides), validates the answers, and calculates the score. A client-supplied percentage cannot substitute for answers. Lessons without a quiz accept an empty answer list and receive base completion XP. Retakes can improve the recorded score without additional XP.

These are open-book educational quizzes: answer explanations remain available to learners. They are not secure credentialing exams. Deploy frontend and backend changes together; older score-only clients will receive HTTP 422.

## Isolated regression checks

Install `pytest` and `mongomock-motor` in the test environment, then run:

```sh
python -m pytest backend/tests/unit -q
cd frontend
yarn test --watchAll=false --runInBand
yarn build
```

The unit suite uses an in-memory Mongo substitute. It cannot certify real Mongo transaction behavior, failover, production OAuth, or public deployment. Existing HTTP integration tests require an explicitly managed disposable server/database and configured test admin credentials; they default to localhost where a default is supported. Do not point them at production.

## Deployment gates

- Select host, domain, Mongo database, backups, rollback procedure, and secret storage.
- Email/password sign-in is the default. Google login is hidden unless the frontend is built with `REACT_APP_GOOGLE_AUTH_ENABLED=true`. Before enabling it, verify the Emergent-managed OAuth flow on the final HTTPS domain. It is not a configured standalone Google OAuth client.
- Publish accurate privacy/data-retention information and establish an account-deletion process. The analytics script has been removed; review all remaining external resources and the optional authentication provider before launch.
- Add gateway/API abuse controls, operational monitoring, and a real database readiness check.
- Reconcile custom lessons across search, recommendations, Studio, certificate eligibility, and track counts before advertising complete CMS support.
- Confirm accessibility, low-end mobile performance, WebGL fallback, and end-to-end learner flow on the target host.

No course exclusion threshold or entitlement policy is implemented by this review.

## Guided course and instructors

`/learn` is the course hub and `/learn/:lessonId` is the guided lesson. Guests can explore; account holders can submit and save formative checks. `/instructor` requires the `instructor` or `admin` role. An administrator can enable instructor access for an existing account from that workspace. Instructors create their own cohorts and share the generated join code. Learners join from `/learn`; instructors see only their own cohorts, while administrators can see all cohorts.

`POST /api/lab/attempts` requires `content_version: "foundations-1"` and receives answer indices, optional predictions/reflections, explanation mode and uncertainty experiment settings. The server validates and grades answers against `foundations-1`, storing append-only attempts. Course progress is derived from these records. Both checks must be correct to complete a lesson; a later lower result does not erase earlier completion. This is an open-book learning check, not a secure examination.

The API namespace `lab` is retained for course/cohort records; this release is the online edition. It does not imply an offline deployment or 90-client capacity certification.
