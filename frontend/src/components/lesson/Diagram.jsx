import { useEffect, useState } from "react";
import {
  SensorZoo, SensorViews, SlamBuild, RFWave, TelemetryFlow, LinkLossRTH, MeshNetwork,
  SoftwareAnatomy, PerceptionPipeline, CVBoxes, OneToMany, Consensus, Resilience,
  SALayers, GCSMock, MissionTimeline, AirspaceLayers, Geofence, EthicsScales,
  Photogrammetry, NDVI, InspectionPath, SearchPattern, Frontiers,
} from "./ExtraDiagrams";

// Renders various small animated diagrams used in lessons.
export default function Diagram({ id }) {
  switch (id) {
    case "ooda-loop": return <OODA />;
    case "ooda-mini": return <OODAMini />;
    case "feedback-loop": return <FeedbackLoop />;
    case "cascaded": return <Cascaded />;
    case "fc-board": return <FCBoard />;
    case "gimbal-stabilize": return <GimbalStabilize />;
    case "no-gps-drift": return <NoGPS />;
    // New diagrams for tracks 4–10
    case "sensor-zoo": return <SensorZoo />;
    case "sensor-views": return <SensorViews />;
    case "slam-build": return <SlamBuild />;
    case "rf-wave": return <RFWave />;
    case "telemetry-flow": return <TelemetryFlow />;
    case "link-loss-rth": return <LinkLossRTH />;
    case "mesh-network": return <MeshNetwork />;
    case "software-anatomy": return <SoftwareAnatomy />;
    case "perception-pipeline": return <PerceptionPipeline />;
    case "cv-bboxes": return <CVBoxes />;
    case "one-to-many": return <OneToMany />;
    case "consensus": return <Consensus />;
    case "resilience": return <Resilience />;
    case "sa-layers": return <SALayers />;
    case "gcs-mock": return <GCSMock />;
    case "mission-timeline": return <MissionTimeline />;
    case "airspace-layers": return <AirspaceLayers />;
    case "geofence": return <Geofence />;
    case "ethics-scales": return <EthicsScales />;
    case "photogrammetry": return <Photogrammetry />;
    case "ndvi": return <NDVI />;
    case "inspection-path": return <InspectionPath />;
    case "search-pattern": return <SearchPattern />;
    case "frontiers": return <Frontiers />;
    default: return null;
  }
}

function NodeBox({ x, y, w = 100, h = 44, label, sub }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" stroke="#111" strokeWidth="1.5" />
      <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fontFamily="Outfit" fontWeight="800" fontSize="14" fill="#111">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#888">{sub}</text>}
    </g>
  );
}

function Arrow({ from, to, color = "#0047FF", animate = true }) {
  const id = `arr-${from.x}-${from.y}-${to.x}-${to.y}`;
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={color} />
        </marker>
      </defs>
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="1.5" markerEnd={`url(#${id})`} />
      {animate && (
        <circle r="3" fill={color}>
          <animateMotion dur="2.4s" repeatCount="indefinite" path={`M${from.x} ${from.y} L${to.x} ${to.y}`} />
        </circle>
      )}
    </g>
  );
}

function OODA() {
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">CONTROL · LOOP</div>
      <h4 className="soa-display text-xl font-bold mt-1">Observe → Orient → Decide → Act</h4>
      <svg viewBox="0 0 460 240" className="w-full mt-3">
        <NodeBox x={20} y={20} label="OBSERVE" sub="sensors" />
        <NodeBox x={180} y={20} label="ORIENT" sub="state" />
        <NodeBox x={340} y={20} label="DECIDE" sub="policy" />
        <NodeBox x={180} y={150} label="ACT" sub="motors" />
        <Arrow from={{ x: 120, y: 42 }} to={{ x: 180, y: 42 }} />
        <Arrow from={{ x: 280, y: 42 }} to={{ x: 340, y: 42 }} />
        <Arrow from={{ x: 390, y: 64 }} to={{ x: 280, y: 150 }} />
        <Arrow from={{ x: 180, y: 172 }} to={{ x: 70, y: 64 }} />
      </svg>
    </div>
  );
}

