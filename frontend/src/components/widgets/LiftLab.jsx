import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid } from "recharts";
import { Slider } from "@/components/ui/slider";
import { TID } from "@/lib/tids";

// Simplified lift/drag model: CL increases linearly with AoA until stall, then collapses.
// L = 0.5 * rho * v^2 * S * CL ; CD = CD0 + k*CL^2
function liftDrag(speed, aoa, area) {
  const rho = 1.225;
  const stall = 16; // degrees
  const aoaRad = (aoa * Math.PI) / 180;
  let CL;
  if (aoa <= stall) CL = 2 * Math.PI * aoaRad * 0.8;
  else CL = 2 * Math.PI * (stall * Math.PI / 180) * 0.8 * Math.max(0, 1 - (aoa - stall) / 8);
  const CD = 0.02 + 0.08 * CL * CL;
  const L = 0.5 * rho * speed * speed * area * CL;
  const D = 0.5 * rho * speed * speed * area * CD;
  return { L, D, CL, CD };
}

export default function LiftLab() {
  const [speed, setSpeed] = useState(20);   // m/s
  const [aoa, setAoa] = useState(8);        // degrees
  const [area, setArea] = useState(0.4);    // m^2

  const result = useMemo(() => liftDrag(speed, aoa, area), [speed, aoa, area]);

  // Lift vs AoA curve at current speed+area
  const curve = useMemo(() => {
    const pts = [];
    for (let a = 0; a <= 25; a += 0.5) {
      const r = liftDrag(speed, a, area);
      pts.push({ aoa: +a.toFixed(1), L: +r.L.toFixed(2) });
    }
    return pts;
  }, [speed, area]);

  // Airfoil tilt + streamline visualization
  const tilt = -aoa;
  const stalled = aoa > 16;

  return (
    <div className="soa-panel p-6 pt-8" data-testid="lift-lab-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">EXPERIMENT · 02</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Lift Lab</h3>
        </div>
        <div className="text-right soa-mono text-[11px] tracking-widest text-neutral-400">
          <div>LIFT · DRAG</div>
          <div className="text-white text-lg font-bold">
            {result.L.toFixed(1)} <span className="text-neutral-500">·</span> {result.D.toFixed(1)} N
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-950 rounded-sm h-[260px] relative overflow-hidden">
          {/* Streamlines */}
          <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full">
            {[...Array(10)].map((_, i) => {
              const y = 30 + i * 22;
              const d = stalled
                ? `M0 ${y} C 100 ${y}, 180 ${y - (i - 4.5) * 6}, 250 ${y + (Math.sin(i) * 18)} S 400 ${y + (Math.sin(i + 2) * 22)}, 400 ${y + (Math.sin(i + 2) * 22)}`
                : `M0 ${y} C 100 ${y}, 180 ${y - aoa * (i < 5 ? 1.6 : 0.4)}, 260 ${y - aoa * (i < 5 ? 0.6 : -0.2)} S 400 ${y}, 400 ${y}`;
              return <path key={i} d={d} stroke={stalled ? "#FF3B30" : "#0047FF"} strokeOpacity="0.55" fill="none" strokeWidth="1.2" />;
            })}
            {/* Airfoil */}
            <g transform={`translate(180 130) rotate(${tilt})`}>
              <path d="M-70 0 C -50 -16, 30 -22, 70 -2 C 30 6, -30 8, -70 0 Z" fill="#FAFAFA" stroke="#111" strokeWidth="1" />
            </g>
          </svg>
          <div className="absolute top-2 left-3 soa-mono text-[10px] tracking-widest text-neutral-400">AIRFOIL · {stalled ? <span className="text-[#FF3B30]">STALLED</span> : "ATTACHED FLOW"}</div>
          <div className="absolute bottom-2 right-3 soa-mono text-[10px] tracking-widest text-neutral-400">CL · {result.CL.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-sm h-[260px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve}>
              <CartesianGrid stroke="#EEE" />
              <XAxis dataKey="aoa" label={{ value: "AoA °", fontFamily: "JetBrains Mono", fontSize: 10, position: "insideBottom", dy: 10 }} tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
              <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
              <ReferenceLine x={aoa} stroke="#0047FF" />
              <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <Line type="monotone" dataKey="L" stroke="#111" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <SliderRow label="Airspeed (m/s)" testId={TID.liftSpeed} value={speed} min={5} max={60} step={1} onChange={setSpeed} />
        <SliderRow label="Angle of attack (°)" testId={TID.liftAoa} value={aoa} min={0} max={25} step={0.5} onChange={setAoa} warn={aoa > 16} />
        <SliderRow label="Wing area (m²)" testId={TID.liftArea} value={area} min={0.1} max={1.2} step={0.05} onChange={setArea} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, testId, warn }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="soa-mono uppercase tracking-widest text-[10px] text-neutral-400">{label}</div>
        <div className={`soa-mono text-sm font-bold ${warn ? "text-[#FF3B30]" : "text-white"}`}>
          {typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}
        </div>
      </div>
      <Slider data-testid={testId} value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="mt-2" />
    </div>
  );
}
