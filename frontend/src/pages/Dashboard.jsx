import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { TID } from "@/lib/tids";
import { Flame, Award, BookOpen, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import BadgeShelf from "@/components/BadgeShelf";

export default function Dashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [recommend, setRecommend] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    api.get("/progress").then(({ data }) => setProgress(data.progress || []));
    api.get("/tracks").then(({ data }) => setTracks(data.tracks || []));
    api.get("/recommend/next").then(({ data }) => setRecommend(data)).catch(() => {});
    api.get("/review/queue").then(({ data }) => setReviewCount(data.count || 0)).catch(() => {});
  }, []);

  if (!user) return null;
  const xpToNext = 100;
  const lvlXp = (user.xp || 0) % xpToNext;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">DASHBOARD</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">
        Hello, {user.name}.
      </h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2">Here's where you stand.</p>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <Stat label="LEVEL" value={user.level} sub={`${lvlXp}/${xpToNext} TO NEXT`} testid={TID.dashLevel}
              progress={lvlXp / xpToNext} icon={<Award className="w-5 h-5 text-[#0047FF]" strokeWidth={1.5} />} />
        <Stat label="XP" value={user.xp} sub="LIFETIME" testid={TID.dashXp}
              icon={<BookOpen className="w-5 h-5 text-[#0047FF]" strokeWidth={1.5} />} />
        <Stat label="STREAK" value={`${user.streak}d`} sub="ACTIVE DAYS" testid={TID.dashStreak}
              icon={<Flame className="w-5 h-5 text-[#FF3B30]" strokeWidth={1.5} />} />
      </div>

      {/* Smart cards: next lesson + review queue */}
      <div className="grid md:grid-cols-[1.4fr,1fr] gap-4 mt-8">
        {recommend?.lesson ? (
          <div className="soa-panel p-6 pt-8" data-testid="dashboard-recommend-card">
            <div className="flex items-center justify-between">
              <div className="soa-tick">ADAPTIVE · NEXT FOR YOU</div>
              <Sparkles className="w-4 h-4 text-[#0047FF]" />
            </div>
            <div className="soa-display text-2xl md:text-3xl font-bold mt-2 text-white">
              {recommend.lesson.title}
            </div>
            <p className="text-sm text-neutral-400 mt-2 max-w-md">{recommend.lesson.summary}</p>
            <div className="mt-2 soa-mono text-[10px] tracking-widest text-neutral-500">{recommend.reason}</div>
            <Link to={`/lessons/${recommend.lesson.id}`} className="soa-btn-primary mt-4 inline-flex">
              Continue · {recommend.lesson.estMinutes} min <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="soa-card p-6">
            <div className="soa-display text-xl font-bold">All caught up</div>
            <div className="text-sm text-[rgb(var(--soa-ink-2))] mt-1">Every published lesson is complete. New tracks ship soon.</div>
          </div>
        )}

        <Link to="/review" data-testid="dashboard-review-card" className="soa-card soa-card-clickable p-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">SPACED REPETITION</div>
            <RefreshCw className="w-4 h-4 text-[#0047FF]" />
          </div>
          <div className="soa-display text-4xl font-black tracking-tighter mt-2">{reviewCount}</div>
          <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] mt-1">
            {reviewCount === 0 ? "NOTHING DUE" : "DUE TODAY"}
          </div>
          <div className="mt-auto pt-4 soa-mono text-[11px] uppercase tracking-widest text-[#0047FF] inline-flex items-center gap-1">
            Open review queue <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="soa-display text-2xl md:text-3xl font-bold">Continue learning</h2>
          <Link to="/tracks" className="soa-btn-ghost">All tracks</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {tracks.map((t) => (
            <Link to={`/tracks/${t.id}`} key={t.id} className="soa-card soa-card-clickable p-5">
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">TRACK · {String(t.order).padStart(2, "0")}</div>
              <div className="soa-display text-xl font-bold mt-2">{t.title}</div>
              <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-2))] mt-3 flex items-center justify-between">
                <span>{t.lessonCount} LESSONS</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BadgeShelf />

      <div className="mt-12">
        <h2 className="soa-display text-2xl md:text-3xl font-bold">Recent activity</h2>
        {progress.length === 0 ? (
          <div className="soa-card p-6 mt-4 text-sm text-[rgb(var(--soa-ink-2))]">
            No lessons completed yet. <Link to="/tracks" className="text-[#0047FF] underline underline-offset-2">Pick a track</Link>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {progress.slice(-6).reverse().map((p) => (
              <div key={p.lesson_id} className="soa-card p-4 flex items-center justify-between">
                <div>
                  <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">LESSON</div>
                  <div className="soa-display text-base font-bold mt-0.5">{p.lesson_id}</div>
                </div>
                <div className="soa-mono text-[11px] text-[#00C759]">PASSED · {(p.score * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon, testid, progress }) {
  return (
    <div className="soa-card p-6" data-testid={testid}>
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{label}</div>
        {icon}
      </div>
      <div className="soa-display text-5xl font-black mt-3 tracking-tighter">{value}</div>
      <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] mt-2">{sub}</div>
      {progress != null && (
        <div className="mt-3 h-1.5 bg-[rgb(var(--soa-line))] rounded-sm overflow-hidden">
          <div className="h-full bg-[#0047FF]" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
