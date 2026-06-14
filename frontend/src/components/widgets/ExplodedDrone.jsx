import { useState } from "react";
import { ExplodedDroneViewer } from "@/components/three/Drone3D";
import { Slider } from "@/components/ui/slider";
import { TID } from "@/lib/tids";

const PARTS = [
  { id: "fc", title: "Flight Controller", desc: "MCU + IMU + barometer + compass. The drone's spinal cord." },
  { id: "esc", title: "ESCs", desc: "Electronic speed controllers. Drive 3-phase BLDC motors." },
  { id: "motor", title: "BLDC Motors", desc: "Brushless DC motors. Electronic commutation, no brushes." },
  { id: "prop", title: "Propellers", desc: "Convert torque to thrust. Pitch + RPM = lift." },
  { id: "battery", title: "LiPo Battery", desc: "High C-rate, finite energy. The endurance limit." },
  { id: "gnss", title: "GNSS Module", desc: "Multi-constellation GPS, optional RTK for cm accuracy." },
  { id: "frame", title: "Frame", desc: "Carbon arms + central hub. Stiff and light." },
  { id: "radio", title: "Radio Link", desc: "Telemetry uplink + video downlink." },
];

export default function ExplodedDrone() {
  const [exploded, setExploded] = useState(0);
  const [active, setActive] = useState(null);

  return (
    <div className="soa-panel p-6 pt-8" data-testid="exploded-drone-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">SUBSYSTEM · MAP</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Exploded Drone</h3>
        </div>
        <div className="soa-mono text-[10px] tracking-widest text-neutral-400">DRAG TO ROTATE · {Math.round(exploded * 100)}% EXPLODED</div>
      </div>
      <div className="grid md:grid-cols-[1.4fr,1fr] gap-6">
        <div className="bg-neutral-950 rounded-sm h-[340px] relative">
          <ExplodedDroneViewer exploded={exploded} propSpeed={exploded < 0.2 ? 18 : 0} />
        </div>
        <div className="space-y-2 max-h-[340px] overflow-auto pr-2">
          {PARTS.map((p) => (
            <button
              key={p.id}
              data-testid={TID.explodedPart(p.id)}
              onClick={() => setActive(p.id)}
              className={`w-full text-left p-3 rounded-sm border transition-colors ${
                active === p.id ? "border-[#0047FF] bg-[#0047FF]/10" : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="soa-mono uppercase tracking-widest text-[11px] font-bold text-white">{p.title}</div>
                <div className="soa-mono text-[10px] text-neutral-500">{p.id.toUpperCase()}</div>
              </div>
              {active === p.id && <div className="text-[12px] text-neutral-300 mt-1">{p.desc}</div>}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <div className="soa-mono uppercase tracking-widest text-[10px] text-neutral-400">Explode</div>
          <div className="soa-mono text-white text-sm font-bold">{Math.round(exploded * 100)}%</div>
        </div>
        <Slider data-testid={TID.explodedToggle} value={[exploded]} min={0} max={1} step={0.02} onValueChange={(v) => setExploded(v[0])} className="mt-2" />
      </div>
    </div>
  );
}