function OODAMini() {
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-4 flex items-center gap-4">
      <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))] min-w-fit">SENSE → THINK → ACT</div>
      <svg viewBox="0 0 360 70" className="w-full">
        <NodeBox x={4} y={14} w={90} h={40} label="SENSE" />
        <NodeBox x={134} y={14} w={90} h={40} label="THINK" />
        <NodeBox x={264} y={14} w={90} h={40} label="ACT" />
        <Arrow from={{ x: 94, y: 34 }} to={{ x: 134, y: 34 }} />
        <Arrow from={{ x: 224, y: 34 }} to={{ x: 264, y: 34 }} />
      </svg>
    </div>
  );
}

function FeedbackLoop() {
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">CONTROL · FEEDBACK</div>
      <h4 className="soa-display text-xl font-bold mt-1">Setpoint − Measurement = Error</h4>
      <svg viewBox="0 0 540 200" className="w-full mt-2">
        <NodeBox x={20} y={70} w={70} h={40} label="SET" />
        <circle cx="130" cy="90" r="14" fill="#FFF" stroke="#111" strokeWidth="1.5" />
        <text x="130" y="95" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700" fontSize="14">−</text>
        <NodeBox x={170} y={70} w={110} h={40} label="CONTROLLER" />
        <NodeBox x={320} y={70} w={90} h={40} label="DRONE" />
        <NodeBox x={440} y={70} w={80} h={40} label="SENSOR" />
        <Arrow from={{ x: 90, y: 90 }} to={{ x: 116, y: 90 }} />
        <Arrow from={{ x: 144, y: 90 }} to={{ x: 170, y: 90 }} />
        <Arrow from={{ x: 280, y: 90 }} to={{ x: 320, y: 90 }} />
        <Arrow from={{ x: 410, y: 90 }} to={{ x: 440, y: 90 }} />
        {/* feedback path */}
        <path d="M520 110 L520 150 L130 150 L130 104" stroke="#111" strokeWidth="1.5" fill="none" />
        <Arrow from={{ x: 130, y: 150 }} to={{ x: 130, y: 104 }} color="#111" animate={false} />
        <text x="270" y="170" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="#888">FEEDBACK</text>
      </svg>
    </div>
  );
}

function Cascaded() {
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">CONTROL · CASCADED</div>
      <h4 className="soa-display text-xl font-bold mt-1">Outer loops command inner loops</h4>
      <svg viewBox="0 0 520 220" className="w-full mt-2">
        <rect x="20" y="20" width="480" height="180" stroke="#111" strokeWidth="1.5" fill="none" />
        <text x="30" y="40" fontFamily="JetBrains Mono" fontSize="10" fill="#888">POSITION LOOP · 10 Hz</text>
        <rect x="80" y="60" width="360" height="120" stroke="#0047FF" strokeWidth="1.5" fill="none" />
        <text x="90" y="80" fontFamily="JetBrains Mono" fontSize="10" fill="#0047FF">ATTITUDE LOOP · 100 Hz</text>
        <rect x="140" y="100" width="240" height="60" stroke="#FF3B30" strokeWidth="1.5" fill="none" />
        <text x="150" y="120" fontFamily="JetBrains Mono" fontSize="10" fill="#FF3B30">RATE LOOP · 1 kHz</text>
        <text x="260" y="148" textAnchor="middle" fontFamily="Outfit" fontWeight="700" fontSize="14">GYRO + MOTORS</text>
      </svg>
    </div>
  );
}

