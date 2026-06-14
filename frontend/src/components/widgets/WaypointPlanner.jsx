import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TID } from "@/lib/tids";

// Click on the canvas to place waypoints. A Catmull-Rom spline traces a feasible trajectory.
export default function WaypointPlanner() {
  const [pts, setPts] = useState([{ x: 60, y: 200 }, { x: 200, y: 90 }, { x: 360, y: 220 }]);
  const svgRef = useRef();

  const handleClick = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 480;
    const y = ((e.clientY - r.top) / r.height) * 280;
    setPts((p) => [...p, { x, y }].slice(-12));
  };
  const clear = () => setPts([]);

  const pathD = useCatmullRom(pts);
  const [head, setHead] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      setHead((h) => (pathD ? (h + 0.004) % 1 : 0));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathD]);

  const droneAt = useDroneOnPath(pathD, head);

  return (
    <div className="soa-panel p-6 pt-8" data-testid="waypoint-planner-widget">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="soa-tick">PLANNING · 01</div>
          <h3 className="soa-display text-2xl font-bold mt-1">Waypoint Planner</h3>
        </div>
        <Button onClick={clear} variant="ghost" data-testid={TID.waypointClear} className="text-neutral-300 hover:text-white soa-mono uppercase tracking-widest text-[11px]">Clear</Button>
      </div>
      <svg
        ref={svgRef}
        data-testid={TID.waypointCanvas}
        viewBox="0 0 480 280"
        className="w-full bg-neutral-950 rounded-sm border border-neutral-800 cursor-crosshair"
        style={{ aspectRatio: "480/280" }}
        onClick={handleClick}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 24} y1={0} x2={i * 24} y2={280} stroke="#1F1F1F" />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 24} x2={480} y2={i * 24} stroke="#1F1F1F" />
        ))}
        {pathD && <path d={pathD} stroke="#0047FF" strokeWidth="2" fill="none" />}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#0047FF" />
            <text x={p.x + 9} y={p.y + 4} fontFamily="JetBrains Mono" fontSize="9" fill="#fff">WP{i + 1}</text>
          </g>
        ))}
        {droneAt && (
          <g transform={`translate(${droneAt.x} ${droneAt.y}) rotate(${droneAt.ang})`}>
            <polygon points="9,0 -5,4 -5,-4" fill="#fff" />
          </g>
        )}
      </svg>
      <div className="mt-3 soa-mono text-[10px] tracking-widest text-neutral-500">
        TAP TO ADD WAYPOINTS · SMOOTH TRAJECTORY DRAWN IN BLUE
      </div>
    </div>
  );
}

function useCatmullRom(pts) {
  if (!pts || pts.length < 2) return null;
  if (pts.length === 2) return `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y}`;
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// Roughly walk along path using SVG getPointAtLength via a phantom path
function useDroneOnPath(d, t) {
  const [pt, setPt] = useState(null);
  useEffect(() => {
    if (!d) { setPt(null); return; }
    const svgNS = "http://www.w3.org/2000/svg";
    const tmpPath = document.createElementNS(svgNS, "path");
    tmpPath.setAttribute("d", d);
    const len = tmpPath.getTotalLength();
    if (!len) return;
    const p = tmpPath.getPointAtLength(len * t);
    const pAhead = tmpPath.getPointAtLength(len * Math.min(t + 0.005, 1));
    const ang = (Math.atan2(pAhead.y - p.y, pAhead.x - p.x) * 180) / Math.PI;
    setPt({ x: p.x, y: p.y, ang });
  }, [d, t]);
  return pt;
}
