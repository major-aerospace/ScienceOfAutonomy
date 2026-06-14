import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function Chart({ id }) {
  switch (id) {
    case "airframe-radar": return <AirframeRadar />;
    case "thrust-vs-rpm": return <ThrustCurve />;
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
