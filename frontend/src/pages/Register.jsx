import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";
import { formatApiErrorDetail } from "@/lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH.
function startGoogleSignIn() {
  const redirectUrl = window.location.origin + "/auth/callback";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await register({ email, password, name });
      nav("/onboarding");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))]">NEW · OPERATOR</div>
      <h1 className="soa-display text-4xl font-black tracking-tight mt-2">Create account</h1>
      <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">Track progress, earn XP, unlock adaptive paths.</p>

      <button
        type="button"
        data-testid="google-signup-button"
        onClick={startGoogleSignIn}
        className="mt-8 w-full flex items-center justify-center gap-3 border border-[rgb(var(--soa-line))] rounded-md py-3 text-sm font-medium hover:bg-[rgb(var(--soa-surface-2))] transition-colors"
      >
        <GoogleGlyph /> Sign up with Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[rgb(var(--soa-line))]" />
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">OR · EMAIL</div>
        <div className="flex-1 h-px bg-[rgb(var(--soa-line))]" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="soa-label">Name</label>
          <input data-testid={TID.authName} required value={name} onChange={(e) => setName(e.target.value)} className="soa-input mt-1" />
        </div>
        <div>
          <label className="soa-label">Email</label>
          <input data-testid={TID.authEmail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="soa-input mt-1" />
        </div>
        <div>
          <label className="soa-label">Password (≥ 6 chars)</label>
          <input data-testid={TID.authPassword} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="soa-input mt-1" />
        </div>
        {err && <div data-testid={TID.authError} className="text-sm text-[#FF3B30] soa-mono">{err}</div>}
        <button data-testid={TID.authSubmit} disabled={busy} className="soa-btn-primary w-full justify-center">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-sm text-[rgb(var(--soa-ink-2))]">
        Already registered?{" "}
        <Link data-testid={TID.authSwitch} to="/login" className="text-[#0047FF] underline underline-offset-2">Sign in</Link>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.58-5.05-3.72H.96v2.34A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.42 5.42 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.57-2.57A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58z"/>
    </svg>
  );
}
