import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function Chart({ id }) {
  switch (id) {
    case "airframe-radar": return <AirframeRadar />;
    case "thrust-vs-rpm": return <ThrustCurve />;
    case "edge-ai": return <EdgeAITradeoff />;
    case "reward-curve": return <RewardCurve />;
    case "payload-range": return <PayloadRange />;
    case "workload-curve": return <WorkloadCurve />;
    default: return null;
  }
}

function AirframeRadar() {
  const data = [
    { metric: "Hover", multi: 9, fixed: 1, vtol: 7 },
    { metric: "Endurance", multi: 3, fixed: 9, vtol: 6 },
    { metric: "Speed", multi: 4, fixed: 9, vtol: 7 },
    { metric: "Payload", multi: 6, fixed: 8, vtol: 7 },
    { metric: "Simplicity", multi: 9, fixed: 6, vtol: 3 },
  ];
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">TRADEOFFS · AIRFRAMES</div>
      <h4 className="soa-display text-xl font-bold mt-1">Multirotor vs Fixed-wing vs VTOL</h4>
      <div className="h-[280px] mt-2">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="#E5E5E5" />
            <PolarAngleAxis dataKey="metric" tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontFamily: "JetBrains Mono", fontSize: 9 }} />
            <Radar name="Multirotor" dataKey="multi" stroke="#0047FF" fill="#0047FF" fillOpacity={0.25} />
            <Radar name="Fixed-wing" dataKey="fixed" stroke="#FF3B30" fill="#FF3B30" fillOpacity={0.2} />
            <Radar name="Hybrid VTOL" dataKey="vtol" stroke="#00C759" fill="#00C759" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 soa-mono text-[10px] tracking-widest mt-2">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#0047FF]" />MULTIROTOR</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF3B30]" />FIXED-WING</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#00C759]" />VTOL</span>
      </div>
    </div>
  );
}

function ThrustCurve() {
  const data = Array.from({ length: 16 }, (_, i) => {
    const rpm = i * 1000;
    return { rpm, thrust: +((rpm * rpm) / 1.6e6).toFixed(2) };
  });
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">PROPULSION · 02</div>
      <h4 className="soa-display text-xl font-bold mt-1">Thrust scales with RPM²</h4>
      <div className="h-[260px] mt-2">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#EEE" />
            <XAxis dataKey="rpm" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
            <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
            <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <Line type="monotone" dataKey="thrust" stroke="#111" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EdgeAITradeoff() {
  const data = [
    { name: "Cloud", power: 1, latency: 9, compute: 10 },
    { name: "Companion", power: 5, latency: 4, compute: 6 },
    { name: "FC", power: 8, latency: 1, compute: 2 },
  ];
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">EDGE AI · TRADEOFF</div>
      <h4 className="soa-display text-xl font-bold mt-1">Where to run intelligence</h4>
      <div className="h-[260px] mt-2">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#EEE" />
            <XAxis dataKey="name" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
            <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
            <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <Line type="monotone" dataKey="latency" stroke="#FF3B30" strokeWidth={2} dot={true} isAnimationActive={false} />
            <Line type="monotone" dataKey="power" stroke="#0047FF" strokeWidth={2} dot={true} isAnimationActive={false} />
            <Line type="monotone" dataKey="compute" stroke="#00C759" strokeWidth={2} dot={true} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 soa-mono text-[10px] tracking-widest">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF3B30]" />LATENCY</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#0047FF]" />POWER</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#00C759]" />COMPUTE</span>
      </div>
    </div>
  );
}

function RewardCurve() {
  const data = Array.from({ length: 40 }, (_, i) => ({ ep: i, reward: +((1 - Math.exp(-i / 8)) * 100 + (Math.random() - 0.5) * 6).toFixed(1) }));
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">REINFORCEMENT LEARNING</div>
      <h4 className="soa-display text-xl font-bold mt-1">Reward grows with episodes</h4>
      <div className="h-[260px] mt-2">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#EEE" />
            <XAxis dataKey="ep" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} label={{ value: "EPISODE", fontSize: 10, fontFamily: "JetBrains Mono", position: "insideBottom", dy: 10 }} />
            <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
            <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <Line type="monotone" dataKey="reward" stroke="#0047FF" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PayloadRange() {
  const data = Array.from({ length: 20 }, (_, i) => {
    const payload = i * 0.5;
    return { payload, range: +(60 * Math.exp(-payload / 4)).toFixed(2) };
  });
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">DELIVERY · TRADEOFF</div>
      <h4 className="soa-display text-xl font-bold mt-1">Range collapses with payload</h4>
      <div className="h-[260px] mt-2">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#EEE" />
            <XAxis dataKey="payload" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} label={{ value: "kg", fontSize: 10, fontFamily: "JetBrains Mono", position: "insideBottom", dy: 10 }} />
            <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} label={{ value: "km", angle: -90, fontSize: 10, fontFamily: "JetBrains Mono", position: "insideLeft" }} />
            <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <Line type="monotone" dataKey="range" stroke="#FF3B30" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WorkloadCurve() {
  const data = Array.from({ length: 21 }, (_, i) => {
    const w = i / 20;
    const perf = +(100 * Math.exp(-Math.pow((w - 0.5) * 3, 2))).toFixed(1);
    return { workload: w.toFixed(2), performance: perf };
  });
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">HUMAN FACTORS</div>
      <h4 className="soa-display text-xl font-bold mt-1">Performance peaks in the middle</h4>
      <div className="h-[260px] mt-2">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#EEE" />
            <XAxis dataKey="workload" tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} label={{ value: "WORKLOAD →", fontSize: 10, fontFamily: "JetBrains Mono", position: "insideBottom", dy: 10 }} />
            <YAxis tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
            <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
            <Line type="monotone" dataKey="performance" stroke="#0047FF" dot={false} strokeWidth={2.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
