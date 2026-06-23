import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH.
// This page is rendered when the URL contains `#session_id=...` after returning from
// `auth.emergentagent.com`. It exchanges the one-time session_id with our backend, which
// issues OUR OWN JWT (the same JWT the rest of the app already uses).
export default function AuthCallback() {
  const nav = useNavigate();
  const loc = useLocation();
  const { setUser } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = loc.hash || window.location.hash || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      toast.error("Missing Google session — please try signing in again.");
      nav("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await api.post(
          "/auth/google-session",
          {},
          { headers: { "X-Session-ID": sessionId } }
        );
        if (data.token) localStorage.setItem("soa_token", data.token);
        setUser(data.user);
        // Strip the session_id from the URL by replacing history before navigating
        window.history.replaceState({}, "", "/auth/callback");
        toast.success(`Welcome ${data.user.name}`);
        nav(data.isNewUser ? "/onboarding" : "/dashboard", { replace: true });
      } catch (e) {
        toast.error("Could not complete Google sign-in.");
        nav("/login", { replace: true });
      }
    })();
  }, [loc, nav, setUser]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center">
        <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]" data-testid="auth-callback-status">SIGNING YOU IN</div>
        <div className="soa-display text-3xl font-black mt-2 tracking-tight">One second…</div>
        <div className="text-sm text-[rgb(var(--soa-ink-3))] mt-2">Linking your Google account.</div>
      </div>
    </div>
  );
}
