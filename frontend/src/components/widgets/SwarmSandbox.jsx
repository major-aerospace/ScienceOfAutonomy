import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { TID } from "@/lib/tids";

// 2D boid flocking
export default function SwarmSandbox() {
  const [sep, setSep] = useState(1.2);
  const [ali, setAli] = useState(1.0);
  const [coh, setCoh] = useState(0.8);
  const canvasRef = useRef();
  const params = useRef({ sep, ali, coh });
  params.current = { sep, ali, coh };

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const w = c.width = 520;
    const h = c.height = 280;
    const N = 60;
    const agents = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
    }));
    let raf;
    const step = () => {
      const { sep, ali, coh } = params.current;
      for (let a of agents) {
        let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0, sn = 0;
        for (let b of agents) {
          if (a === b) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < 60 * 60) {
            ax += b.vx; ay += b.vy;
            cx += b.x; cy += b.y;
            n++;
            if (d2 < 18 * 18) {
              sx -= dx / Math.sqrt(d2);
              sy -= dy / Math.sqrt(d2);
              sn++;
            }
          }
        }
        if (n > 0) {
          ax = ax / n - a.vx; ay = ay / n - a.vy;
          cx = cx / n - a.x; cy = cy / n - a.y;
          a.vx += ali * 0.04 * ax + coh * 0.002 * cx;
          a.vy += ali * 0.04 * ay + coh * 0.002 * cy;
        }
        if (sn > 0) {
          a.vx += sep * 0.12 * (sx / sn);
          a.vy += sep * 0.12 * (sy / sn);
        }
        // limit speed
        const sp = Math.hypot(a.vx, a.vy);
        const max = 2.4;
        if (sp > max) { a.vx = (a.vx / sp) * max; a.vy = (a.vy / sp) * max; }
        a.x += a.vx; a.y += a.vy;
        // wrap
        if (a.x < 0) a.x += w; if (a.x > w) a.x -= w;
        if (a.y < 0) a.y += h; if (a.y > h) a.y -= h;
      }
      // draw
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#1F1F1F";
      for (let x = 0; x < w; x += 26) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.fillStyle = "#0047FF";
      for (let a of agents) {
        const ang = Math.atan2(a.vy, a.vx);
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(7, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="soa-panel p-6 pt-8" data-testid="swarm-sandbox-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">EXPERIMENT · 04</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Swarm Sandbox</h3>
        </div>
        <div className="soa-mono text-[10px] tracking-widest text-neutral-400">3 RULES · EMERGENT BEHAVIOR</div>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-sm border border-neutral-800" style={{ aspectRatio: "520/280" }} />
      <div className="grid md:grid-cols-3 gap-6 mt-5">
        <SliderRow label="Separation" testId={TID.swarmSep} value={sep} min={0} max={3} step={0.05} onChange={setSep} />
        <SliderRow label="Alignment" testId={TID.swarmAlign} value={ali} min={0} max={3} step={0.05} onChange={setAli} />
        <SliderRow label="Cohesion" testId={TID.swarmCohesion} value={coh} min={0} max={3} step={0.05} onChange={setCoh} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, testId }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="soa-mono uppercase tracking-widest text-[10px] text-neutral-400">{label}</div>
        <div className="soa-mono text-sm font-bold text-white">{value.toFixed(2)}</div>
      </div>
      <Slider data-testid={testId} value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="mt-2" />
    </div>
  );
}
