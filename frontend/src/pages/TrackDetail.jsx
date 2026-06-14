import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { TID } from "@/lib/tids";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

export default function TrackDetail() {
  const { trackId } = useParams();
  const [track, setTrack] = useState(null);

  useEffect(() => {
    api.get(`/tracks/${trackId}`).then(({ data }) => setTrack(data));
  }, [trackId]);

  if (!track) return <div className="p-12 soa-mono text-sm">LOADING…</div>;

  const totalLessons = track.modules.reduce((n, m) => n + m.lessons.length, 0);
  const done = track.modules.reduce((n, m) => n + m.lessons.filter((l) => l.completed).length, 0);
  const pct = Math.round((done / Math.max(1, totalLessons)) * 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link to="/tracks" className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))] hover:text-[rgb(var(--soa-ink))]">
        ← ALL TRACKS
      </Link>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-3">{track.title}</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">{track.summary}</p>

      <div className="mt-6 grid md:grid-cols-[1fr,auto] gap-4 items-center">
        <div className="h-2 bg-[rgb(var(--soa-line))] rounded-sm overflow-hidden">
          <div className="h-full bg-[#0047FF]" style={{ width: `${pct}%` }} />
        </div>
        <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-2))]">{done}/{totalLessons} · {pct}%</div>
      </div>

      <div className="space-y-10 mt-12">
        {track.modules.map((m) => (
          <div key={m.id} data-testid={TID.moduleCard(m.id)}>
            <div className="flex items-end justify-between">
              <div>
                <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">MODULE · {String(m.order).padStart(2, "0")}</div>
                <h2 className="soa-display text-2xl md:text-3xl font-bold mt-1">{m.title}</h2>
              </div>
            </div>
            <div className="grid gap-3 mt-4">
              {m.lessons.map((l) => (
                <Link
                  key={l.id}
                  to={`/lessons/${l.id}`}
                  data-testid={TID.lessonRow(l.id)}
                  className="soa-card soa-card-clickable p-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    {l.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#00C759]" strokeWidth={1.6} />
                    ) : (
                      <Circle className="w-5 h-5 text-[rgb(var(--soa-ink-3))]" strokeWidth={1.4} />
                    )}
                    <div>
                      <div className="soa-display text-lg font-bold leading-tight">{l.title}</div>
                      <div className="text-sm text-[rgb(var(--soa-ink-2))]">{l.summary}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{l.estMinutes} MIN</div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
