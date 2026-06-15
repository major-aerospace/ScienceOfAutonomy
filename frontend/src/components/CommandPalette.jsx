import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Search, Command as Cmd } from "lucide-react";

// Global Cmd+K / Ctrl+K search palette.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ lessons: [], tracks: [], glossary: [] });
  const inputRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else { setQ(""); setResults({ lessons: [], tracks: [], glossary: [] }); }
  }, [open]);

  useEffect(() => {
    if (!q || q.length < 2) { setResults({ lessons: [], tracks: [], glossary: [] }); return; }
    const id = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(q)}`).then(({ data }) => setResults(data));
    }, 120);
    return () => clearTimeout(id);
  }, [q]);

  const go = (path) => { setOpen(false); nav(path); };

  if (!open) {
    return (
      <button
        data-testid="open-command-palette"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 border border-[rgb(var(--soa-line))] rounded-sm px-2.5 py-1.5 text-[rgb(var(--soa-ink-3))] hover:border-[rgb(var(--soa-ink))] transition-colors"
        title="Search · ⌘K"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="soa-mono text-[11px] tracking-widest">SEARCH</span>
        <span className="ml-3 soa-mono text-[10px] tracking-widest border border-[rgb(var(--soa-line))] px-1.5 py-0.5 rounded-sm">⌘K</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-2xl bg-white border-[1.5px] border-[rgb(var(--soa-ink))] rounded-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-[rgb(var(--soa-line))]">
          <Search className="w-4 h-4 text-[rgb(var(--soa-ink-3))]" />
          <input
            ref={inputRef}
            data-testid="command-palette-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lessons, tracks, glossary…"
            className="w-full py-3 outline-none text-base bg-transparent"
          />
          <kbd className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.length < 2 ? (
            <div className="p-6 text-center soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))]">
              TYPE AT LEAST 2 CHARACTERS
            </div>
          ) : (
            <>
              <Group title="LESSONS" items={results.lessons} render={(l) => (
                <button key={l.id} data-testid={`palette-lesson-${l.id}`} onClick={() => go(`/lessons/${l.id}`)} className="w-full text-left p-3 hover:bg-[rgb(var(--soa-bg))] rounded-sm border border-transparent hover:border-[rgb(var(--soa-line))]">
                  <div className="soa-display font-bold text-sm">{l.title}</div>
                  <div className="text-xs text-[rgb(var(--soa-ink-2))] mt-0.5">{l.summary}</div>
                </button>
              )} />
              <Group title="TRACKS" items={results.tracks} render={(t) => (
                <button key={t.id} onClick={() => go(`/tracks/${t.id}`)} className="w-full text-left p-3 hover:bg-[rgb(var(--soa-bg))] rounded-sm border border-transparent hover:border-[rgb(var(--soa-line))]">
                  <div className="soa-display font-bold text-sm">{t.title}</div>
                </button>
              )} />
              <Group title="GLOSSARY" items={results.glossary} render={(g) => (
                <button key={g.term} onClick={() => go(`/glossary`)} className="w-full text-left p-3 hover:bg-[rgb(var(--soa-bg))] rounded-sm border border-transparent hover:border-[rgb(var(--soa-line))]">
                  <div className="soa-display font-bold text-sm">{g.term}</div>
                  <div className="text-xs text-[rgb(var(--soa-ink-2))] mt-0.5 line-clamp-2">{g.def}</div>
                </button>
              )} />
              {results.lessons.length === 0 && results.tracks.length === 0 && results.glossary.length === 0 && (
                <div className="p-6 text-center soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))]">
                  NOTHING MATCHED
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, items, render }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="px-2 py-2">
      <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] px-2 py-1">{title}</div>
      <div className="space-y-1">{items.map(render)}</div>
    </div>
  );
}
