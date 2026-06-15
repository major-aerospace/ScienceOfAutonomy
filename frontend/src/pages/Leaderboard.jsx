import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Flame, Trophy, BookOpen } from "lucide-react";

export default function Leaderboard() {
  const [metric, setMetric] = useState("xp");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.get(`/leaderboard?metric=${metric}`).then(({ data }) => setEntries(data.entries || []));
  }, [metric]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">GLOBAL · LEADERBOARD</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Top of the field</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-xl">
        Ranked by lifetime XP or current streak. Names only — emails are private.
      </p>

      <div className="flex gap-2 mt-6">
        <button data-testid="leaderboard-tab-xp" onClick={() => setMetric("xp")} className={`soa-chip ${metric === "xp" ? "soa-chip-primary" : ""}`}>BY XP</button>
        <button data-testid="leaderboard-tab-streak" onClick={() => setMetric("streak")} className={`soa-chip ${metric === "streak" ? "soa-chip-primary" : ""}`}>BY STREAK</button>
      </div>

      <div className="mt-8 soa-card overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-[rgb(var(--soa-ink-2))]">No one's on the board yet. Be first.</div>
        ) : (
          entries.map((e) => (
            <div
              key={e.rank}
              data-testid={`leaderboard-row-${e.rank}`}
              className={`flex items-center justify-between p-4 border-b border-[rgb(var(--soa-line))] last:border-0 ${e.rank === 1 ? "bg-[#0047FF]/5" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className={`soa-mono font-bold text-2xl w-10 text-center ${e.rank === 1 ? "text-[#0047FF]" : "text-[rgb(var(--soa-ink-3))]"}`}>
                  {e.rank === 1 ? <Trophy className="w-6 h-6 inline text-[#0047FF]" strokeWidth={1.6} /> : e.rank}
                </div>
                <div>
                  <div className="soa-display text-lg font-bold">{e.name}</div>
                  <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">
                    LV {e.level} · {e.badges} BADGES
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 soa-mono text-sm font-bold">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-[#0047FF]" /> {e.xp} XP</span>
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-[#FF3B30]" /> {e.streak}d</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
