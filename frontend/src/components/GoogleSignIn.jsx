// "Sign in with Google" via Google Identity Services (GIS).
// Google returns a signed ID token ("credential") to the browser; the backend verifies it
// against GOOGLE_CLIENT_ID and issues our own JWT. Renders nothing when
// REACT_APP_GOOGLE_CLIENT_ID is not set, so email/password keeps working on its own.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { formatApiErrorDetail } from "@/lib/api";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GIS_SRC = "https://accounts.google.com/gsi/client";

export const googleSignInEnabled = Boolean(CLIENT_ID);

let gisLoading = null;
let gisInitialized = false;
let onCredential = null; // the mounted button's handler; GIS is initialised only once

function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gisLoading = null;
        reject(new Error("Could not load Google sign-in"));
      };
      document.head.appendChild(s);
    });
  }
  return gisLoading;
}

export default function GoogleSignIn({ mode = "signin", testId }) {
  const { loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const nav = useNavigate();
  const boxRef = useRef(null);
  const [failed, setFailed] = useState(false);

  onCredential = async ({ credential }) => {
    try {
      const data = await loginWithGoogle(credential);
      toast.success(`Welcome ${data.user.name}`);
      nav(data.isNewUser ? "/onboarding" : "/dashboard", { replace: true });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Could not complete Google sign-in.");
    }
  };

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGis()
      .then(() => {
        const el = boxRef.current;
        if (cancelled || !el) return;
        if (!gisInitialized) {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (resp) => onCredential && onCredential(resp),
            ux_mode: "popup",
          });
          gisInitialized = true;
        }
        el.innerHTML = "";
        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "left",
          width: Math.max(200, Math.min(400, el.offsetWidth || 400)),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, theme]);

  if (!CLIENT_ID) return null;
  return (
    <div className="mt-8">
      <div ref={boxRef} data-testid={testId} className="w-full flex justify-center min-h-[44px]" />
      {failed && (
        <div className="mt-2 text-center text-xs soa-mono text-[rgb(var(--soa-ink-3))]">
          Google sign-in couldn't load. You can still use email below.
        </div>
      )}
    </div>
  );
}
