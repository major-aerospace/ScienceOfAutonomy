/// <reference types="@capacitor/cli" />
// Capacitor configuration for the Android wrapper of Science of Autonomy.
// To build the Android app:
//   1) From /app/frontend, run: yarn build
//   2) yarn add @capacitor/core @capacitor/cli @capacitor/android @capacitor/local-notifications
//   3) npx cap init "Science of Autonomy" "com.scienceofautonomy.app" --web-dir=build
//   4) npx cap add android
//   5) npx cap sync
//   6) npx cap open android   (opens Android Studio)
//
// The local-notifications plugin powers the daily streak reminder (see src/lib/notifications.js).

const config = {
  appId: "com.scienceofautonomy.app",
  appName: "Science of Autonomy",
  webDir: "build",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#0047FF",
      sound: "default",
    },
  },
  // Loading the latest preview URL keeps the wrapper a thin shell during early phases.
  // Comment out the `server` block to ship a fully-bundled APK against /build assets.
  // server: { url: "https://drone-science-learn.preview.emergentagent.com", cleartext: false },
};

module.exports = config;
