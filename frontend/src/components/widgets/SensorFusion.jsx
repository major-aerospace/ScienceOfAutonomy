import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { TID } from "@/lib/tids";

// Sensor fusion sandbox: simulate a moving target on a small map.
// GPS = noisy absolute; IMU = drifting integrator; Vision = good when on but slow & jittery.
// Fusion = weighted average of enabled sensors with sensible weights.
export default function SensorFusion() {
  const [gps, setGps] = useState(true);
  const [imu, setImu] = useState(true);
  const [vision, setVision] = useState(false);

  const canvasRef = useRef();
  const stateRef = useRef({
    t: 0,
    truth: { x: 100, y: 130 },
    imuDrift: { x: 0, y: 0 },
    gpsLast: { x: 100, y: 130 },
    visionLast: { x: 100, y: 130 },
    estimate: { x: 100, y: 130 },
    history: [],
  });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let raf;
    const w = c.width = 420;
    const h = c.height = 260;

    const draw = () => {
      const s = stateRef.current;
      s.t += 0.03;
      // Truth: figure-8 path
      s.truth.x = w / 2 + Math.sin(s.t) * 140;
      s.truth.y = h / 2 + Math.sin(s.t * 2) * 60;
      // GPS sample every ~6 frames with noise
      if (Math.random() < 0.16) {
        s.gpsLast.x = s.truth.x + (Math.random() - 0.5) * 22;
        s.gpsLast.y = s.truth.y + (Math.random() - 0.5) * 22;
      }
      // IMU drift (integrated bias) — slowly grows when no other sensor active
      s.imuDrift.x += (Math.random() - 0.5) * 0.6;
      s.imuDrift.y += (Math.random() - 0.5) * 0.6;
      // Vision: slow but precise — updates every 12 frames
      if (Math.random() < 0.08) {
        s.visionLast.x = s.truth.x + (Math.random() - 0.5) * 6;
        s.visionLast.y = s.truth.y + (Math.random() - 0.5) * 6;
      }
      // Fuse: weighted by chosen sensors. IMU alone -> drift accumulates.
      let wx = 0, wy = 0, wsum = 0;
      if (gps) { wx += s.gpsLast.x * 0.4; wy += s.gpsLast.y * 0.4; wsum += 0.4; }
      if (vision) { wx += s.visionLast.x * 1.2; wy += s.visionLast.y * 1.2; wsum += 1.2; }
      if (imu) {
        // IMU contributes its previous estimate + a tiny drift
        wx += (s.estimate.x + s.imuDrift.x * 0.02) * 0.2;
        wy += (s.estimate.y + s.imuDrift.y * 0.02) * 0.2;
        wsum += 0.2;
      }
      if (wsum < 0.01) {
        // No sensors enabled — estimate freezes & drifts wildly with imuDrift
        s.estimate.x += s.imuDrift.x * 0.05;
        s.estimate.y += s.imuDrift.y * 0.05;
      } else {
        s.estimate.x = wx / wsum;
        s.estimate.y = wy / wsum;
      }
      s.history.push({ x: s.estimate.x, y: s.estimate.y });
      if (s.history.length > 200) s.history.shift();

      // Draw
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#1F1F1F";
      for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // truth trail
      ctx.strokeStyle = "rgba(0, 199, 89, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 80; i++) {
        const tt = s.t - i * 0.03;
        const px = w / 2 + Math.sin(tt) * 140;
        const py = h / 2 + Math.sin(tt * 2) * 60;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // truth
      ctx.fillStyle = "#00C759";
      ctx.beginPath(); ctx.arc(s.truth.x, s.truth.y, 5, 0, Math.PI * 2); ctx.fill();
      // estimate trail
      ctx.strokeStyle = "rgba(0, 71, 255, 0.7)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      s.history.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
      // estimate marker
      ctx.strokeStyle = "#0047FF";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.estimate.x, s.estimate.y, 8, 0, Math.PI * 2); ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [gps, imu, vision]);

  const sensorCount = [gps, imu, vision].filter(Boolean).length;

  return (
    <div className="soa-panel p-6 pt-8" data-testid="sensor-fusion-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">EXPERIMENT · 03</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Sensor Fusion</h3>
        </div>
        <div className="text-right soa-mono text-[11px] tracking-widest text-neutral-400">
          <div>ACTIVE SENSORS</div>
          <div className="text-white text-lg font-bold">{sensorCount} / 3</div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr,auto] gap-6 items-start">
        <canvas ref={canvasRef} className="w-full rounded-sm bg-neutral-950 border border-neutral-800" style={{ aspectRatio: "420/260" }} />
        <div className="space-y-4 min-w-[200px]">
          <SensorToggle label="GPS" hint="Absolute, noisy" value={gps} onChange={setGps} testId={TID.fusionGps} />
          <SensorToggle label="IMU" hint="Smooth, drifts" value={imu} onChange={setImu} testId={TID.fusionImu} />
          <SensorToggle label="Vision" hint="Precise, slow" value={vision} onChange={setVision} testId={TID.fusionVision} />
          <div className="pt-3 border-t border-neutral-800">
            <div className="soa-mono text-[10px] tracking-widest text-neutral-500">LEGEND</div>
            <div className="flex items-center gap-2 mt-2 soa-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C759]" /> <span className="text-neutral-300">TRUTH</span>
            </div>
            <div className="flex items-center gap-2 mt-1 soa-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#0047FF]" /> <span className="text-neutral-300">ESTIMATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SensorToggle({ label, hint, value, onChange, testId }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="soa-mono uppercase tracking-widest text-[11px] font-bold text-white">{label}</div>
        <div className="soa-mono text-[10px] text-neutral-500">{hint}</div>
      </div>
      <Switch data-testid={testId} checked={value} onCheckedChange={onChange} />
    </div>
  );
}
