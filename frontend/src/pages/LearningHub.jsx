import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Check, ChevronRight, Compass, Layers3, Users, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, formatApiErrorDetail } from "@/lib/api";
import { LESSONS } from "@/lib/foundations";
import "./Learning.css";

export function AutonomyArtwork() {
  return <div className="learn-artwork">
    <div className="learn-art-caption"><span className="learn-live-dot" /> A system, connected.</div>
    <svg viewBox="0 0 500 330" role="img" aria-label="Sensing, understanding, planning, and action form a continuous autonomy loop">
      <defs><radialGradient id="learn-glow"><stop stopColor="#4ba49b" stopOpacity=".28" /><stop offset="1" stopColor="#4ba49b" stopOpacity="0" /></radialGradient><linearGradient id="learn-core" x2="1" y2="1"><stop stopColor="#d7ede1" /><stop offset="1" stopColor="#8cbeb2" /></linearGradient></defs>
      <circle cx="250" cy="165" r="150" fill="url(#learn-glow)" /><ellipse cx="250" cy="165" rx="190" ry="110" fill="none" stroke="#7eaaa1" strokeOpacity=".3" strokeDasharray="4 8" /><ellipse cx="250" cy="165" rx="130" ry="82" fill="none" stroke="#7eaaa1" strokeOpacity=".2" />
      <path d="M250 47 C360 47 427 90 427 165 M427 165 C427 254 324 283 250 283 M250 283 C133 283 73 235 73 165 M73 165 C73 75 185 47 250 47" fill="none" stroke="#7db7a7" strokeWidth="2" strokeOpacity=".5" />
      <g transform="translate(199 112)"><path d="M51 0 103 30v53L51 113 0 83V30Z" fill="url(#learn-core)" /><path d="m0 30 51 29 52-29M51 59v54" stroke="#5b958b" strokeWidth="1.5" fill="none" /><circle cx="51" cy="34" r="12" fill="#173d46" /><circle cx="51" cy="34" r="5" fill="#e5b577" /><path d="m20 68 13 7m38 0 13-7" stroke="#436d65" strokeWidth="3" /></g>
      {[{x:250,y:47,n:"01",t:"Sense"},{x:427,y:165,n:"02",t:"Understand"},{x:250,y:283,n:"03",t:"Plan"},{x:73,y:165,n:"04",t:"Act"}].map(p=><g key={p.n}><circle cx={p.x} cy={p.y} r="22" fill="#1f4750" stroke="#719b94" /><text x={p.x} y={p.y+5} textAnchor="middle" fill="#d9eee5" fontSize="13" fontFamily="sans-serif">{p.n}</text><text x={p.x} y={p.y+(p.n==='03'?40:-34)} textAnchor="middle" fill="#c0dad5" fontSize="13" fontFamily="sans-serif">{p.t}</text></g>)}
    </svg>
    <div className="learn-art-bottom"><span>Observe. Decide. Learn.</span><span>Human purpose at the centre <span aria-hidden="true">↗</span></span></div>
  </div>;
}

