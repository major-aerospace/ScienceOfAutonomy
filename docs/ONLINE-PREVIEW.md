# Testing the online learning preview

## Learner journey

1. Open the homepage and choose Explore the foundations.
2. Try a lesson as a guest. Switch between Explorer, Standard and Deeper explanations.
3. Enter a prediction, change an experiment setting, and write a reflection. Review the model limitations and primary reference links.
4. Answer both formative questions. Read the explanations, retry, and observe that guest results are explicitly not saved.
5. Create a test account or sign in. Submit a lesson; return to the course hub to verify progress. Revisit and submit a lower score: earlier completion should remain.
6. If an instructor provided a code, join the cohort from the course hub. Joining shares your progress, latest submitted reflections and experiment settings with that instructor.
7. Sign out before another person uses the browser.

## Instructor journey

Provision an administrator using the documented bootstrap environment variables. Register a separate instructor account, then use the administrator's Instructor workspace to enable instructor access for that existing account. The instructor must refresh or sign in again to refresh their displayed role.

Create a cohort, copy its join code, and join it from a separate learner account. Refresh the cohort view after the learner submits checks. Verify learner progress, support signals and reflections. An unrelated instructor must not be able to read that cohort.

## Scope and data

Use test identities and non-sensitive reflections in previews. There is no managed child-account flow, self-service account deletion, password recovery, email verification, or validated aptitude scoring in this release. Course completion is not a professional qualification. The six-lesson introductory course is a foundation for further content development.

Records use the configured Mongo database. The task's disposable developer preview uses an in-memory substitute and loses data when its API restarts; it is not the production data layer. Do not use that preview script as a deployment server.

## Online staging

Use a controlled HTTPS staging origin with the frontend build served at `/` and FastAPI proxied at `/api`. Configure a persistent Mongo database and strong secrets using the README. Keep environments and databases separate. Do not enable Google sign-in until the provider and redirect domain have been verified.

Before a public launch, complete the README deployment gates: authentication recovery and abuse controls, privacy and deletion, child-account design if children will register, database backups and restore checks, real-database integration, and operational monitoring. No staging provider, public URL, domain, or payment method was selected by this source update.

## Offline lab

Deferred. No claim is made that this version is a packaged air-gapped deployment or tested at 90 simultaneous clients.
