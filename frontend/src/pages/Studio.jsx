import { useEffect, useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { TID } from "@/lib/tids";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function Studio() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.get("/studio/social-clips").then(({ data }) => setItems(data.items || []));
  }, []);

  const tracks = Array.from(new Set(items.map((i) => i.trackId)));
  const filtered = filter === "all" ? items : items.filter((i) => i.trackId === filter);

  const copy = (clip, id) => {
    const text = `${clip.hook}\n\n${clip.coreIdea}\n\n${clip.takeaway}\n${clip.hashtags.join(" ")}`;
    navigator.clipboard?.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">CONTENT · STUDIO</div>
          <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Social Engine</h1>
          <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">
            Every lesson ships with a ready-to-shoot 30–60s vertical script. Pick, copy, schedule.
          </p>
        </div>
        <a
          href={`${API_BASE}/studio/calendar.csv`}
          data-testid={TID.studioDownloadCsv}
          className="soa-btn-primary"
          download
        >
          <Download className="w-4 h-4" /> 4-week calendar (CSV)
        </a>
      </div>

      <div className="flex gap-2 flex-wrap mt-6">
        <button onClick={() => setFilter("all")} className={`soa-chip ${filter === "all" ? "soa-chip-primary" : ""}`}>ALL</button>
        {tracks.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`soa-chip ${filter === t ? "soa-chip-primary" : ""}`}>{t.replace("track-", "").toUpperCase()}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {filtered.map(({ lessonId, lessonTitle, clip }) => (
          <div key={lessonId} data-testid={TID.studioClip(lessonId)} className="soa-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">LESSON · {lessonId}</div>
                <div className="soa-display text-lg font-bold mt-1">{lessonTitle}</div>
              </div>
              <button onClick={() => copy(clip, lessonId)} className="soa-btn-ghost shrink-0">
                {copied === lessonId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              <Row label="HOOK" value={clip.hook} />
              <Row label="CORE IDEA" value={clip.coreIdea} />
              <Row label="VISUAL" value={clip.visualSuggestion} />
              <Row label="TAKEAWAY" value={clip.takeaway} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {clip.hashtags.map((h) => <span key={h} className="soa-chip">{h}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[80px,1fr] gap-3 items-baseline">
      <div className="soa-label">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
