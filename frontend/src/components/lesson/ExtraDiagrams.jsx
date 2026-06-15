// Extra diagram components used by tracks 4–10.
// Kept self-contained, animated where the animation helps the concept.
import { useEffect, useRef, useState } from "react";

function Panel({ tick, title, children }) {
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">{tick}</div>
      <h4 className="soa-display text-xl font-bold mt-1">{title}</h4>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function SensorZoo() {
  const items = [
    { k: "IMU", v: "Fast · Drifts" },
    { k: "GNSS", v: "Absolute · Noisy" },
    { k: "BARO", v: "Altitude · Slow" },
    { k: "MAG", v: "Heading · Lies near metal" },
    { k: "CAMERA", v: "Rich · Ambiguous" },
    { k: "LIDAR", v: "Distance · Heavy" },
  ];
  return (
    <Panel tick="SENSORS · ZOO" title="Each sensor has strengths and lies">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.k} className="border border-[rgb(var(--soa-line))] p-3 rounded-sm">
            <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">{i.k}</div>
            <div className="text-sm mt-1">{i.v}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function SensorViews() {
  return (
    <Panel tick="MODALITIES" title="Same scene, three sensors">
      <svg viewBox="0 0 480 200" className="w-full">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 160 + 10} 10)`}>
            <rect x="0" y="0" width="140" height="160" fill="#FAFAFA" stroke="#111" />
            <text x="70" y="25" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill="#0047FF">{["RGB", "LIDAR", "RADAR"][i]}</text>
            {i === 0 && <circle cx="70" cy="100" r="34" fill="#0047FF" />}
            {i === 1 && [...Array(60)].map((_, j) => (
              <circle key={j} cx={20 + (j * 7) % 100} cy={50 + Math.floor(j / 14) * 22} r="1.5" fill="#111" />
            ))}
            {i === 2 && [...Array(5)].map((_, j) => (
              <ellipse key={j} cx="70" cy="100" rx={10 + j * 12} ry={6 + j * 6} fill="none" stroke="#FF3B30" />
            ))}
          </g>
        ))}
      </svg>
    </Panel>
  );
}

export function SlamBuild() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setT((p) => (p + 0.006) % 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const N = 80;
  const visible = Math.floor(t * N);
  return (
    <Panel tick="SLAM" title="Map drawn while moving">
      <svg viewBox="0 0 480 220" className="w-full">
        <rect x="10" y="10" width="460" height="200" fill="#0A0A0A" />
        {[...Array(N)].map((_, i) => {
          if (i > visible) return null;
          const a = (i / N) * Math.PI * 4;
          const r = 60 + (i / N) * 30;
          const x = 240 + Math.cos(a) * r;
          const y = 110 + Math.sin(a) * r * 0.5;
          return <circle key={i} cx={x} cy={y} r="1.6" fill="#0047FF" />;
        })}
        {/* Drone at head */}
        {(() => {
          const a = (visible / N) * Math.PI * 4;
          const r = 60 + (visible / N) * 30;
          const x = 240 + Math.cos(a) * r;
          const y = 110 + Math.sin(a) * r * 0.5;
          return <circle cx={x} cy={y} r="5" fill="#fff" />;
        })()}
      </svg>
    </Panel>
  );
}

export function RFWave() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setT((p) => p + 0.04); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const path = [...Array(60)].map((_, i) => {
    const x = i * 8;
    const y = 70 + Math.sin(i * 0.4 + t) * 18 * Math.exp(-i * 0.015);
    return `${i === 0 ? "M" : "L"}${x} ${y}`;
  }).join(" ");
  return (
    <Panel tick="RF · WAVE" title="Amplitude falls with distance">
      <svg viewBox="0 0 480 140" className="w-full">
        <path d={path} stroke="#0047FF" strokeWidth="2" fill="none" />
        <line x1="0" y1="70" x2="480" y2="70" stroke="#E5E5E5" />
        <text x="10" y="20" fontFamily="JetBrains Mono" fontSize="10" fill="#888">DISTANCE →</text>
      </svg>
    </Panel>
  );
}

export function TelemetryFlow() {
  return (
    <Panel tick="LINK · TELEMETRY" title="Command up · Video down">
      <svg viewBox="0 0 480 160" className="w-full">
        <rect x="20" y="20" width="120" height="60" stroke="#111" fill="#FAFAFA" />
        <text x="80" y="55" textAnchor="middle" fontFamily="Outfit" fontWeight="700" fontSize="13">PILOT</text>
        <rect x="340" y="80" width="120" height="60" stroke="#0047FF" fill="#FAFAFA" />
        <text x="400" y="115" textAnchor="middle" fontFamily="Outfit" fontWeight="700" fontSize="13">DRONE</text>
        {/* uplink */}
        <line x1="140" y1="50" x2="340" y2="90" stroke="#0047FF" strokeWidth="2" />
        <text x="240" y="60" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#0047FF">COMMAND</text>
        {/* downlink */}
        <line x1="340" y1="120" x2="140" y2="80" stroke="#FF3B30" strokeWidth="2" />
        <text x="240" y="115" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#FF3B30">VIDEO</text>
        <circle r="4" fill="#0047FF">
          <animateMotion dur="2s" repeatCount="indefinite" path="M140 50 L340 90" />
        </circle>
        <circle r="4" fill="#FF3B30">
          <animateMotion dur="2s" repeatCount="indefinite" path="M340 120 L140 80" />
        </circle>
      </svg>
    </Panel>
  );
}

export function LinkLossRTH() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setT((p) => (p + 0.005) % 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const half = t < 0.5 ? t * 2 : 1;
  const back = t > 0.5 ? (t - 0.5) * 2 : 0;
  const droneX = 60 + half * 380 - back * 380;
  const droneY = 100 + Math.sin(half * Math.PI) * -30;
  const lost = t > 0.5;
  return (
    <Panel tick="FAILSAFE · RTH" title="Link dies → drone returns home">
      <svg viewBox="0 0 480 180" className="w-full">
        <rect x="10" y="10" width="460" height="160" fill="#FAFAFA" stroke="#E5E5E5" />
        <circle cx="60" cy="140" r="6" fill="#0047FF" />
        <text x="50" y="160" fontFamily="JetBrains Mono" fontSize="10" fill="#0047FF">HOME</text>
        <circle cx={droneX} cy={droneY} r="6" fill="#fff" stroke="#111" strokeWidth="2" />
        {lost && <text x={droneX + 8} y={droneY - 8} fontFamily="JetBrains Mono" fontSize="10" fill="#FF3B30">LINK · LOST</text>}
      </svg>
    </Panel>
  );
}

export function MeshNetwork() {
  return (
    <Panel tick="MESH · NETWORK" title="Self-healing connections">
      <svg viewBox="0 0 480 200" className="w-full">
        {(() => {
          const nodes = [
            [80, 100], [200, 50], [200, 150], [320, 60], [320, 140], [430, 100],
          ];
          const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 2], [3, 4]];
          return (
            <g>
              {edges.map(([a, b], i) => (
                <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#0047FF" strokeOpacity="0.6" />
              ))}
              {nodes.map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="10" fill="#fff" stroke="#111" strokeWidth="1.5" />
                  <text x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#111">{i + 1}</text>
                </g>
              ))}
            </g>
          );
        })()}
      </svg>
    </Panel>
  );
}

export function SoftwareAnatomy() {
  const items = [
    { k: "GROUND STATION", h: "humans + maps", c: "#FAFAFA" },
    { k: "COMPANION", h: "vision + planning", c: "#FFFFFF" },
    { k: "FLIGHT CONTROLLER", h: "1 kHz hard real-time", c: "#0047FF" },
  ];
  return (
    <Panel tick="STACK" title="Three boxes. Three deadlines.">
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.k} className="border border-[rgb(var(--soa-ink))] p-3 rounded-sm" style={{ background: i.c, color: i.c === "#0047FF" ? "#fff" : "#111" }}>
            <div className="soa-mono text-[10px] tracking-widest opacity-80">{i.k}</div>
            <div className="soa-display text-base font-bold">{i.h}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PerceptionPipeline() {
  return (
    <Panel tick="PIPELINE" title="Perception → Planning → Control">
      <svg viewBox="0 0 480 120" className="w-full">
        {["PERCEPTION", "PLANNING", "CONTROL"].map((s, i) => (
          <g key={s}>
            <rect x={20 + i * 155} y="35" width="140" height="50" fill="#FFFFFF" stroke="#111" />
            <text x={90 + i * 155} y="65" textAnchor="middle" fontFamily="Outfit" fontWeight="800" fontSize="13" fill="#111">{s}</text>
            {i < 2 && (
              <g>
                <line x1={160 + i * 155} y1="60" x2={175 + i * 155} y2="60" stroke="#0047FF" strokeWidth="2" />
                <polygon points={`${175 + i * 155},55 ${185 + i * 155},60 ${175 + i * 155},65`} fill="#0047FF" />
              </g>
            )}
          </g>
        ))}
        <circle r="3" fill="#0047FF">
          <animateMotion dur="3s" repeatCount="indefinite" path="M20 60 L490 60" />
        </circle>
      </svg>
    </Panel>
  );
}

export function CVBoxes() {
  return (
    <Panel tick="VISION" title="Detection · Tracking · Segmentation">
      <svg viewBox="0 0 480 200" className="w-full">
        <rect x="10" y="10" width="460" height="180" fill="#0A0A0A" />
        {[1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={60 + i * 110} y="60" width="80" height="100" fill="none" stroke="#00C759" strokeWidth="2" />
            <text x={60 + i * 110} y="55" fontFamily="JetBrains Mono" fontSize="10" fill="#00C759">obj {i} · 0.{90 - i * 5}</text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

export function OneToMany() {
  return (
    <Panel tick="MULTI-AGENT" title="Independence vs coordination">
      <svg viewBox="0 0 480 180" className="w-full">
        <g>
          <text x="10" y="20" fontFamily="JetBrains Mono" fontSize="10" fill="#888">INDEPENDENT</text>
          <line x1="20" y1="40" x2="220" y2="140" stroke="#FF3B30" strokeWidth="1.5" />
          <line x1="20" y1="120" x2="220" y2="40" stroke="#FF3B30" strokeWidth="1.5" />
          <text x="120" y="100" fontFamily="JetBrains Mono" fontSize="10" fill="#FF3B30">COLLISION</text>
        </g>
        <g transform="translate(240 0)">
          <text x="10" y="20" fontFamily="JetBrains Mono" fontSize="10" fill="#888">COORDINATED</text>
          <path d="M20 40 C 100 40, 100 60, 220 60" stroke="#0047FF" strokeWidth="1.5" fill="none" />
          <path d="M20 120 C 100 120, 100 100, 220 100" stroke="#0047FF" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
    </Panel>
  );
}

export function Consensus() {
  const [t, setT] = useState(0);
  const valsRef = useRef([0.2, 0.9, 0.5, 0.7, 0.3, 0.6]);
  useEffect(() => {
    const id = setInterval(() => {
      const v = valsRef.current.slice();
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      valsRef.current = v.map((x) => x + (avg - x) * 0.06);
      setT((p) => p + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <Panel tick="CONSENSUS" title="Each node averages neighbors">
      <svg viewBox="0 0 480 160" className="w-full">
        {valsRef.current.map((v, i) => (
          <g key={i} transform={`translate(${30 + i * 75} 80)`}>
            <circle r="22" fill={`rgba(0,71,255,${0.2 + v})`} stroke="#0047FF" />
            <text textAnchor="middle" y="5" fontFamily="JetBrains Mono" fontSize="11" fill="#fff">{v.toFixed(2)}</text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

export function Resilience() {
  const [agents, setAgents] = useState(8);
  return (
    <Panel tick="RESILIENCE" title="Knock nodes out · swarm adapts">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setAgents((a) => Math.max(2, a - 1))} className="soa-btn-ghost">−</button>
        <div className="soa-mono text-[12px] tracking-widest">{agents} agents</div>
        <button onClick={() => setAgents((a) => Math.min(12, a + 1))} className="soa-btn-ghost">+</button>
      </div>
      <svg viewBox="0 0 480 140" className="w-full">
        {[...Array(agents)].map((_, i) => {
          const x = 30 + i * (420 / Math.max(1, agents));
          return <polygon key={i} points={`${x},70 ${x - 7},85 ${x + 7},85`} fill="#0047FF" />;
        })}
      </svg>
    </Panel>
  );
}

export function SALayers() {
  return (
    <Panel tick="SITUATIONAL AWARENESS" title="Endsley's 3 levels">
      <svg viewBox="0 0 480 200" className="w-full">
        {["PERCEPTION", "COMPREHENSION", "PROJECTION"].map((s, i) => (
          <g key={s}>
            <rect x={20 + i * 30} y={20 + i * 20} width={420 - i * 60} height="40" fill={i === 2 ? "#0047FF" : "#FAFAFA"} stroke="#111" />
            <text x={230} y={45 + i * 20} textAnchor="middle" fontFamily="Outfit" fontWeight="700" fontSize="12" fill={i === 2 ? "#fff" : "#111"}>{`${i + 1} · ${s}`}</text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

export function GCSMock() {
  return (
    <Panel tick="GROUND CONTROL STATION" title="Information, not decoration">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 bg-[#0A0A0A] h-32 border border-[#1F1F1F] p-2 soa-mono text-[10px] text-neutral-400">MAP / CAMERA</div>
        <div className="bg-[#FAFAFA] h-32 border p-2 soa-mono text-[10px]">TELEMETRY</div>
        <div className="col-span-3 bg-[#FFCC00]/20 h-12 border border-[#FFCC00] p-2 soa-mono text-[10px] text-[#111]">ALARMS · GEOFENCE OK · BATT 76%</div>
      </div>
    </Panel>
  );
}

export function MissionTimeline() {
  return (
    <Panel tick="OPERATIONS" title="Plan → Brief → Fly → Debrief">
      <svg viewBox="0 0 480 90" className="w-full">
        <line x1="20" y1="45" x2="460" y2="45" stroke="#111" strokeWidth="1.5" />
        {["PLAN", "BRIEF", "FLY", "DEBRIEF"].map((s, i) => (
          <g key={s} transform={`translate(${50 + i * 130} 0)`}>
            <circle cx="0" cy="45" r="8" fill="#0047FF" />
            <text x="0" y="75" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill="#111">{s}</text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

export function AirspaceLayers() {
  return (
    <Panel tick="AIRSPACE" title="Layers of the sky">
      <svg viewBox="0 0 480 200" className="w-full">
        {[
          { y: 30, c: "#0047FF", label: "CONTROLLED · MANNED" },
          { y: 80, c: "#FFCC00", label: "TRANSITION" },
          { y: 130, c: "#00C759", label: "LOW · UNMANNED" },
        ].map((b, i) => (
          <g key={i}>
            <rect x="20" y={b.y} width="440" height="40" fill={b.c} fillOpacity="0.18" stroke={b.c} />
            <text x="30" y={b.y + 25} fontFamily="JetBrains Mono" fontSize="11" fill="#111">{b.label}</text>
          </g>
        ))}
        <text x="240" y="190" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#888">GROUND</text>
      </svg>
    </Panel>
  );
}

export function Geofence() {
  return (
    <Panel tick="SAFETY · GEOFENCE" title="Virtual boundaries">
      <svg viewBox="0 0 480 180" className="w-full">
        <rect x="10" y="10" width="460" height="160" fill="#FAFAFA" stroke="#E5E5E5" />
        <polygon points="80,40 380,40 410,150 50,150" fill="rgba(0,71,255,0.12)" stroke="#0047FF" strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="220" cy="100" r="8" fill="#fff" stroke="#111" strokeWidth="2" />
        <text x="220" y="125" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#111">INSIDE FENCE</text>
      </svg>
    </Panel>
  );
}

export function EthicsScales() {
  return (
    <Panel tick="ETHICS" title="Where is the human?">
      <svg viewBox="0 0 480 200" className="w-full">
        <line x1="240" y1="40" x2="240" y2="160" stroke="#111" />
        <line x1="80" y1="100" x2="400" y2="100" stroke="#111" strokeWidth="2" transform="rotate(-7 240 100)" />
        <text x="120" y="80" fontFamily="JetBrains Mono" fontSize="11" fill="#0047FF">HUMAN</text>
        <text x="350" y="125" fontFamily="JetBrains Mono" fontSize="11" fill="#FF3B30">MACHINE</text>
        <circle cx="120" cy="80" r="10" fill="#0047FF" />
        <circle cx="360" cy="120" r="14" fill="#FF3B30" />
      </svg>
    </Panel>
  );
}

export function Photogrammetry() {
  return (
    <Panel tick="MAPPING" title="Photos → point cloud">
      <svg viewBox="0 0 480 180" className="w-full">
        <rect x="10" y="10" width="460" height="160" fill="#0A0A0A" />
        {[...Array(120)].map((_, i) => (
          <circle key={i} cx={50 + (i * 13) % 400} cy={30 + ((i * 7) % 130)} r="1.4" fill="#0047FF" />
        ))}
      </svg>
    </Panel>
  );
}

export function NDVI() {
  return (
    <Panel tick="AGRICULTURE · NDVI" title="Seeing crop health">
      <svg viewBox="0 0 480 160" className="w-full">
        {[...Array(80)].map((_, i) => {
          const col = i % 16, row = Math.floor(i / 16);
          const health = 0.3 + Math.random() * 0.7;
          return (
            <rect key={i} x={20 + col * 28} y={10 + row * 28} width="26" height="26"
                  fill={health > 0.65 ? "#00C759" : health > 0.45 ? "#FFCC00" : "#FF3B30"} fillOpacity="0.7" />
          );
        })}
      </svg>
    </Panel>
  );
}

export function InspectionPath() {
  return (
    <Panel tick="INSPECTION" title="Repeatable paths · trend data">
      <svg viewBox="0 0 480 200" className="w-full">
        <rect x="220" y="20" width="40" height="160" fill="#888" />
        <path d="M40 180 Q 100 100, 220 80 Q 260 80, 260 60 Q 260 40, 320 80 Q 380 120, 440 180" stroke="#0047FF" strokeWidth="2" fill="none" strokeDasharray="4 4" />
        <circle r="5" fill="#0047FF">
          <animateMotion dur="6s" repeatCount="indefinite" path="M40 180 Q 100 100, 220 80 Q 260 80, 260 60 Q 260 40, 320 80 Q 380 120, 440 180" />
        </circle>
      </svg>
    </Panel>
  );
}

export function SearchPattern() {
  return (
    <Panel tick="SAR · PATTERN" title="Expanding square search">
      <svg viewBox="0 0 480 200" className="w-full">
        <rect x="10" y="10" width="460" height="180" fill="#0A0A0A" />
        <path d="M240 100 L260 100 L260 80 L220 80 L220 120 L280 120 L280 60 L200 60 L200 140 L300 140 L300 40 L180 40 L180 160 L320 160" stroke="#0047FF" strokeWidth="2" fill="none" />
        <circle cx="240" cy="100" r="4" fill="#fff" />
      </svg>
    </Panel>
  );
}

export function Frontiers() {
  const items = ["UAM", "DELIVERY", "BIO-INSPIRED", "COUNTER-DRONE", "SWARMS"];
  return (
    <Panel tick="FRONTIERS" title="The next decade of autonomy">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {items.map((s) => (
          <div key={s} className="border border-[#0047FF] text-[#0047FF] p-3 text-center soa-mono text-[12px] tracking-widest">{s}</div>
        ))}
      </div>
    </Panel>
  );
}