function LearningHubBody() {
  const { user, ready } = useAuth();
  const request = useRef(0);
  const [record, setRecord] = useState({ progress: [], cohorts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");
  const load = useCallback(async () => {
    const sequence = ++request.current;
    if (!user) { setRecord({ progress: [], cohorts: [] }); return; }
    setLoading(true); setError("");
    try { const { data } = await api.get("/lab/me"); if (sequence === request.current) setRecord(data); }
    catch { if (sequence === request.current) setError("Your saved progress could not be loaded. You can still explore the course."); }
    finally { if (sequence === request.current) setLoading(false); }
  }, [user]);
  useEffect(() => { load(); return () => { request.current += 1; }; }, [load]);
  const progress = record.progress || [];
  const completed = LESSONS.filter(l => progress.find(p => p.lesson_id === l.id)?.completed).length;
  const next = LESSONS.find(l => !progress.find(p => p.lesson_id === l.id)?.completed) || LESSONS[0];
  async function join(event) {
    event.preventDefault(); if (joining || !code.trim()) return;
    setJoining(true); setJoinError(""); setJoinMessage("");
    try {
      await api.post("/lab/join", { code: code.trim() });
      setJoinMessage("You joined the learning group. Your instructor can now see your course progress and submitted reflections."); setCode(""); await load();
    } catch (e) { setJoinError(formatApiErrorDetail(e.response?.data?.detail || "We could not join this group. Check the code and try again.")); }
    finally { setJoining(false); }
  }
  return <div className="learn-shell" data-testid="learning-hub">
    <div className="learn-topline"><span className="learn-eyebrow"><span className="learn-dot" /> Online learning</span><span className="learn-edition">The foundations collection / 01</span></div>
    <section className="learn-hero">
      <div className="learn-hero-copy"><div className="learn-kicker">AUTONOMY FOUNDATIONS</div><h1>Understand the systems.<br /><em>Build your judgement.</em></h1><p>A guided introduction to how autonomous systems sense, decide, and act. Explore the ideas, test your predictions, and connect what you learn.</p><div className="learn-actions"><Link to={`/learn/${next.id}`} className="learn-button">{completed === LESSONS.length ? "Revisit the course" : completed ? "Continue learning" : "Start exploring"}<ArrowRight size={18} /></Link><a href="#course-map" className="learn-text-link">See the course <ChevronRight size={16} /></a></div><div className="learn-hero-meta"><span><BookOpen size={15} /> 6 guided lessons</span><span><Compass size={15} /> Learn at your own pace</span><span><Sparkles size={15} /> No prior experience</span></div></div>
      <AutonomyArtwork />
    </section>
    <section className="learn-method" aria-label="How you will learn">{[{n:"01",title:"Make a prediction",text:"Start with your own explanation."},{n:"02",title:"Try an experiment",text:"Change something. Notice what happens."},{n:"03",title:"Connect the idea",text:"Reflect, check, and build understanding."}].map(item=><div key={item.n}><span>{item.n}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</section>
    <div className="learn-course-layout">
      <section id="course-map"><div className="learn-section-heading"><div><span className="learn-eyebrow">Your learning path</span><h2>Six ideas. One connected system.</h2></div><span className="learn-pill">FOUNDATIONS</span></div>
        <div className="learn-module-list">{LESSONS.map((lesson, i) => {
          const saved = progress.find(p => p.lesson_id === lesson.id);
          return <Link to={`/learn/${lesson.id}`} key={lesson.id} className={`learn-module learn-accent-${lesson.accent}`}><div className="learn-module-number">{saved?.completed ? <Check size={22} aria-label="Completed" /> : String(i+1).padStart(2,"0")}</div><div className="learn-module-copy"><div className="learn-module-meta"><span>{lesson.category}</span><span>About {lesson.minutes} min</span>{saved && <span>{saved.completed ? "Completed" : "Practising"}</span>}</div><h3>{lesson.shortTitle}</h3><p>{lesson.description}</p></div><ArrowRight className="learn-module-arrow" size={20} /></Link>;
        })}</div>
      </section>
      <aside className="learn-sidebar">
        <section className="learn-progress-card"><Layers3 size={23}/><h3>Your understanding,<br />built step by step.</h3>
          {!ready || loading ? <p role="status">Loading your learning record…</p> : error ? <div className="learn-error" role="alert"><p>{error}</p><button onClick={load}><RefreshCw size={14}/> Retry loading progress</button></div> : user ? <><div className="learn-progress-count">{completed}<span> / 6 lessons</span></div><div className="learn-progress-track" role="progressbar" aria-label="Completed lessons" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={6}><span style={{width:`${completed/6*100}%`}} /></div><p>{completed === 6 ? "You completed all six formative lesson checks. Revisit any experiment and test a new explanation." : "A lesson is complete when both concept checks are correct. Retry freely; your best result is kept."}</p></> : <><p>Explore every lesson without an account. Sign in to save your checks and reflections, and return to your learning path.</p><Link to="/register" className="learn-text-link">Create your account <ArrowRight size={16}/></Link><Link to="/login" className="learn-small-link">Already learning here? Sign in</Link></>}
        </section>
        <section className="learn-note-card"><span className="learn-eyebrow">A useful distinction</span><h3>Learning, not labelling.</h3><p>These activities help you practise concepts. They are not a validated aptitude test, a personnel assessment, or a professional qualification.</p><Link to="/assessment" className="learn-text-link">Explore optional skill practice <ArrowRight size={15}/></Link></section>
        {user && <section className="learn-group-card"><Users size={21}/><h3>Learning with a group?</h3><p>Use your instructor's invitation code. Joining shares your course progress and submitted reflections with that instructor.</p><form onSubmit={join}><label htmlFor="cohort-code">Invitation code</label><div className="learn-inline-form"><input id="cohort-code" value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter code" maxLength={30} autoComplete="off" disabled={joining}/><button type="submit" disabled={joining || !code.trim()}>{joining ? "Joining…" : "Join"}</button></div></form>{joinError && <p className="learn-error" role="alert">{joinError}</p>}{joinMessage && <p className="learn-success" role="status">{joinMessage}</p>}{record.cohorts?.length > 0 && <div className="learn-groups"><span>Your learning groups</span>{record.cohorts.map(c=><div key={c.id || c.cohort_id}><Users size={14}/>{c.name || c.title || "Learning group"}</div>)}</div>}</section>}
      </aside>
    </div>
    <section className="learn-library-banner"><div><span className="learn-eyebrow">Keep your curiosity going</span><h2>A foundation to build on.</h2><p>Each lesson includes primary references, an explanation of its model, and questions to take further.</p></div><Link to="/tracks" className="learn-button learn-button-light">Browse the topic library <ArrowRight size={18}/></Link></section>
  </div>;
}

export default function LearningHub() { const {user,ready}=useAuth(); return <LearningHubBody key={`${ready ? "ready" : "loading"}:${user?.id || "guest"}`} />; }
