import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";
import { formatApiErrorDetail } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))]">RETURN · OPERATOR</div>
      <h1 className="soa-display text-4xl font-black tracking-tight mt-2">Sign in</h1>
      <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">Resume your progress. XP & streaks are saved.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="soa-label">Email</label>
          <input data-testid={TID.authEmail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="soa-input mt-1" />
        </div>
        <div>
          <label className="soa-label">Password</label>
          <input data-testid={TID.authPassword} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="soa-input mt-1" />
        </div>
        {err && <div data-testid={TID.authError} className="text-sm text-[#FF3B30] soa-mono">{err}</div>}
        <button data-testid={TID.authSubmit} disabled={busy} className="soa-btn-primary w-full justify-center">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-sm text-[rgb(var(--soa-ink-2))]">
        New here?{" "}
        <Link data-testid={TID.authSwitch} to="/register" className="text-[#0047FF] underline underline-offset-2">Create an account</Link>
      </div>
      <div className="mt-2 text-sm text-[rgb(var(--soa-ink-3))]">
        Or <Link to="/tracks" className="underline underline-offset-2">explore as guest</Link>.
      </div>
    </div>
  );
}
