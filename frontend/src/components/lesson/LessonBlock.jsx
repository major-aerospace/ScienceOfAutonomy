import { lazy, Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";
import Diagram from "./Diagram";
import Chart from "./Chart";
import { TID } from "@/lib/tids";

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

function Caption({ text }) {
  return (
    <div className="text-center max-w-3xl mx-auto py-2">
      <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">CAPTION</div>
      <p className="text-lg md:text-xl text-[rgb(var(--soa-ink))] mt-1">{text}</p>
    </div>
  );
}

function Takeaway({ text }) {
  return (
    <div className="border-l-[3px] border-[#0047FF] bg-[#0047FF]/5 p-5 rounded-sm">
      <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">KEY TAKEAWAY</div>
      <div className="soa-display text-2xl font-black mt-1">{text}</div>
    </div>
  );
}

function DeepDive({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border-[1.5px] border-[rgb(var(--soa-line))] rounded-sm">
      <button
        data-testid={TID.deepDiveToggle}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="soa-mono uppercase tracking-widest text-[11px] font-semibold">Deep dive · the math</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-[rgb(var(--soa-ink-2))] leading-relaxed">{text}</div>
      )}
    </div>
  );
}

export default function LessonBlock({ block }) {
  switch (block.type) {
    case "widget":   return <Widget id={block.widgetId} />;
    case "diagram":  return <Diagram id={block.diagramId} />;
    case "chart":    return <Chart id={block.chartId} />;
    case "caption":  return <Caption text={block.text} />;
    case "takeaway": return <Takeaway text={block.text} />;
    case "deepdive": return <DeepDive text={block.text} />;
    default: return null;
  }
}
