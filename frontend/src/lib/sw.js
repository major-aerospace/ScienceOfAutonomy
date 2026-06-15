// Registers the Science of Autonomy service worker.
// Only registers in production builds AND when SW is supported.
export function registerSW() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // Silent — offline is best-effort.
      });
    });
  }
}
