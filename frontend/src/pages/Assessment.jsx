import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import MentalRotation from "@/components/assessment/MentalRotation";
import Vigilance from "@/components/assessment/Vigilance";
import Trainability from "@/components/assessment/Trainability";
import { toast } from "sonner";

const STAGES = ["intro", "mr", "vig", "train1", "interlude", "train2", "result"];

export default function Assessment() {
  const { user } = useAuth();
  const [stage, setStage] = useState("intro");
  const [mr, setMr] = useState(0);    // perceptual_spatial 0..1
  const [vig, setVig] = useState(0);  // attentional 0..1
  const [t1, setT1] = useState(0);    // first trainability attempt time
  const [t2, setT2] = useState(0);    // second
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const next = () => {
    const idx = STAGES.indexOf(stage);
    if (idx < STAGES.length - 1) setStage(STAGES[idx + 1]);
  };

  const submit = async () => {
    // Trainability slope = improvement: 1 if t2 < t1 (faster) by 30%+, scaled
    const slope = t1 > 0 ? Math.max(-0.5, Math.min(1, (t1 - t2) / t1)) : 0;
    // Defaults for skipped domains (lite version uses 3 mini-tasks)
    const psych = 0.6; // placeholder
    const higher = 0.55;
    const dispo = 0.7;

    const payload = {
      perceptual_spatial: mr,
      attentional: vig,
      psychomotor: psych,
      higher_order: higher,
      dispositional: dispo,
      trainability_slope: slope,
    };

    if (!user || user === false) {
      // Local-only result
      setResult({ payload, recommendedTrack: { trackId: "track-foundations", title: "Foundations of Flight & Autonomy", reason: "Start with foundations.", weakestDomain: "perceptual_spatial" } });
      setStage("result");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/assessment/submit", payload);
      setResult({ payload, recommendedTrack: data.recommendedTrack });
      setStage("result");
    } catch (e) {
      toast.error("Could not save assessment");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">DRONABILITY · LITE</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">
        Self-assessment
      </h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">
        A short, science-grounded snapshot of how you currently learn — <strong>not</strong> a clinical or selection test. The headline result is your <em>Trainability slope</em> — how fast you improve.
      </p>

      <div className="mt-8">
        {stage === "intro" && <Intro onStart={next} />}
        {stage === "mr" && <MentalRotation onDone={(score) => { setMr(score); next(); }} />}
        {stage === "vig" && <Vigilance onDone={(score) => { setVig(score); next(); }} />}
        {stage === "train1" && <Trainability label="Attempt 1 of 2" onDone={(timeSec) => { setT1(timeSec); next(); }} />}
        {stage === "interlude" && <Interlude onNext={next} />}
        {stage === "train2" && <Trainability label="Attempt 2 of 2" onDone={(timeSec) => { setT2(timeSec); submit(); }} />}
        {stage === "result" && result && <Result result={result} />}
      </div>
    </div>
  );
}

function Intro({ onStart }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {[
        { k: "01", t: "Mental rotation", d: "How quickly you transform shapes in your head." },
        { k: "02", t: "Vigilance", d: "How long you sustain attention under monotony." },
        { k: "03", t: "Trainability", d: "How much you improve when given a second try." },
      ].map((s) => (
        <div key={s.k} className="soa-card p-5">
          <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">TASK · {s.k}</div>
          <div className="soa-display text-xl font-bold mt-1">{s.t}</div>
          <div className="text-sm text-[rgb(var(--soa-ink-2))] mt-1">{s.d}</div>
        </div>
      ))}
      <div className="md:col-span-3 mt-2">
        <button data-testid={TID.assessStart} onClick={onStart} className="soa-btn-primary">Begin · ~6 minutes</button>
      </div>
    </div>
  );
}

function Interlude({ onNext }) {
  return (
    <div className="soa-card p-8 text-center">
      <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">INTERLUDE</div>
      <h3 className="soa-display text-2xl font-bold mt-2">Same task. Again.</h3>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-md mx-auto">
        We'll measure how much faster you get. That improvement is the most important signal in this assessment.
      </p>
      <button data-testid={TID.assessNext} onClick={onNext} className="soa-btn-primary mt-5">Try again</button>
    </div>
  );
}

function Result({ result }) {
  const r = result.payload;
  const data = [
    { domain: "Spatial", v: r.perceptual_spatial },
    { domain: "Attention", v: r.attentional },
    { domain: "Psychomotor", v: r.psychomotor },
    { domain: "Reasoning", v: r.higher_order },
    { domain: "Disposition", v: r.dispositional },
  ];
  const slopePct = (r.trainability_slope * 100).toFixed(0);
  const positive = r.trainability_slope >= 0;

  return (
    <div className="grid md:grid-cols-[1.1fr,1fr] gap-8">
      <div className="soa-card p-6">
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">PROFILE</div>
        <div className="h-[320px] mt-2">
          <ResponsiveContainer>
            <RadarChart data={data}>
              <PolarGrid stroke="#E5E5E5" />
              <PolarAngleAxis dataKey="domain" tick={{ fontFamily: "JetBrains Mono", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fontFamily: "JetBrains Mono", fontSize: 9 }} />
              <Radar dataKey="v" stroke="#0047FF" fill="#0047FF" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">HEADLINE</div>
        <div className="soa-display text-5xl font-black tracking-tighter mt-1">
          {positive ? "+" : ""}{slopePct}% <span className="text-base soa-mono align-middle text-[rgb(var(--soa-ink-3))]">TRAINABILITY</span>
        </div>
        <p className="text-[rgb(var(--soa-ink-2))] mt-2">
          {positive
            ? "You improved with practice — that's the strongest signal in this assessment."
            : "You didn't speed up this round. That's normal — try the full battery later."}
        </p>

        <div className="soa-card p-5 mt-5">
          <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">RECOMMENDED TRACK</div>
          <div className="soa-display text-xl font-bold mt-1">{result.recommendedTrack.title}</div>
          <div className="text-sm text-[rgb(var(--soa-ink-2))] mt-1">{result.recommendedTrack.reason}</div>
          <Link to={`/tracks/${result.recommendedTrack.trackId}`} className="soa-btn-primary mt-4 inline-flex">Open track</Link>
        </div>

        <button data-testid={TID.assessRetake} onClick={() => window.location.reload()} className="soa-btn-ghost mt-4">Retake</button>
      </div>
    </div>
  );
}
