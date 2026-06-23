import { useState } from "react";
import { Lock, Eye, Compass, Cpu, Sparkles, User, Bot, AlertTriangle, Plane } from "lucide-react";
import { TID } from "@/lib/tids";

// Each rung now carries a full, concrete OUTCOME so the user immediately
// understands what changes when they pick a level. Picking is no longer
// a no-op — the panel below the rungs updates live.
const RUNGS = [
  {
    lvl: 0, name: "Teleoperation", icon: Lock,
    desc: "Human flies via remote link.",
    who: "Human pilot",
    whoIcon: User,
    example: "FPV racing drones — every flick of the stick is a human decision.",
    failure: "If radio link drops, the aircraft has no idea what to do.",
    mission: "Inspect a chimney 200 m away — pilot sees the live feed and steers every motion.",
  },
  {
    lvl: 1, name: "Assisted", icon: Eye,
    desc: "Stabilization helps. Human commands.",
    who: "Human pilot + autopilot",
    whoIcon: User,
    example: "DJI Mavic in 'normal' mode — releases the sticks and it hovers.",
    failure: "Pilot still owns navigation; if pilot is distracted, drone drifts wherever pushed.",
    mission: "Aerial photography — pilot frames the shot, autopilot keeps it stable in wind.",
  },
  {
    lvl: 2, name: "Conditional", icon: Compass,
    desc: "Machine flies the mission. Human falls back.",
    who: "Machine flies · Human supervises",
    whoIcon: Bot,
    example: "Survey drone flying a pre-planned grid; pilot watches and pauses if needed.",
    failure: "If the human stops watching during an edge case, the drone may not catch it.",
    mission: "Map a 20-hectare farm autonomously while pilot watches telemetry.",
  },
  {
    lvl: 3, name: "High Autonomy", icon: Cpu,
    desc: "Machine handles edge cases.",
    who: "Machine flies · Machine recovers",
    whoIcon: Bot,
    example: "Delivery drones rerouting around a sudden no-fly zone or low battery.",
    failure: "Operates in a defined envelope (geography, weather). Outside it, all bets are off.",
    mission: "Last-mile delivery — drone detects pedestrians, picks a landing pad, aborts safely.",
  },
  {
    lvl: 4, name: "Full Autonomy", icon: Sparkles,
    desc: "No human in the loop.",
    who: "Machine flies · Machine decides · Machine owns",
    whoIcon: Bot,
    example: "Mostly research today — long-duration ISR or planetary rovers.",
    failure: "Trust ceiling. Society + regulation, not engineering, is the bottleneck.",
    mission: "Multi-day persistent surveillance — launch, mission, land, refuel, repeat — alone.",
  },
];

export default function AutonomyLadder() {
  const [active, setActive] = useState(2);
  const cur = RUNGS[active];
  const WhoIcon = cur.whoIcon;

  return (
    <div className="soa-panel p-6 pt-8" data-testid="autonomy-ladder-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">LEVELS · 5</div>
          <h3 className="soa-display text-2xl font-bold mt-1">The Autonomy Ladder</h3>
        </div>
        <div
          className="soa-mono text-[10px] tracking-widest text-neutral-400"
          data-testid="autonomy-ladder-selected"
        >
          SELECTED · LV {active} · {cur.name.toUpperCase()}
        </div>
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

      {/* Live outcome — updates the moment you tap a rung */}
      <div
        data-testid="autonomy-ladder-outcome"
        className="mt-5 border-l-[3px] border-[#0047FF] bg-[#0047FF]/8 p-5 rounded-sm"
      >
        <div className="flex items-center gap-2 soa-mono text-[10px] tracking-widest text-[#0047FF]">
          <WhoIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> AT LV {active} · {cur.who.toUpperCase()}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-3">
          <OutcomeBox
            icon={<Plane className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />}
            label="REAL-WORLD EXAMPLE"
            text={cur.example}
            testid="ladder-outcome-example"
          />
          <OutcomeBox
            icon={<Compass className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />}
            label="MISSION SCENARIO"
            text={cur.mission}
            testid="ladder-outcome-mission"
          />
          <OutcomeBox
            icon={<AlertTriangle className="w-3.5 h-3.5 text-[#FFCC00]" strokeWidth={1.5} />}
            label="WHERE IT BREAKS"
            text={cur.failure}
            testid="ladder-outcome-failure"
          />
        </div>
      </div>

      <div className="mt-4 soa-mono text-[10px] tracking-widest text-neutral-500">
        TAP A RUNG · EACH STEP REMOVES ONE HUMAN DECISION
      </div>
    </div>
  );
}

function OutcomeBox({ icon, label, text, testid }) {
  return (
    <div data-testid={testid} className="bg-neutral-950 border border-neutral-800 rounded-sm p-3">
      <div className="flex items-center gap-1.5 soa-mono text-[10px] tracking-widest text-neutral-400">
        {icon} {label}
      </div>
      <div className="text-[12.5px] text-neutral-200 mt-2 leading-snug">{text}</div>
    </div>
  );
}
