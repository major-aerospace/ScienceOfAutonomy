import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { Switch } from "@/components/ui/switch";

// Signal vs filtered signal — shows complementary/Kalman intuition.
export default function SignalNoise() {
  const [filterOn, setFilterOn] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const points = [];
    let smoothed = 0;
    for (let i = 0; i < 120; i++) {
      const t = i * 0.1;
      const truth = Math.sin(t) * 0.9 + Math.sin(t * 0.4) * 0.3;
      const noisy = truth + (Math.random() - 0.5) * 0.6;
      smoothed = smoothed * 0.85 + noisy * 0.15;
      points.push({ t: +t.toFixed(2), truth: +truth.toFixed(3), noisy: +noisy.toFixed(3), filtered: +smoothed.toFixed(3) });
    }
    setData(points);
  }, [filterOn]);

  return (
    <div className="soa-panel p-6 pt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">FILTER · INTUITION</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Signal vs Filter</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="soa-mono text-[10px] tracking-widest text-neutral-400">FILTER</div>
          <Switch checked={filterOn} onCheckedChange={setFilterOn} />
        </div>
      </div>
      <div className="bg-white rounded-sm h-[240px] p-2">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#EEE" />
            <XAxis dataKey="t" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
            <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} stroke="#888" />
            <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <Line type="monotone" dataKey="noisy" stroke="#FF3B30" dot={false} strokeWidth={1} isAnimationActive={false} />
            <Line type="monotone" dataKey="truth" stroke="#888" strokeDasharray="3 3" dot={false} strokeWidth={1.2} isAnimationActive={false} />
            {filterOn && <Line type="monotone" dataKey="filtered" stroke="#0047FF" dot={false} strokeWidth={2.2} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 soa-mono text-[10px] tracking-widest">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF3B30]" /> NOISY</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#888]" /> TRUTH</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#0047FF]" /> FILTERED</span>
      </div>
    </div>
  );
}
