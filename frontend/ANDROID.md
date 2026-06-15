# Science of Autonomy · Android (Capacitor) Wrapper

This project ships as a PWA first. The PWA is installable on Android directly from the browser ("Add to home screen") and uses the service worker (`/public/service-worker.js`) for offline reading of visited lessons + cached static assets.

## Building a native Android wrapper

Prerequisites: Android Studio, JDK 17, Android SDK Platform 34+.

```bash
cd /app/frontend

# 1) Build the production web bundle (output: ./build)
yarn build

# 2) Install Capacitor (only needs to be done once)
yarn add @capacitor/core @capacitor/cli @capacitor/android @capacitor/local-notifications

# 3) Initialize (config already provided in capacitor.config.js — skip if present)
# npx cap init "Science of Autonomy" "com.scienceofautonomy.app" --web-dir=build

# 4) Add the Android platform
npx cap add android

# 5) Sync the built web assets into the native project
npx cap sync

# 6) Open in Android Studio to build / run on a device
npx cap open android
```

## Streak push notifications

`src/lib/notifications.js` registers a daily local notification at 19:00 via `@capacitor/local-notifications`. To enable it, the app calls `ensureStreakReminderScheduled()` after sign-in on a Capacitor-wrapped build. On the web, this is a no-op (web push requires a separate Notification API + service-worker push subscription setup that isn't wired in this MVP).

## Offline cache

The service worker registers in production builds only (`src/lib/sw.js`). Strategy:
- App shell + navigations: network-first → fallback to cached `/`.
- API `/tracks`, `/lessons`, `/studio/social-clips`: network-first → fallback to cache (so lessons you've opened once still read offline).
- Static JS/CSS/images/fonts/glTF/WASM: cache-first with background revalidation.

Increment the `VERSION` constant in `service-worker.js` to force-invalidate all caches on the next visit.
