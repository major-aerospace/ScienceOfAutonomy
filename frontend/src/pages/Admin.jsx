import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trash2, Plus, Users, BookOpen, MessageSquare, BarChart3, FileText } from "lucide-react";

export default function Admin() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [customLessons, setCustomLessons] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    refresh();
  }, [user]);

  const refresh = () => {
    Promise.all([
      api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {}),
      api.get("/tracks").then(({ data }) => setTracks(data.tracks || [])),
      api.get("/admin/lessons").then(({ data }) => setCustomLessons(data.lessons || [])).catch(() => {}),
    ]);
  };

  if (!ready) return <div className="p-12 soa-mono text-sm">LOADING…</div>;
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">ADMIN · CONSOLE</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Curriculum CMS</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">
        Manage extra lessons, monitor activity, and curate the curriculum.
      </p>

      {/* Stats grid */}
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

      <div className="mt-12">
        <h2 className="soa-display text-2xl font-bold">Custom lessons</h2>
        {customLessons.length === 0 ? (
          <div className="soa-card p-6 mt-4 text-sm text-[rgb(var(--soa-ink-2))]">No custom lessons yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {customLessons.map((l) => (
              <div key={l.id} className="soa-card p-4 flex items-center justify-between">
                <div>
                  <div className="soa-display text-base font-bold">{l.title}</div>
                  <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] mt-1">
                    {l.id} · {l.trackId}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/lessons/${l.id}`} className="soa-btn-ghost">Open</Link>
                  <button
                    data-testid={`admin-delete-${l.id}`}
                    onClick={async () => {
                      await api.delete(`/admin/lessons/${l.id}`);
                      toast.success("Lesson removed");
                      refresh();
                    }}
                    className="soa-btn-ghost text-[#FF3B30]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

  const selectedTrack = tracks.find((t) => t.id === trackId);
  // We don't have module list from /tracks summary, so fetch detail when track changes:
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

function Field({ label, v, on, testid, required }) {
  return (
    <div>
      <label className="soa-label">{label}</label>
      <input data-testid={testid} value={v} onChange={(e) => on(e.target.value)} required={required} className="soa-input mt-1" />
    </div>
  );
}
