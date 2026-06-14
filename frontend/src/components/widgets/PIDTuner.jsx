import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid } from "recharts";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { TID } from "@/lib/tids";
import { PIDDrone } from "@/components/three/Drone3D";

// Simulate a 2nd-order plant under PID control.
// plant: y'' = u   (acceleration ~ control)
// controller: u = Kp*e + Ki*∫e - Kd*y'   (D on measurement)
function simulate(Kp, Ki, Kd, durationS = 6, dt = 0.02) {
  const setpoint = 1;
  let y = 0, v = 0, integ = 0;
  const out = [];
  for (let t = 0; t <= durationS; t += dt) {
    const e = setpoint - y;
    integ += e * dt;
    const u = Kp * e + Ki * integ - Kd * v;
    const a = u - 0.4 * v; // small damping for realism
    v += a * dt;
    y += v * dt;
    out.push({ t: +t.toFixed(2), y: +y.toFixed(4), setpoint });
  }
  return out;
}

export default function PIDTuner() {
  const [P, setP] = useState(2.2);
  const [I, setI] = useState(0.6);
  const [D, setD] = useState(1.2);
  const [tick, setTick] = useState(0);
  const seriesRef = useRef([]);

  useEffect(() => {
    seriesRef.current = simulate(P, I, D);
  }, [P, I, D]);

  // Animated playback of the simulated response
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [P, I, D]);
  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => {
        const len = seriesRef.current.length;
        if (i >= len - 1) return 0;
        return i + 3;
      });
      setTick((t) => t + 1);
    }, 32);
    return () => clearInterval(id);
  }, []);

  const data = seriesRef.current.slice(0, Math.max(2, idx));
  const current = data[data.length - 1] || { y: 0, setpoint: 1 };
  const droneAlt = Math.max(-0.6, Math.min(1.4, current.y * 0.8 - 0.2));

  const stats = (() => {
    const full = seriesRef.current;
    if (full.length < 2) return { overshoot: 0, settle: 0 };
    const peak = Math.max(...full.map((d) => d.y));
    const overshoot = Math.max(0, (peak - 1) * 100);
    // settle when |y-1| stays under 0.05 for the rest
    let settle = full[full.length - 1].t;
    for (let i = full.length - 1; i >= 0; i--) {
      if (Math.abs(full[i].y - 1) > 0.05) { settle = full[i].t; break; }
    }
    return { overshoot: overshoot.toFixed(1), settle: settle.toFixed(2) };
  })();

  const reset = () => { setP(2.2); setI(0.6); setD(1.2); };

  return (
    <div className="soa-panel p-6 pt-8" data-testid="pid-tuner-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">EXPERIMENT · 01</div>
          <h3 className="soa-display text-2xl font-bold mt-1">PID Tuner</h3>
        </div>
        <div className="text-right soa-mono text-[11px] tracking-widest text-neutral-400">
          <div>OVERSHOOT</div>
          <div className="text-white text-lg font-bold">{stats.overshoot}%</div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 rounded-sm h-[260px] relative">
          <PIDDrone altitude={droneAlt} />
          <div className="absolute bottom-2 left-3 soa-mono text-[10px] tracking-widest text-neutral-400">SETPOINT · 1.0 m</div>
          <div className="absolute top-2 right-3 soa-mono text-[10px] tracking-widest text-neutral-400">ALTITUDE · {current.y.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-sm h-[260px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#EEE" />
              <XAxis dataKey="t" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
              <YAxis domain={[-0.4, 2]} tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
              <ReferenceLine y={1} stroke="#0047FF" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <Line type="monotone" dataKey="y" stroke="#111" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <SliderRow label="P · proportional" testId={TID.pidP} value={P} min={0} max={6} step={0.05} onChange={setP} hint="React now to error" />
        <SliderRow label="I · integral" testId={TID.pidI} value={I} min={0} max={3} step={0.05} onChange={setI} hint="Clean up drift" />
        <SliderRow label="D · derivative" testId={TID.pidD} value={D} min={0} max={4} step={0.05} onChange={setD} hint="Damp overshoot" />
      </div>

      <div className="flex justify-between items-center mt-5">
        <div className="soa-mono text-[11px] tracking-widest text-neutral-400">SETTLE · {stats.settle}s</div>
        <Button onClick={reset} variant="ghost" data-testid={TID.pidReset} className="text-neutral-300 hover:text-white soa-mono uppercase tracking-widest text-[11px]">
          <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, testId, hint }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="soa-mono uppercase tracking-widest text-[10px] text-neutral-400">{label}</div>
        <div className="soa-mono text-white text-sm font-bold">{value.toFixed(2)}</div>
      </div>
      <Slider
        data-testid={testId}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="mt-2"
      />
      <div className="soa-mono text-[10px] tracking-wider text-neutral-500 mt-1">{hint}</div>
    </div>
  );
}