function FCBoard() {
  // Layered representation of a flight controller board with tappable chips
  const [active, setActive] = useState("mcu");
  const chips = [
    { id: "mcu", x: 90, y: 70, w: 90, h: 60, label: "MCU", desc: "Runs the firmware (PX4 / ArduPilot stack)." },
    { id: "imu", x: 200, y: 70, w: 70, h: 60, label: "IMU", desc: "Accelerometer + gyroscope. Rates & accelerations." },
    { id: "baro", x: 290, y: 70, w: 70, h: 60, label: "BARO", desc: "Barometric altitude estimate." },
    { id: "mag", x: 380, y: 70, w: 70, h: 60, label: "MAG", desc: "Magnetometer — absolute heading." },
  ];
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">HARDWARE · FLIGHT CONTROLLER</div>
      <h4 className="soa-display text-xl font-bold mt-1">Anatomy of the brain board</h4>
      <svg viewBox="0 0 520 200" className="w-full mt-2">
        <rect x="20" y="20" width="480" height="160" fill="#001233" stroke="#0047FF" strokeWidth="1.5" rx="3" />
        {chips.map((c) => (
          <g key={c.id} onClick={() => setActive(c.id)} className="cursor-pointer">
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={active === c.id ? "#0047FF" : "#FAFAFA"} stroke="#fff" strokeWidth="1.2" />
            <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 5} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700" fontSize="13" fill={active === c.id ? "#fff" : "#111"}>{c.label}</text>
          </g>
        ))}
        {/* traces */}
        <line x1="180" y1="100" x2="200" y2="100" stroke="#0047FF" strokeWidth="1" />
        <line x1="270" y1="100" x2="290" y2="100" stroke="#0047FF" strokeWidth="1" />
        <line x1="360" y1="100" x2="380" y2="100" stroke="#0047FF" strokeWidth="1" />
      </svg>
      <div className="soa-mono text-[12px] mt-3 text-[rgb(var(--soa-ink-2))]">
        <span className="soa-chip soa-chip-primary mr-2">{active.toUpperCase()}</span>
        {chips.find((c) => c.id === active)?.desc}
      </div>
    </div>
  );
}

function GimbalStabilize() {
  const [a, setA] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setA((Math.sin(performance.now() / 600) * 14)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">PAYLOAD · GIMBAL</div>
      <h4 className="soa-display text-xl font-bold mt-1">3-axis stabilization</h4>
      <svg viewBox="0 0 420 220" className="w-full mt-2">
        {/* Drone body — rotates */}
        <g transform={`translate(210 100) rotate(${a})`}>
          <rect x={-80} y={-12} width={160} height={24} fill="#111" />
          <circle cx={-90} cy={0} r={10} fill="#444" />
          <circle cx={90} cy={0} r={10} fill="#444" />
        </g>
        {/* Gimbal stays flat (counter-rotates) */}
        <g transform={`translate(210 150)`}>
          <rect x={-30} y={-18} width={60} height={36} fill="#FAFAFA" stroke="#0047FF" strokeWidth="1.5" />
          <circle cx={0} cy={0} r={8} fill="#0047FF" />
        </g>
        <line x1={210} y1={112} x2={210} y2={132} stroke="#0047FF" strokeWidth="1.2" />
      </svg>
      <div className="soa-mono text-[11px] mt-2 text-[rgb(var(--soa-ink-3))]">
        BODY TILT · {a.toFixed(1)}° · GIMBAL HOLDS 0°
      </div>
    </div>
  );
}

function NoGPS() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setT((p) => (p + 0.01) % (Math.PI * 2)); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  // Truth: circle; IMU estimate: drifts; vision snaps back periodically
  const truth = { x: 210 + Math.cos(t) * 90, y: 100 + Math.sin(t) * 50 };
  const drift = (t / Math.PI) * 40;
  const visionTick = Math.floor(t / 1.4) % 2 === 0;
  const est = visionTick
    ? truth
    : { x: truth.x + drift, y: truth.y + drift * 0.6 };
  return (
    <div className="bg-white border border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="soa-tick text-[rgb(var(--soa-ink-3))]">NAVIGATION · NO-GPS</div>
      <h4 className="soa-display text-xl font-bold mt-1">Drift → Vision correction</h4>
      <svg viewBox="0 0 420 200" className="w-full mt-2">
        <rect x="10" y="10" width="400" height="180" fill="#FAFAFA" stroke="#E5E5E5" />
        {/* truth path */}
        <ellipse cx="210" cy="100" rx="90" ry="50" fill="none" stroke="#888" strokeDasharray="3 3" />
        <circle cx={truth.x} cy={truth.y} r="6" fill="#00C759" />
        <circle cx={est.x} cy={est.y} r="6" fill="none" stroke="#0047FF" strokeWidth="2" />
      </svg>
      <div className="soa-mono text-[11px] mt-2 text-[rgb(var(--soa-ink-3))]">
        GREEN · TRUTH · BLUE · ESTIMATE · CORRECTS WHEN VISION ENABLED
      </div>
    </div>
  );
}
