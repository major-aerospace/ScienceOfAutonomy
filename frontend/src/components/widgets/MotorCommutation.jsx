import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { TID } from "@/lib/tids";

// BLDC motor commutation animation + thrust-vs-RPM curve
export default function MotorCommutation() {
  const [power, setPower] = useState(60); // 0..100
  const rpm = Math.round((power / 100) * 14000);
  const speedRad = (power / 100) * 14; // visual rotation rate
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t;
      setPhase((p) => (p + dt * speedRad) % (Math.PI * 2));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speedRad]);

  // thrust ~ k * RPM^2
  const curve = Array.from({ length: 20 }, (_, i) => {
    const r = (i / 19) * 14000;
    return { rpm: Math.round(r), thrust: +((r * r) / 1.6e6).toFixed(2) };
  });
  const thrust = +(((rpm) * (rpm)) / 1.6e6).toFixed(2);

  // Three coils glowing in rotating sequence
  const coils = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

  return (
    <div className="soa-panel p-6 pt-8" data-testid="motor-commutation-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">PROPULSION · 01</div>
          <h3 className="soa-display text-2xl font-bold mt-1">BLDC Commutation</h3>
        </div>
        <div className="text-right soa-mono text-[11px] tracking-widest text-neutral-400">
          <div>RPM · THRUST</div>
          <div className="text-white text-lg font-bold">{rpm.toLocaleString()} <span className="text-neutral-500">·</span> {thrust} N</div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-950 rounded-sm h-[260px] relative flex items-center justify-center">
          <svg viewBox="-110 -110 220 220" className="w-full h-full max-h-[260px]">
            {/* Stator coils */}
            {coils.map((a, i) => {
              const x = Math.cos(a) * 70;
              const y = Math.sin(a) * 70;
              // Coil glow intensity follows a sine offset per phase
              const intensity = Math.max(0, Math.sin(phase - a));
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="22" fill={`rgba(0, 71, 255, ${0.15 + intensity * 0.65})`} stroke="#0047FF" strokeWidth="1.5" />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#fff" fontFamily="JetBrains Mono">{["A", "B", "C"][i]}</text>
                </g>
              );
            })}
            {/* Rotor (magnet) */}
            <g transform={`rotate(${(phase * 180) / Math.PI})`}>
              <rect x="-6" y="-32" width="12" height="64" fill="#FF3B30" rx="2" />
              <circle cx="0" cy="0" r="10" fill="#111" stroke="#fff" strokeWidth="1" />
            </g>
            <circle cx="0" cy="0" r="98" fill="none" stroke="#27272A" />
          </svg>
        </div>
        <div className="bg-white rounded-sm h-[260px] p-2">
          <ResponsiveContainer>
            <LineChart data={curve}>
              <CartesianGrid stroke="#EEE" />
              <XAxis dataKey="rpm" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
              <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
              <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <Line type="monotone" dataKey="thrust" stroke="#111" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <div className="soa-mono uppercase tracking-widest text-[10px] text-neutral-400">Throttle</div>
          <div className="soa-mono text-white text-sm font-bold">{power}%</div>
        </div>
        <Slider data-testid={TID.motorPower} value={[power]} min={0} max={100} step={1} onValueChange={(v) => setPower(v[0])} className="mt-2" />
      </div>
    </div>
  );
}
