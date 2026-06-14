import { useState } from "react";
import { Lock, Eye, Compass, Cpu, Sparkles } from "lucide-react";
import { TID } from "@/lib/tids";

const RUNGS = [
  { lvl: 0, name: "Teleoperation", desc: "Human flies via remote link.", icon: Lock },
  { lvl: 1, name: "Assisted", desc: "Stabilization helps. Human commands.", icon: Eye },
  { lvl: 2, name: "Conditional", desc: "Machine flies the mission. Human falls back.", icon: Compass },
  { lvl: 3, name: "High Autonomy", desc: "Machine handles edge cases.", icon: Cpu },
  { lvl: 4, name: "Full Autonomy", desc: "No human in the loop.", icon: Sparkles },
];

export default function AutonomyLadder() {
  const [active, setActive] = useState(2);
  return (
    <div className="soa-panel p-6 pt-8" data-testid="autonomy-ladder-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">LEVELS · 5</div>
          <h3 className="soa-display text-2xl font-bold mt-1">The Autonomy Ladder</h3>
        </div>
        <div className="soa-mono text-[10px] tracking-widest text-neutral-400">SELECTED · LV {active}</div>
      </div>
      <div className="grid md:grid-cols-5 gap-3">
        {RUNGS.map((r) => {
          const Icon = r.icon;
          const isOn = r.lvl <= active;
          return (
            <button
              key={r.lvl}
              data-testid={TID.ladderRung(r.lvl)}
              onClick={() => setActive(r.lvl)}
              className={`text-left p-4 rounded-sm border transition-all ${
                isOn ? "border-[#0047FF] bg-[#0047FF]/10" : "border-neutral-800 bg-neutral-950"
              } ${active === r.lvl ? "ring-2 ring-[#0047FF]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="soa-mono text-[10px] tracking-widest text-neutral-400">LV {r.lvl}</div>
                <Icon className={`w-4 h-4 ${isOn ? "text-[#0047FF]" : "text-neutral-600"}`} strokeWidth={1.5} />
              </div>
              <div className="soa-display text-white text-base font-bold mt-2 leading-tight">{r.name}</div>
              <div className="text-[11px] text-neutral-400 mt-1 leading-snug">{r.desc}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 soa-mono text-[10px] tracking-widest text-neutral-500">
        TAP A RUNG · EACH STEP REMOVES ONE HUMAN DECISION
      </div>
    </div>
  );
}
