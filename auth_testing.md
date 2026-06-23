# Auth Testing Playbook — Emergent Google Auth

## Setup test user via Mongo

```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  goal: 'curious',
  xp: 0, level: 1, streak: 0, badges: [], tier: 'standard',
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Endpoints
- POST /api/auth/google-callback — body: { session_id } → exchanges with auth.emergentagent.com → sets cookie, stores session
- GET /api/auth/me — verifies cookie or Bearer header
- POST /api/auth/logout — deletes session + clears cookie

## Browser flow
1. User clicks "Continue with Google" → `window.location = https://auth.emergentagent.com/?redirect=${origin}/auth-callback`
2. After Google login, redirected back to `${origin}/auth-callback#session_id=...`
3. Frontend extracts `session_id`, POSTs to `/api/auth/google-callback` → backend exchanges, sets cookie
4. Redirect to /dashboard
