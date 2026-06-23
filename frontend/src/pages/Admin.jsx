import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trash2, Plus, Users, BookOpen, MessageSquare, BarChart3, FileText, Pencil, RotateCcw, X, Search } from "lucide-react";

export default function Admin() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [editing, setEditing] = useState(null); // lesson id
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    refresh();
  }, [user]);

  const refresh = () => {
    Promise.all([
      api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {}),
      api.get("/tracks").then(({ data }) => setTracks(data.tracks || [])),
      api.get("/admin/all-lessons").then(({ data }) => setAllLessons(data.lessons || [])).catch(() => {}),
    ]);
  };

  const filtered = useMemo(() => {
    return allLessons.filter((l) => {
      if (trackFilter !== "all" && l.trackId !== trackFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q);
    });
  }, [allLessons, query, trackFilter]);

  if (!ready) return <div className="p-12 soa-mono text-sm">LOADING…</div>;
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">ADMIN · CONSOLE</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Curriculum CMS</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">
        Edit any lesson — seed or custom — without touching code. Edits persist in the database.
      </p>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-5 gap-4 mt-8">
          <StatTile icon={<Users className="w-4 h-4 text-[#0047FF]" />} label="USERS" value={stats.users} />
          <StatTile icon={<BookOpen className="w-4 h-4 text-[#0047FF]" />} label="LESSON COMPLETIONS" value={stats.lessonsCompleted} />
          <StatTile icon={<BarChart3 className="w-4 h-4 text-[#0047FF]" />} label="ASSESSMENTS" value={stats.assessments} />
          <StatTile icon={<FileText className="w-4 h-4 text-[#0047FF]" />} label="CUSTOM LESSONS" value={stats.customLessons} />
          <StatTile icon={<MessageSquare className="w-4 h-4 text-[#0047FF]" />} label="COMMENTS" value={stats.comments} />
        </div>
      )}

      {/* Top lessons */}
      {stats && stats.topLessons.length > 0 && (
        <div className="mt-10">
          <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">MOST COMPLETED · TOP 10</div>
          <div className="grid md:grid-cols-2 gap-2 mt-3">
            {stats.topLessons.map((r, i) => (
              <div key={r.lessonId} className="soa-card p-3 flex items-center justify-between">
                <span className="soa-mono text-sm">{i + 1}. {r.lessonId}</span>
                <span className="soa-mono text-[#0047FF] font-bold">{r.completions}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <NewLessonForm tracks={tracks} onCreated={refresh} />

      {/* All lessons CMS */}
      <div className="mt-12">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="soa-display text-2xl font-bold">All lessons</h2>
            <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-1">{allLessons.length} total · seed + custom</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[rgb(var(--soa-ink-3))] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                data-testid="admin-search"
                placeholder="Search lessons…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="soa-input pl-9 text-sm w-64"
              />
            </div>
            <select
              data-testid="admin-track-filter"
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="soa-input text-sm"
            >
              <option value="all">All tracks</option>
              {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {filtered.map((l) => (
            <div key={l.id} data-testid={`admin-lesson-${l.id}`} className="soa-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="soa-display text-base font-bold truncate">{l.title}</div>
                  <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] mt-1">
                    {l.id} · {l.trackId.replace("track-", "")} · {l.origin === "seed" ? "SEED" : "CUSTOM"}
                    {l.edited && <span className="ml-2 text-[#0047FF]">· EDITED</span>}
                  </div>
                  <div className="text-xs text-[rgb(var(--soa-ink-2))] mt-2 line-clamp-2">{l.summary}</div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    data-testid={`admin-edit-${l.id}`}
                    onClick={() => setEditing(l.id)}
                    className="soa-btn-ghost text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <Link to={`/lessons/${l.id}`} className="soa-btn-ghost text-xs">Open</Link>
                  {l.origin === "custom" && (
                    <button
                      data-testid={`admin-delete-${l.id}`}
                      onClick={async () => {
                        if (!window.confirm(`Delete ${l.id}?`)) return;
                        await api.delete(`/admin/lessons/${l.id}`);
                        toast.success("Lesson removed");
                        refresh();
                      }}
                      className="soa-btn-ghost text-xs text-[#FF3B30]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <EditLessonModal
          lessonId={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

function StatTile({ icon, label, value }) {
  return (
    <div className="soa-card p-4">
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{label}</div>
        {icon}
      </div>
      <div className="soa-display text-3xl font-black mt-2 tracking-tighter">{value}</div>
    </div>
  );
}

function EditLessonModal({ lessonId, onClose, onSaved }) {
  const [lesson, setLesson] = useState(null);
  const [origin, setOrigin] = useState("seed");
  const [busy, setBusy] = useState(false);
  const [edited, setEdited] = useState({});

  useEffect(() => {
    api.get(`/admin/lessons/${lessonId}`).then(({ data }) => {
      setLesson(data.lesson);
      setOrigin(data.origin);
      setEdited({
        title: data.lesson.title,
        summary: data.lesson.summary,
        estMinutes: data.lesson.estMinutes || 5,
        blocks: JSON.stringify(data.lesson.blocks || [], null, 2),
        quiz: JSON.stringify(data.lesson.quiz || [], null, 2),
        socialClip: JSON.stringify(data.lesson.socialClip || {}, null, 2),
      });
    }).catch(() => toast.error("Could not load lesson"));
  }, [lessonId]);

  const save = async () => {
    setBusy(true);
    try {
      const patch = {
        title: edited.title,
        summary: edited.summary,
        estMinutes: Number(edited.estMinutes) || 5,
      };
      try { patch.blocks = JSON.parse(edited.blocks); } catch { toast.error("Blocks JSON is invalid"); setBusy(false); return; }
      try { patch.quiz = JSON.parse(edited.quiz); } catch { toast.error("Quiz JSON is invalid"); setBusy(false); return; }
      try { patch.socialClip = JSON.parse(edited.socialClip); } catch { toast.error("Social clip JSON is invalid"); setBusy(false); return; }
      await api.put(`/admin/lessons/${lessonId}`, patch);
      toast.success("Lesson saved");
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const revert = async () => {
    if (!window.confirm("Revert this lesson to its original seed content?")) return;
    setBusy(true);
    try {
      await api.delete(`/admin/lessons/${lessonId}/override`);
      toast.success("Reverted");
      onSaved();
    } catch (e) {
      toast.error("Revert failed");
    } finally {
      setBusy(false);
    }
  };

  if (!lesson) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4">
      <div className="bg-[rgb(var(--soa-surface))] border border-[rgb(var(--soa-line))] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-[rgb(var(--soa-surface))] border-b border-[rgb(var(--soa-line))] p-4 flex items-center justify-between">
          <div>
            <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">EDIT · {origin === "seed" ? "SEED OVERRIDE" : "CUSTOM"}</div>
            <div className="soa-display text-lg font-bold mt-1">{lesson.id}</div>
          </div>
          <div className="flex gap-2">
            {origin === "seed" && lesson.edited && (
              <button data-testid="admin-revert-btn" onClick={revert} disabled={busy} className="soa-btn-ghost text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> Revert
              </button>
            )}
            <button data-testid="admin-edit-close" onClick={onClose} className="soa-btn-ghost"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 grid gap-4">
          <Field label="Title" v={edited.title} on={(v) => setEdited({ ...edited, title: v })} testid="admin-edit-title" />
          <Field label="Summary" v={edited.summary} on={(v) => setEdited({ ...edited, summary: v })} testid="admin-edit-summary" />
          <Field label="Estimated minutes" type="number" v={edited.estMinutes} on={(v) => setEdited({ ...edited, estMinutes: v })} testid="admin-edit-est" />
          <JsonField label="Blocks (JSON)" v={edited.blocks} on={(v) => setEdited({ ...edited, blocks: v })} testid="admin-edit-blocks" rows={10} />
          <JsonField label="Quiz (JSON)" v={edited.quiz} on={(v) => setEdited({ ...edited, quiz: v })} testid="admin-edit-quiz" rows={8} />
          <JsonField label="Social clip (JSON)" v={edited.socialClip} on={(v) => setEdited({ ...edited, socialClip: v })} testid="admin-edit-clip" rows={6} />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="soa-btn-ghost">Cancel</button>
            <button data-testid="admin-edit-save" onClick={save} disabled={busy} className="soa-btn-primary">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewLessonForm({ tracks, onCreated }) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [trackId, setTrackId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [caption, setCaption] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [prompt, setPrompt] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [answer, setAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);

  const [modules, setModules] = useState([]);
  useEffect(() => {
    setModuleId("");
    if (!trackId) { setModules([]); return; }
    api.get(`/tracks/${trackId}`).then(({ data }) => setModules(data.modules || []));
  }, [trackId]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/lessons", {
        id, title, summary, trackId, moduleId,
        estMinutes: 4,
        blocks: [
          { type: "caption", text: caption },
          { type: "takeaway", text: takeaway },
        ],
        quiz: prompt ? [{
          type: "mcq",
          prompt,
          options: [optA, optB, optC].filter(Boolean),
          answer: Number(answer),
          explanation,
        }] : [],
      });
      toast.success("Lesson created");
      setId(""); setTitle(""); setSummary(""); setCaption(""); setTakeaway("");
      setPrompt(""); setOptA(""); setOptB(""); setOptC(""); setAnswer(0); setExplanation("");
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not create");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mt-12 soa-card p-6">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-[#0047FF]" />
        <h2 className="soa-display text-2xl font-bold">Create lesson</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <Field label="Lesson ID (e.g. l-extra-1)" v={id} on={setId} testid="admin-lesson-id" required />
        <Field label="Title" v={title} on={setTitle} testid="admin-lesson-title" required />
        <Field label="Summary" v={summary} on={setSummary} testid="admin-lesson-summary" required />
        <div>
          <label className="soa-label">Track</label>
          <select data-testid="admin-lesson-track" required value={trackId} onChange={(e) => setTrackId(e.target.value)} className="soa-input mt-1">
            <option value="">Pick a track…</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="soa-label">Module</label>
          <select data-testid="admin-lesson-module" required value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="soa-input mt-1" disabled={!trackId}>
            <option value="">{trackId ? "Pick a module…" : "Pick a track first"}</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Field label="Caption" v={caption} on={setCaption} required />
        <Field label="Key takeaway" v={takeaway} on={setTakeaway} required />
      </div>

      <div className="mt-6 border-t border-[rgb(var(--soa-line))] pt-4">
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">QUIZ · OPTIONAL</div>
        <Field label="Question" v={prompt} on={setPrompt} />
        <div className="grid md:grid-cols-3 gap-2 mt-2">
          <Field label="Option A" v={optA} on={setOptA} />
          <Field label="Option B" v={optB} on={setOptB} />
          <Field label="Option C" v={optC} on={setOptC} />
        </div>
        <div className="grid md:grid-cols-2 gap-2 mt-2">
          <div>
            <label className="soa-label">Correct answer (0/1/2)</label>
            <input type="number" min={0} max={2} value={answer} onChange={(e) => setAnswer(e.target.value)} className="soa-input mt-1" />
          </div>
          <Field label="Explanation" v={explanation} on={setExplanation} />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button data-testid="admin-create-submit" disabled={busy} className="soa-btn-primary">
          {busy ? "Creating…" : "Create lesson"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, v, on, testid, required, type = "text" }) {
  return (
    <div>
      <label className="soa-label">{label}</label>
      <input data-testid={testid} type={type} value={v} onChange={(e) => on(e.target.value)} required={required} className="soa-input mt-1" />
    </div>
  );
}

function JsonField({ label, v, on, testid, rows = 6 }) {
  return (
    <div>
      <label className="soa-label">{label}</label>
      <textarea
        data-testid={testid}
        value={v}
        onChange={(e) => on(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="soa-input mt-1 font-mono text-xs"
      />
    </div>
  );
}
