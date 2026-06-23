import { lazy, Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";
import Diagram from "./Diagram";
import Chart from "./Chart";
import { TID } from "@/lib/tids";
import { useTier } from "@/components/TierSelector";

// Widgets (lazy-loaded to keep initial bundle small)
const PIDTuner = lazy(() => import("@/components/widgets/PIDTuner"));
const LiftLab = lazy(() => import("@/components/widgets/LiftLab"));
const SensorFusion = lazy(() => import("@/components/widgets/SensorFusion"));
const SwarmSandbox = lazy(() => import("@/components/widgets/SwarmSandbox"));
const ExplodedDrone = lazy(() => import("@/components/widgets/ExplodedDrone"));
const AutonomyLadder = lazy(() => import("@/components/widgets/AutonomyLadder"));
const RTKVisualizer = lazy(() => import("@/components/widgets/RTKVisualizer"));
const MotorCommutation = lazy(() => import("@/components/widgets/MotorCommutation"));
const SignalNoise = lazy(() => import("@/components/widgets/SignalNoise"));
const WaypointPlanner = lazy(() => import("@/components/widgets/WaypointPlanner"));
const StabilityDroneWidget = lazy(() => import("@/components/widgets/StabilityDroneWidget"));

function Widget({ id }) {
  const fb = (
    <div className="soa-panel p-8 h-[320px] flex items-center justify-center soa-mono text-neutral-500 text-xs tracking-widest">
      LOADING WIDGET…
    </div>
  );
  return (
    <Suspense fallback={fb}>
      {(() => {
        switch (id) {
          case "pid-tuner": return <PIDTuner />;
          case "lift-lab": return <LiftLab />;
          case "sensor-fusion": return <SensorFusion />;
          case "swarm-sandbox": return <SwarmSandbox />;
          case "exploded-drone": return <ExplodedDrone />;
          case "autonomy-ladder": return <AutonomyLadder />;
          case "rtk-visualizer": return <RTKVisualizer />;
          case "motor-commutation": return <MotorCommutation />;
          case "signal-noise": return <SignalNoise />;
          case "waypoint-planner": return <WaypointPlanner />;
          case "stability-drone": return <StabilityDroneWidget />;
          default:
            return <div className="soa-panel p-8 soa-mono text-neutral-500 text-xs">Unknown widget: {id}</div>;
        }
      })()}
    </Suspense>
  );
}

function DeepDive({ block }) {
  const tier = useTier();
  const text = block.text;
  const [open, setOpen] = useState(tier === "deep");
  return (
    <div className="bg-white border-[1.5px] border-[rgb(var(--soa-line))] rounded-sm">
      <button
        data-testid={TID.deepDiveToggle}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="soa-mono uppercase tracking-widest text-[11px] font-semibold">
          Deep dive · the math {tier === "deep" && <span className="text-[#0047FF]">· UNLOCKED</span>}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-[rgb(var(--soa-ink-2))] leading-relaxed">{text}</div>
      )}
    </div>
  );
}

function Caption({ block }) {
  const tier = useTier();
  const variantText = (tier === "eli12" && block.eli12) || (tier === "deep" && block.deep) || null;
  const text = variantText || block.text;
  const label =
    tier === "eli12" ? "EXPLAINED · LIKE I'M 12"
      : tier === "deep" ? "TECHNICAL CAPTION"
        : "CAPTION";
  const labelColor = tier === "eli12" ? "text-[#FFCC00]" : tier === "deep" ? "text-[#0047FF]" : "text-[rgb(var(--soa-ink-3))]";
  return (
    <div className="text-center max-w-3xl mx-auto py-2" data-testid={`caption-${tier}`}>
      <div className={`soa-mono text-[10px] tracking-widest ${labelColor}`}>
        {label}
        {!variantText && tier !== "standard" && (
          <span className="ml-2 opacity-60">· standard text shown</span>
        )}
      </div>
      <p className={`mt-1 ${tier === "eli12" ? "text-xl md:text-2xl font-medium" : "text-lg md:text-xl"} text-[rgb(var(--soa-ink))]`}>
        {text}
      </p>
    </div>
  );
}

function Takeaway({ block }) {
  const tier = useTier();
  const variantText = (tier === "eli12" && block.eli12) || (tier === "deep" && block.deep) || null;
  const text = variantText || block.text;
  const accent = tier === "eli12" ? "#FFCC00" : "#0047FF";
  const label = tier === "eli12" ? "REMEMBER THIS" : tier === "deep" ? "TAKEAWAY · ENGINEERING" : "KEY TAKEAWAY";
  return (
    <div
      className="border-l-[3px] p-5 rounded-sm"
      style={{ borderColor: accent, background: `${accent}0D` }}
      data-testid={`takeaway-${tier}`}
    >
      <div className="soa-mono text-[10px] tracking-widest" style={{ color: accent }}>{label}</div>
      <div className="soa-display text-2xl font-black mt-1">{text}</div>
      {!variantText && tier !== "standard" && (
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] mt-2 opacity-70">
          NOT YET AUTHORED FOR THIS TIER · SHOWING STANDARD
        </div>
      )}
    </div>
  );
}

export default function LessonBlock({ block }) {
  switch (block.type) {
    case "widget":   return <Widget id={block.widgetId} />;
    case "diagram":  return <Diagram id={block.diagramId} />;
    case "chart":    return <Chart id={block.chartId} />;
    case "caption":  return <Caption block={block} />;
    case "takeaway": return <Takeaway block={block} />;
    case "deepdive": return <DeepDive block={block} />;
    default: return null;
  }
}
