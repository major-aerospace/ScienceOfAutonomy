# Emergent Google Auth — Testing Playbook (Science of Autonomy)

This playbook is the source of truth for testing the Emergent-managed Google authentication on top of the existing JWT email/password auth.

## Architecture
- The frontend redirects the user to `https://auth.emergentagent.com/?redirect={origin}/auth/callback`.
- Emergent redirects back to `{origin}/auth/callback#session_id={session_id}`.
- The frontend AuthCallback page POSTs `session_id` (as `X-Session-ID` header) to the backend `POST /api/auth/google-session`.
- The backend calls `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` server-side, gets `{id, email, name, picture, session_token}`, finds-or-creates a row in `db.users`, then issues OUR OWN access JWT (same JWT pipeline used by `/api/auth/login`).
- The frontend stores the JWT in `localStorage` under `soa_token` (same key already used by JWT login) and treats the user as logged in. Bearer JWT continues to drive all `/api/*` calls.
- Existing email/password login is untouched.

## Endpoints
- `POST /api/auth/google-session`
  - Header: `X-Session-ID: <session_id from URL fragment>`
  - Returns: `{user: {...}, token: "<jwt>"}` and sets the `access_token` httpOnly cookie.

## Test paths
1. **Happy path (new Google user)**
   - From `/login`, click "Continue with Google" → redirected to `auth.emergentagent.com`.
   - After Google consent, return to `/auth/callback#session_id=...`.
   - Frontend processes silently and navigates to `/dashboard`.
   - DB: a new row exists in `db.users` with `email` from Google and `auth_provider="google"`. No password_hash.

2. **Existing email account linked to Google**
   - Pre-create a user via `/api/auth/register` (password auth).
   - Sign in with Google using the same email.
   - Backend MUST NOT create a duplicate user. It links the existing user (set `auth_provider="google,password"`) and issues a JWT for that user.

3. **Auth-gated routes**
   - `/dashboard`, `/onboarding`, `/admin`, `/review`, `/certificates/:trackId` should accept the Google-issued JWT.

4. **Legacy email/password login still works**
   - `/api/auth/login` with the seeded admin (`admin@scienceofautonomy.app` / `autonomy2026`) must keep returning 200 with a JWT.

## Quick backend smoke
```bash
curl -X POST $REACT_APP_BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scienceofautonomy.app","password":"autonomy2026"}'
```

## Critical implementation rules
- REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH.
- Always use `window.location.origin + '/auth/callback'` for the redirect.
- Backend MUST call `/auth/v1/env/oauth/session-data` from the server, never from the browser.
- We do NOT use Emergent's `session_token` for our own session; we issue our own JWT (consistent with the existing app).

## Test identities
- See `/app/memory/test_credentials.md` for the seeded admin email/password.
- For Google sign-in, any Gmail account can be used; the user will be created on first login.
