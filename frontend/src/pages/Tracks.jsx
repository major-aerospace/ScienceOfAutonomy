import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { TID } from "@/lib/tids";
import { ArrowRight } from "lucide-react";

export default function Tracks() {
  const [tracks, setTracks] = useState([]);
  useEffect(() => {
    api.get("/tracks").then(({ data }) => setTracks(data.tracks || []));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">CURRICULUM</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">
        Track → Module → Lesson
      </h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-3 max-w-2xl">
        Each track moves from the underlying science, to a present-day component, to where it matters in the world. Visual-first throughout.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {tracks.map((t) => (
          <Link
            key={t.id}
            to={`/tracks/${t.id}`}
            data-testid={TID.trackCard(t.id)}
            className="soa-card soa-card-clickable p-6 relative group"
          >
            <div className="flex items-center justify-between">
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">TRACK · {String(t.order).padStart(2, "0")}</div>
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{t.lessonCount} LESSONS</div>
            </div>
            <h2 className="soa-display text-xl md:text-2xl font-bold mt-3 leading-tight">{t.title}</h2>
            <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">{t.summary}</p>
            <div className="flex items-center justify-between mt-6 soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-2))]">
              <span>{t.moduleCount} MODULES</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
