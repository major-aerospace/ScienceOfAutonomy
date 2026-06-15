import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Sparkles, Rocket, Award, Trophy, Sliders, Radar, Users, Brain, Flame, GraduationCap, Lock } from "lucide-react";

const ICONS = {
  sparkles: Sparkles, rocket: Rocket, award: Award, trophy: Trophy,
  sliders: Sliders, radar: Radar, users: Users, brain: Brain,
  flame: Flame, "graduation-cap": GraduationCap,
};

export default function BadgeShelf() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/badges/me").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="mt-12" data-testid="badge-shelf">
      <div className="flex items-end justify-between">
        <div>
          <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">ACHIEVEMENTS</div>
          <h2 className="soa-display text-2xl md:text-3xl font-bold mt-1">Badges</h2>
        </div>
        <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-2))]">
          {data.earnedCount} / {data.totalCount} EARNED
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
        {data.badges.map((b) => {
          const Icon = ICONS[b.icon] || Sparkles;
          return (
            <div
              key={b.id}
              data-testid={`badge-${b.id}`}
              className={`soa-card p-4 ${b.earned ? "border-[#0047FF]" : "opacity-50"}`}
              title={b.description}
            >
              <div className="flex items-center justify-between">
                {b.earned
                  ? <Icon className="w-5 h-5 text-[#0047FF]" strokeWidth={1.5} />
                  : <Lock className="w-4 h-4 text-[rgb(var(--soa-ink-3))]" strokeWidth={1.5} />
                }
                {b.earned && <span className="soa-mono text-[9px] tracking-widest text-[#00C759]">EARNED</span>}
              </div>
              <div className="soa-display font-bold text-sm mt-2 leading-tight">{b.title}</div>
              <div className="text-xs text-[rgb(var(--soa-ink-2))] mt-1 line-clamp-2">{b.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
