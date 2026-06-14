import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { TID } from "@/lib/tids";

// RTK Visualizer: animated drone target with an error circle that shrinks when RTK is on.
export default function RTKVisualizer() {
  const [rtk, setRtk] = useState(false);
  const [r, setR] = useState(60);
  const targetR = rtk ? 4 : 60;

  useEffect(() => {
    let raf;
    const tick = () => {
      setR((cur) => cur + (targetR - cur) * 0.08);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetR]);

  // jitter dot
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      const amp = rtk ? 1 : 8;
      setJitter({ x: (Math.random() - 0.5) * amp, y: (Math.random() - 0.5) * amp });
    }, 90);
    return () => clearInterval(id);
  }, [rtk]);

  return (
    <div className="soa-panel p-6 pt-8" data-testid="rtk-visualizer-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">PRECISION · GNSS</div>
          <h3 className="soa-display text-2xl font-bold mt-1">RTK Visualizer</h3>
        </div>
        <div className="text-right soa-mono text-[11px] tracking-widest text-neutral-400">
          <div>ERROR (cm)</div>
          <div className="text-white text-lg font-bold">{rtk ? "~ 2" : "~ 200"}</div>
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr,auto] gap-6 items-center">
        <div className="bg-neutral-950 rounded-sm h-[260px] relative flex items-center justify-center overflow-hidden">
          {/* Satellite icons */}
          {[0, 1, 2, 3].map((i) => {
            const ang = (i / 4) * Math.PI * 2;
            const x = Math.cos(ang) * 110, y = Math.sin(ang) * 60;
            return (
              <div key={i} className="absolute soa-mono text-[10px]" style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}>
                <div className="text-neutral-500">SAT-{i + 1}</div>
              </div>
            );
          })}
          {/* Error circle */}
          <div
            className="absolute rounded-full border border-[#0047FF]/50"
            style={{ width: r * 2, height: r * 2, transition: "border-color 200ms" }}
          />
          <div className="absolute rounded-full bg-[#0047FF]/10" style={{ width: r * 2, height: r * 2 }} />
          {/* Drone marker */}
          <div className="absolute w-3 h-3 bg-white rounded-full" style={{ transform: `translate(${jitter.x}px, ${jitter.y}px)` }} />
          <div className="absolute bottom-2 right-3 soa-mono text-[10px] tracking-widest text-neutral-400">
            BASE STATION · {rtk ? <span className="text-[#00C759]">CORRECTING</span> : <span className="text-neutral-500">IDLE</span>}
          </div>
        </div>
        <div className="space-y-3 min-w-[180px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="soa-mono uppercase tracking-widest text-[11px] font-bold text-white">RTK Corrections</div>
              <div className="soa-mono text-[10px] text-neutral-500">Base broadcasts deltas</div>
            </div>
            <Switch data-testid={TID.rtkToggle} checked={rtk} onCheckedChange={setRtk} />
          </div>
          <div className="pt-3 border-t border-neutral-800 soa-mono text-[11px] text-neutral-400">
            <div>STANDALONE · METRES</div>
            <div>RTK · CENTIMETRES</div>
          </div>
        </div>
      </div>
    </div>
  );
}
