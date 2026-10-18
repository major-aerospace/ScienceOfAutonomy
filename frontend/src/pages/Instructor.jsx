import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Check, CheckCircle2, Copy, GraduationCap, Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LESSONS } from "@/lib/foundations";
import "./Instructor.css";

const errorMessage = (error, fallback) => error.response?.data?.detail
  ? formatApiErrorDetail(error.response.data.detail) : fallback;

function activityLabel(value) {
  if (!value) return "No learning activity yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Activity recorded" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Instructor() {
  const { user, ready } = useAuth();
  const allowed = user && ["instructor", "admin"].includes(user.role);
  const [cohorts, setCohorts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [query, setQuery] = useState("");
  const [expandedLearner, setExpandedLearner] = useState("");
  const [copyState, setCopyState] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);

  const loadCohorts = useCallback(async () => {
    const request = ++listRequest.current;
    setLoading(true);
    setListError("");
    try {
      const { data } = await api.get("/lab/cohorts");
      if (request !== listRequest.current) return;
      const next = data.cohorts || [];
      setCohorts(next);
      setSelectedId(current => next.some(cohort => cohort.id === current) ? current : next[0]?.id || "");
    } catch (error) {
      if (request === listRequest.current) setListError(errorMessage(error, "Your cohorts could not be loaded. Please try again."));
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }, []);

  const loadDetails = useCallback(async (cohortId) => {
    const request = ++detailRequest.current;
    setDetailsLoading(true);
    setDetailError("");
    try {
      const { data } = await api.get(`/lab/cohorts/${cohortId}`);
      if (request !== detailRequest.current) return;
      setDetails(data);
      setUpdatedAt(new Date());
    } catch (error) {
      if (request === detailRequest.current) setDetailError(errorMessage(error, "This cohort could not be loaded. Please try again."));
    } finally {
      if (request === detailRequest.current) setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && allowed) loadCohorts();
    return () => { listRequest.current += 1; detailRequest.current += 1; };
  }, [ready, allowed, loadCohorts]);

  useEffect(() => {
    setDetails(null);
    setQuery("");
    setExpandedLearner("");
    setCopyState("");
    if (selectedId && allowed) loadDetails(selectedId);
    return () => { detailRequest.current += 1; };
  }, [selectedId, allowed, loadDetails]);

  const createCohort = async (event) => {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    setCreateError("");
    try {
      const { data } = await api.post("/lab/cohorts", { name: name.trim() });
      const cohort = data.cohort;
      listRequest.current += 1;
      setLoading(false);
      setListError("");
      setCohorts(current => [cohort, ...current.filter(item => item.id !== cohort.id)]);
      setSelectedId(cohort.id);
      setName("");
    } catch (error) {
      setCreateError(errorMessage(error, "Your cohort could not be created. Please try again."));
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("Copied");
    } catch {
      setCopyState("Select and copy the code above.");
    }
  };

  if (!ready) return <div className="instructor-page"><p role="status">Loading your workspace…</p></div>;
  if (!allowed) return (
    <div className="instructor-page instructor-access">
      <span className="instructor-icon"><ShieldCheck aria-hidden="true" /></span>
      <h1>Instructor workspace</h1>
      <p>This workspace is available to instructors and administrators. An administrator can enable instructor access for your existing account.</p>
      <Link className="soa-btn-primary" to={user ? "/dashboard" : "/login"}>{user ? "Back to my learning" : "Sign in"}<ArrowRight size={16} /></Link>
    </div>
  );

  const cohort = details?.cohort;
  const learners = details?.learners || [];
  const filteredLearners = learners.filter(learner => `${learner.name || ""} ${learner.email || ""}`.toLowerCase().includes(query.toLowerCase()));
  const completed = learners.filter(learner => learner.total_lessons > 0 && learner.completed_lessons >= learner.total_lessons).length;
  const started = learners.filter(learner => learner.lesson_records?.length > 0 || learner.completed_lessons > 0).length;
  const averageProgress = learners.length ? Math.round(learners.reduce((total, learner) => total + (learner.progress_percent || 0), 0) / learners.length) : null;

  return (
    <div className="instructor-page">
      <header className="instructor-heading">
        <div>
          <span className="instructor-eyebrow"><GraduationCap size={16} aria-hidden="true" /> Instructor workspace</span>
          <h1>Help understanding take flight.</h1>
          <p>Bring learners together. See their progress. Find the next conversation that helps.</p>
        </div>
        <Link className="soa-btn-secondary" to="/learn"><BookOpen size={16} /> Preview the course</Link>
      </header>

      <div className="instructor-layout">
        <aside className="instructor-sidebar" aria-label="Cohorts">
          <div className="instructor-section-title"><h2>Your cohorts</h2><span>{cohorts.length}</span></div>
          {loading && <p role="status" className="instructor-muted">Loading cohorts…</p>}
          {listError && <div className="instructor-error" role="alert"><p>{listError}</p><button onClick={loadCohorts}>Try again</button></div>}
          {!loading && !listError && cohorts.length === 0 && <p className="instructor-muted">Create your first cohort to invite learners and follow their progress.</p>}
          <div className="instructor-cohorts">
            {cohorts.map(item => <button type="button" key={item.id} className={`instructor-cohort-choice ${item.id === selectedId ? "is-selected" : ""}`} aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}>
              <span className="instructor-cohort-icon"><Users size={18} aria-hidden="true" /></span>
              <span><strong>{item.name}</strong><small>Autonomy Foundations</small></span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>)}
          </div>
          <form className="instructor-create" onSubmit={createCohort}>
            <label htmlFor="cohort-name">Create a cohort</label>
            <input className="soa-input" id="cohort-name" value={name} onChange={event => setName(event.target.value)} maxLength={100} required placeholder="e.g. October explorers" />
            <p>Each cohort starts with Autonomy Foundations.</p>
            {createError && <p className="instructor-error" role="alert">{createError}</p>}
            <button className="soa-btn-primary" type="submit" disabled={creating || !name.trim()}><Plus size={16} />{creating ? "Creating…" : "Create cohort"}</button>
          </form>
          <div className="instructor-note"><ShieldCheck size={18} aria-hidden="true" /><p>Progress helps you guide learning. It is not an aptitude ranking or a professional suitability assessment.</p></div>
        </aside>

        <section className="instructor-main" aria-label="Selected cohort" aria-busy={detailsLoading}>
          {detailsLoading && !cohort && <div className="instructor-empty" role="status"><RefreshCw size={24} /><h2>Loading your cohort…</h2></div>}
          {detailError && <div className="instructor-error" role="alert"><p>{detailError}</p><button onClick={() => loadDetails(selectedId)}>Try again</button></div>}
          {!selectedId && !loading && !listError && <div className="instructor-empty"><span className="instructor-icon"><Users size={30} /></span><h2>Good learning starts together.</h2><p>Create a cohort, share its join code, and see your learners' progress here.</p></div>}
          {cohort && <>
            <div className="instructor-cohort-header">
              <div><span className="instructor-eyebrow">Autonomy Foundations</span><h2>{cohort.name}</h2><p>Understand. Explore. Explain. Apply.</p></div>
              <div className="instructor-join"><span>Invite learners with this code</span><div><strong>{cohort.join_code}</strong><button type="button" onClick={() => copyCode(cohort.join_code)} aria-label="Copy cohort join code">{copyState === "Copied" ? <Check size={17} /> : <Copy size={17} />}</button></div><small aria-live="polite">{copyState || "Enter it on the course page to join."}</small></div>
            </div>
            <div className="instructor-stats">
              <Stat icon={<Users size={18} />} value={learners.length} label="Learners enrolled" />
              <Stat icon={<BookOpen size={18} />} value={started} label="Started learning" />
              <Stat icon={<CheckCircle2 size={18} />} value={completed} label="Course complete" />
              <Stat icon={<GraduationCap size={18} />} value={averageProgress === null ? "—" : `${averageProgress}%`} label="Average completion" />
            </div>
            <div className="instructor-roster">
              <div className="instructor-roster-heading"><div><h2>Learner progress</h2><p>Both concept checks must be correct to complete a lesson. Averages use each attempted lesson's best result.</p></div><button className="soa-btn-ghost" type="button" disabled={detailsLoading} onClick={() => loadDetails(selectedId)}><RefreshCw size={15} className={detailsLoading ? "instructor-refreshing" : ""} />{detailsLoading ? "Refreshing…" : "Refresh"}</button></div>
              {learners.length > 0 && <label className="instructor-search"><Search size={17} aria-hidden="true" /><input aria-label="Search learners" placeholder="Find a learner by name or email" value={query} onChange={event => setQuery(event.target.value)} /></label>}
              {learners.length === 0 ? <div className="instructor-roster-empty"><Users size={28} /><h3>Your invitation is ready.</h3><p>Share the join code above. Learners appear here after joining the cohort.</p></div> : <div className="instructor-table-scroll"><table><caption className="sr-only">Learners in {cohort.name}</caption><thead><tr><th scope="col">Learner</th><th scope="col">Course progress</th><th scope="col">Best check average</th><th scope="col">Latest activity</th></tr></thead><tbody>{filteredLearners.map(learner => <Fragment key={learner.id}><tr><td><strong>{learner.name || "Learner"}</strong><small>{learner.email}</small><button className="instructor-view-notes" aria-expanded={expandedLearner === learner.id} aria-controls={`learner-notes-${learner.id}`} onClick={() => setExpandedLearner(current => current === learner.id ? "" : learner.id)}>{expandedLearner === learner.id ? "Hide learning notes" : "View learning notes"}</button></td><td><span className="instructor-progress-label">{learner.completed_lessons} / {learner.total_lessons} lessons</span><progress max="100" value={learner.progress_percent || 0} aria-label={`${learner.name || "Learner"} course completion`} /></td><td>{learner.quiz_average == null ? <span className="instructor-muted">No quiz yet</span> : `${Math.round(learner.quiz_average)}%`}</td><td>{activityLabel(learner.last_activity)}</td></tr>{expandedLearner === learner.id && <tr><td colSpan={4} className="instructor-notes-cell"><LearnerNotes learner={learner} /></td></tr>}</Fragment>)}</tbody></table>{filteredLearners.length === 0 && <p className="instructor-no-results">No learners match this search.</p>}</div>}
              {updatedAt && <p className="instructor-updated">Updated {updatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}. Refresh to see new activity.</p>}
            </div>
            <LearningSignals details={details} />
          </>}
        </section>
      </div>
      {user.role === "admin" && <InstructorAccess />}
    </div>
  );
}

function Stat({ icon, value, label }) {
  return <div className="instructor-stat"><span>{icon}</span><strong>{value}</strong><p>{label}</p></div>;
}

function LearnerNotes({ learner }) {
  const records = learner.lesson_records || [];
  return <section className="instructor-learner-notes" id={`learner-notes-${learner.id}`} aria-label={`${learner.name || "Learner"} learning notes`}>
    <h3>Learning notes from {learner.name || "this learner"}</h3>
    <p>Latest submitted predictions and reflections. These are conversation starters, not automatically graded responses.</p>
    {records.length === 0 ? <p>No lesson checks have been submitted yet.</p> : <div className="instructor-notes-grid">{records.map(record => <article key={record.lesson_id}>
      <div><h4>{LESSONS.find(lesson => lesson.id === record.lesson_id)?.shortTitle || record.lesson_id}</h4><span>{record.completed ? "Complete" : "Practising"}</span></div>
      <p className="instructor-notes-meta">{record.attempts} attempt{record.attempts === 1 ? "" : "s"} · {activityLabel(record.last_attempt)}</p>
      <dl><dt>Prediction</dt><dd>{record.prediction || "No prediction submitted."}</dd><dt>Reflection</dt><dd>{record.reflection || "No reflection submitted."}</dd></dl>
      <Link to={`/learn/${record.lesson_id}`} className="instructor-notes-link">Open this lesson <ArrowRight size={13} /></Link>
    </article>)}</div>}
  </section>;
}

function LearningSignals({ details }) {
  const signals = details.misconceptions || [];
  const hasAttempts = details.learners?.some(learner => learner.lesson_records?.length > 0);
  return <section className="instructor-signals"><div><span className="instructor-icon"><BookOpen size={20} /></span><h2>What to revisit together</h2></div>{signals.length ? <ul>{signals.map((signal, index) => <li key={signal.id || index}><strong>{signal.title || signal.label}</strong><p>{signal.description}</p>{signal.count != null && <span>{signal.count} learner{signal.count === 1 ? "" : "s"}</span>}</li>)}</ul> : <p>{hasAttempts ? "No incorrect answers are recorded in learners' latest checks. Use their reflections to explore how they reached those answers." : "Learning patterns will appear after learners submit their concept checks. Incorrect answers in their latest attempts will help you choose what to revisit together."}</p>}</section>;
}

function InstructorAccess() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const grant = async event => {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    try {
      await api.patch("/lab/instructors", { email: email.trim() });
      setSuccess(`Instructor access enabled for ${email.trim()}. They can open this workspace after signing in again.`);
      setEmail("");
    } catch (failure) {
      setError(errorMessage(failure, "Instructor access could not be updated. Please try again."));
    } finally { setBusy(false); }
  };
  return <section className="instructor-admin"><div><span className="instructor-eyebrow"><ShieldCheck size={15} /> Administrator tools</span><h2>Make room for another instructor.</h2><p>Enable instructor access for an existing account. This gives them access to create and manage their own cohorts.</p></div><form onSubmit={grant}><label htmlFor="instructor-email">Account email</label><div><input id="instructor-email" className="soa-input" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="instructor@example.com" /><button className="soa-btn-primary" disabled={busy}>{busy ? "Updating…" : "Enable instructor"}</button></div>{error && <p className="instructor-error" role="alert">{error}</p>}{success && <p className="instructor-success" role="status">{success}</p>}</form></section>;
}
