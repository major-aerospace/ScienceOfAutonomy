import { StabilityDrone3D } from "@/components/three/Drone3D";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function StabilityDroneWidget() {
  const [on, setOn] = useState(true);
  return (
    <div className="soa-panel p-6 pt-8" data-testid="stability-drone-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">DEMO · STABILITY</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Quad Without Code</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="soa-mono text-[10px] tracking-widest text-neutral-400">FLIGHT CONTROLLER</div>
          <Switch checked={on} onCheckedChange={setOn} />
        </div>
      </div>
      <div className="bg-neutral-950 rounded-sm h-[280px]">
        <StabilityDrone3D controllerOn={on} />
      </div>
      <div className="mt-3 soa-mono text-[10px] tracking-widest text-neutral-500">
        TAP THE DRONE TO PUSH IT · WATCH IT CORRECT (OR FAIL)
      </div>
    </div>
  );
}
