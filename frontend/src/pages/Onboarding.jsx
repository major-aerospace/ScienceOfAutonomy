import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";

const GOALS = [
  { id: "curious", title: "The Curious", desc: "No background. Just want to understand the magic.", path: "track-foundations" },
  { id: "student", title: "The Student", desc: "Engineering/CS background. Want structured fundamentals.", path: "track-gnc" },
  { id: "operator", title: "The Operator", desc: "Hands-on. Want mental models that survive the field.", path: "track-anatomy" },
  { id: "professional", title: "The Professional", desc: "Want a clean reference + the Dronability profile.", path: "track-anatomy" },
];

export default function Onboarding() {
  const { setGoal } = useAuth();
  const nav = useNavigate();
  const [picked, setPicked] = useState("curious");
  const [busy, setBusy] = useState(false);

  const cont = async () => {
    setBusy(true);
    try {
      await setGoal(picked);
      const target = GOALS.find((g) => g.id === picked);
      nav(`/tracks/${target.path}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">CALIBRATE · ONBOARDING</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Why are you here?</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2">We use this to recommend your starting path. You can change tracks any time.</p>

      <div className="grid md:grid-cols-2 gap-4 mt-10">
        {GOALS.map((g) => (
          <button
            key={g.id}
            data-testid={TID.onboardGoal(g.id)}
            onClick={() => setPicked(g.id)}
            className={`soa-card text-left p-6 transition-all ${picked === g.id ? "border-[#0047FF] ring-2 ring-[#0047FF]/30 -translate-y-1" : ""}`}
          >
            <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">PROFILE</div>
            <div className="soa-display text-2xl font-black mt-1">{g.title}</div>
            <div className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">{g.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <button data-testid={TID.onboardContinue} disabled={busy} onClick={cont} className="soa-btn-primary">
          {busy ? "Loading…" : "Start learning"}
        </button>
      </div>
    </div>
  );
}
