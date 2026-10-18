# Science of Autonomy

A vendor-neutral, visual-first learning platform for the science of unmanned and autonomous systems. It has interactive lessons, a simulator, a Dronability self-assessment, XP/streaks, badges, certificates and an admin CMS.

| Part | Stack | Hosted on (free tier) |
|---|---|---|
| Frontend | React 19 · CRA/CRACO · Tailwind · react-three-fiber · Recharts | Cloudflare Pages |
| Backend | FastAPI · Motor (MongoDB) · JWT auth · Google sign-in | Render |
| Database | MongoDB | MongoDB Atlas M0 |

---

## Run it locally

**Backend** (Python 3.11 and a MongoDB, either a local `mongod` or a free Atlas cluster):

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # then fill in JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
uvicorn server:app --reload --port 8001
```

**Frontend** (Node 22, Yarn 1):

```bash
cd frontend
cp .env.example .env        # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start                  # http://localhost:3000
```

**Tests.** These run against a live backend and create throwaway `TEST_` users:

```bash
cd backend
BACKEND_URL=http://localhost:8001 ADMIN_EMAIL=... ADMIN_PASSWORD=... pytest tests
```

---

## Configuration

Backend (`backend/.env` locally, Render dashboard in production):

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URL` | yes | Atlas connection string (`mongodb+srv://…`). |
| `DB_NAME` | yes | e.g. `science_of_autonomy`. |
| `JWT_SECRET` | yes | 32+ random characters. **The server refuses to start without it.** Render generates one. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for admin | The one admin account. The password must be 12+ characters. There are **no defaults**. Change the password here and restart to rotate it. |
| `GOOGLE_CLIENT_ID` | for Google sign-in | OAuth *Web application* client ID. Leave empty to turn Google sign-in off. |
| `CORS_ORIGINS` | yes in prod | Frontend URL(s), comma-separated, no trailing slash. |

Frontend (Cloudflare Pages build variables; they are baked in at build time, so **redeploy after changing them**):

| Variable | Notes |
|---|---|
| `REACT_APP_BACKEND_URL` | Backend URL, no trailing slash. |
| `REACT_APP_GOOGLE_CLIENT_ID` | Same client ID as the backend. When it's empty, the Google button is hidden. |
| `NODE_VERSION` | `22` (also pinned in `frontend/.nvmrc`). |

---

## Deploy (about 30 minutes, all free tiers)

**1. Database: MongoDB Atlas**
1. Create a free **M0** cluster in **AWS Singapore (ap-southeast-1)**, the same region as the API below.
2. *Database Access*: add a database user with a long random password.
3. *Network Access*: allow `0.0.0.0/0`. Render's free tier has no fixed outbound IPs.
4. *Connect → Drivers*: copy the `mongodb+srv://…` string and put the user's password into it.

**2. Backend: Render**
1. Render → **New → Blueprint** → choose this repo. `render.yaml` sets everything up.
2. Fill in the prompted values:
   - `MONGO_URL`: from step 1.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: use a password manager to generate 20+ characters.
   - `GOOGLE_CLIENT_ID`: from step 3. You can add it later.
   - `CORS_ORIGINS`: your Pages URL from step 4, e.g. `https://science-of-autonomy.pages.dev`.
3. Wait for the deploy, then open `https://<service>.onrender.com/api/`. It should say `"status": "ok"`.
   *Free instances sleep after about 15 minutes idle, so the first request after that takes up to a minute.*

**3. Google sign-in: Google Cloud Console**
1. **APIs & Services → OAuth consent screen**: choose External. Enter the app name *Science of Autonomy* and your support email. The scopes are the defaults (email, profile, openid). Then **Publish app**. Basic scopes need no Google review.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins**, add `https://science-of-autonomy.pages.dev`, any custom domain, `http://localhost:3000` and `http://localhost`. No redirect URIs are needed.
4. Copy the client ID into `GOOGLE_CLIENT_ID` on Render and into `REACT_APP_GOOGLE_CLIENT_ID` on Pages.

**4. Frontend: Cloudflare Pages**
1. **Workers & Pages → Create → Pages → Connect to Git** → this repo.
2. Use these build settings:
   - Framework preset: *Create React App*
   - Root directory: `frontend`
   - Build command: `yarn build`
   - Output directory: `build`
3. Set the environment variables: `REACT_APP_BACKEND_URL`, `REACT_APP_GOOGLE_CLIENT_ID`, and `NODE_VERSION=22`.
4. Deploy. Single-page-app routing works out of the box.

**5. Close the loop.** Make sure the final Pages URL (and any custom domain) is in both `CORS_ORIGINS` on Render and the Google *Authorized JavaScript origins*. Then open the site, sign in as admin and check `/admin`.

---

## Security notes

- **The old Emergent preview admin password is public in this repo's git history.** Treat it as compromised. Never reuse it, and don't reuse that preview's database. A new deployment has no admin until you set `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- **Password sign-in is throttled.** After 10 wrong passwords for one email within 15 minutes, that email is locked for 15 minutes. Google sign-in is unaffected.
- **Google sign-in checks the token on the server.** It verifies the signature, audience (`GOOGLE_CLIENT_ID`), issuer, expiry and that the email is verified. A Google login with the same email as an existing account links to that account and never creates a duplicate.
- **Never commit `.env` files.** They are git-ignored, and only the `.env.example` templates are tracked.
- Consider making this repository private. It holds the curriculum and the assessment scoring logic.

## Android

The app ships as an installable PWA. On Android Chrome, use **Install app**. Icons and the manifest are in `frontend/public/`. For a native wrapper, see `frontend/ANDROID.md`.

## Layout

```
backend/    FastAPI app (server.py), auth, seed curriculum, tests/
frontend/   React app (src/pages, src/components/widgets, src/lib)
render.yaml Render blueprint for the API
memory/     Product requirements history (PRD.md)
```
