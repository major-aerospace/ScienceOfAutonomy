import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";
import { Plane } from "lucide-react";

const linkBase = "soa-mono uppercase tracking-widest text-[12px] font-semibold px-3 py-2 transition-colors";
const linkActive = "text-[rgb(var(--soa-primary))]";
const linkIdle = "text-[rgb(var(--soa-ink-2))] hover:text-[rgb(var(--soa-ink))]";

export default function Nav() {
  const { user, logout } = useAuth();
  const authed = user && user !== false;

  return (
    <header data-testid={TID.nav} className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[rgb(var(--soa-line))]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" data-testid={TID.navLogo} className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 grid place-items-center border-[1.5px] border-black">
            <Plane className="w-4 h-4" strokeWidth={1.75} />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[rgb(var(--soa-primary))] soa-pulse-dot" />
          </div>
          <div className="leading-none">
            <div className="soa-display text-[15px] font-black tracking-tight">SCIENCE OF AUTONOMY</div>
            <div className="soa-mono text-[9px] tracking-[0.25em] text-[rgb(var(--soa-ink-3))] mt-0.5">
              v1.0 · PRINCIPLES OF UNMANNED SYSTEMS
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink data-testid={TID.navLinkTracks} to="/tracks" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>Curriculum</NavLink>
          <NavLink data-testid={TID.navLinkAssessment} to="/assessment" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>Dronability</NavLink>
          <NavLink data-testid={TID.navLinkStudio} to="/studio" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>Studio</NavLink>
          {authed && (
            <>
              <NavLink data-testid="nav-link-review" to="/review" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>Review</NavLink>
              <NavLink data-testid={TID.navLinkDashboard} to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>Dashboard</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <div className="hidden sm:flex flex-col items-end leading-none mr-2">
                <span className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">XP · STREAK</span>
                <span className="soa-mono text-[13px] font-bold mt-0.5">
                  {user.xp} <span className="text-[rgb(var(--soa-ink-3))]">·</span> {user.streak}d
                </span>
              </div>
              <button data-testid={TID.navLogout} onClick={logout} className="soa-btn-ghost">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid={TID.navLogin} className="soa-btn-ghost">Sign in</Link>
              <Link to="/register" data-testid={TID.navRegister} className="soa-btn-primary">Start</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
