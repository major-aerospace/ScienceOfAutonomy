// 3D Drone Flight Simulator — fly through gates with WASD + Space/Shift.
// Auto-falls-back to a top-down arcade variant on touch devices.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, createElement as h } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Play, RotateCcw, Trophy } from "lucide-react";

const MISSIONS = {
  "gate-course-1": {
    name: "Gate Course",
    kind: "gates",
    gates: [
      { pos: [0, 1.6, -10], rot: 0 },
      { pos: [6, 2.4, -22], rot: -0.4 },
      { pos: [-4, 1.2, -36], rot: 0.5 },
      { pos: [4, 3.0, -52], rot: -0.3 },
      { pos: [0, 1.8, -68], rot: 0 },
    ],
    physics: { wind: 0, gpsDrift: 0 },
  },
  "precision-hover": {
    name: "Precision Hover",
    kind: "hover",
    target: { pos: [0, 2.4, -10], r: 0.7 },
    holdSeconds: 8,
    physics: { wind: 0.6, gpsDrift: 0 },
  },
  "pylon-slalom": {
    name: "Pylon Slalom",
    kind: "gates",
    gates: [
      { pos: [3, 1.6, -8], rot: 0 },
      { pos: [-3, 1.6, -16], rot: 0 },
      { pos: [3, 1.6, -24], rot: 0 },
      { pos: [-3, 1.6, -32], rot: 0 },
      { pos: [3, 1.6, -40], rot: 0 },
      { pos: [0, 1.6, -50], rot: 0 },
    ],
    physics: { wind: 1.4, gpsDrift: 0 },
  },
  "no-gps-landing": {
    name: "No-GPS Landing",
    kind: "landing",
    pad: { pos: [4, 0.05, -22], r: 1.6 },
    physics: { wind: 0.4, gpsDrift: 0.6 },
  },
};
const MISSION_LIST = Object.keys(MISSIONS);

function isTouch() {
  return typeof window !== "undefined" && (("ontouchstart" in window) || navigator.maxTouchPoints > 0);
}

/* -------------------- 3D MODE -------------------- */
function Drone({ onState, physics }) {
  const droneRef = useRef();
  const stateRef = useRef({
    x: 0, y: 1.4, z: 0,
    vx: 0, vy: 0, vz: 0,
    yaw: 0, pitch: 0,
    keys: {},
    windPhase: 0,
  });

  useEffect(() => {
    const dn = (e) => { stateRef.current.keys[e.code] = true; };
    const up = (e) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  const { camera } = useThree();

  useFrame((_, dt) => {
    const s = stateRef.current;
    const k = s.keys;
    s.windPhase += dt;
    const thrust = (k["Space"] ? 6 : 0) - (k["ShiftLeft"] || k["ShiftRight"] ? 4 : 0);
    const yawIn = (k["KeyA"] ? 1 : 0) - (k["KeyD"] ? 1 : 0);
    s.yaw += yawIn * dt * 1.6;
    const fwd = (k["KeyW"] ? 1 : 0) - (k["KeyS"] ? 1 : 0);
    const strafe = (k["KeyQ"] ? 1 : 0) - (k["KeyE"] ? 1 : 0);

    const accel = 10;
    s.vx += (-Math.sin(s.yaw) * fwd - Math.cos(s.yaw) * strafe) * accel * dt;
    s.vz += (-Math.cos(s.yaw) * fwd + Math.sin(s.yaw) * strafe) * accel * dt;
    s.vy += (thrust - 4.8) * dt;

    // Mission physics: wind buffeting + GPS drift (slow random sway in observed pos)
    const wind = physics?.wind || 0;
    if (wind > 0) {
      s.vx += Math.sin(s.windPhase * 1.7) * wind * dt * 1.4;
      s.vz += Math.cos(s.windPhase * 1.3 + 1.1) * wind * dt * 1.0;
    }
    const gpsDrift = physics?.gpsDrift || 0;
    if (gpsDrift > 0) {
      // Inject a slow biased drift to position (the visible drone wobbles around the truth)
      s.x += Math.sin(s.windPhase * 0.6) * gpsDrift * dt * 0.6;
      s.z += Math.cos(s.windPhase * 0.5) * gpsDrift * dt * 0.6;
    }

    const drag = 0.94;
    s.vx *= drag; s.vy *= 0.97; s.vz *= drag;

    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (s.y < 0.4) { s.y = 0.4; s.vy = 0; }

    if (droneRef.current) {
      droneRef.current.position.set(s.x, s.y, s.z);
      droneRef.current.rotation.set(0, s.yaw, 0);
    }

    const camDist = 4.0, camHeight = 1.2;
    const targetCamX = s.x + Math.sin(s.yaw) * camDist;
    const targetCamZ = s.z + Math.cos(s.yaw) * camDist;
    camera.position.lerp({ x: targetCamX, y: s.y + camHeight, z: targetCamZ }, Math.min(1, dt * 6));
    camera.lookAt(s.x, s.y, s.z);

    onState?.(s);
  });

  // Procedural drone body
  return h("group", { ref: droneRef },
    h("mesh", null, h("boxGeometry", { args: [0.6, 0.12, 0.4] }), h("meshStandardMaterial", { color: "#0F0F0F", metalness: 0.6 })),
    h("mesh", { position: [0, 0.06, 0] }, h("boxGeometry", { args: [0.5, 0.005, 0.06] }), h("meshStandardMaterial", { color: "#0047FF", emissive: "#0047FF", emissiveIntensity: 0.8 })),
    ...[[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]].map(([dx, dz], i) =>
      h("group", { key: i, position: [dx, 0, dz] },
        h("mesh", null, h("cylinderGeometry", { args: [0.08, 0.08, 0.1, 16] }), h("meshStandardMaterial", { color: "#222" })),
        h("mesh", { position: [0, 0.08, 0], rotation: [0, (performance.now() / 60) * (i % 2 ? -1 : 1), 0] },
          h("boxGeometry", { args: [0.5, 0.005, 0.04] }), h("meshStandardMaterial", { color: "#fff", transparent: true, opacity: 0.6 })
        )
      )
    )
  );
}

function Gate({ pos, rot, cleared, next }) {
  const color = cleared ? "#00C759" : (next ? "#0047FF" : "#888");
  const emissive = next ? color : "#000";
  return h("group", { position: pos, rotation: [0, rot, 0] },
    // Frame
    h("mesh", null, h("torusGeometry", { args: [1.4, 0.07, 8, 24] }), h("meshStandardMaterial", { color, emissive, emissiveIntensity: next ? 0.9 : 0 })),
    // Pole
    h("mesh", { position: [0, -1.5, 0] }, h("cylinderGeometry", { args: [0.05, 0.05, 1.5] }), h("meshStandardMaterial", { color: "#222" }))
  );
}

function Ground() {
  return h("mesh", { position: [0, 0, -30], rotation: [-Math.PI / 2, 0, 0] },
    h("planeGeometry", { args: [200, 200, 1, 1] }),
    h("meshStandardMaterial", { color: "#0a0a0a", wireframe: false })
  );
}

function GridFloor() {
  // Visual reference grid (large)
  const lines = [];
  for (let i = -20; i <= 20; i++) {
    lines.push(
      h("line", { key: `vx${i}` },
        h("bufferGeometry", null,
          h("bufferAttribute", { attach: "attributes-position", count: 2, itemSize: 3, array: new Float32Array([i * 4, 0.01, -100, i * 4, 0.01, 30]) })
        ),
        h("lineBasicMaterial", { color: "#1F2235", transparent: true, opacity: 0.6 })
      ),
      h("line", { key: `vz${i}` },
        h("bufferGeometry", null,
          h("bufferAttribute", { attach: "attributes-position", count: 2, itemSize: 3, array: new Float32Array([-80, 0.01, i * 4, 80, 0.01, i * 4]) })
        ),
        h("lineBasicMaterial", { color: "#1F2235", transparent: true, opacity: 0.6 })
      )
    );
  }
  return h("group", null, ...lines);
}

function SkyDome() {
  return h("mesh", null,
    h("sphereGeometry", { args: [400, 32, 32] }),
    h("meshBasicMaterial", { color: "#04060A", side: 1 /* BackSide */ })
  );
}

function Pad({ pos, r }) {
  return h("group", { position: pos },
    h("mesh", { rotation: [-Math.PI / 2, 0, 0] }, h("circleGeometry", { args: [r, 32] }), h("meshStandardMaterial", { color: "#0047FF", emissive: "#0047FF", emissiveIntensity: 0.5 })),
    h("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.01, 0] }, h("ringGeometry", { args: [r * 0.8, r, 32] }), h("meshBasicMaterial", { color: "#fff" }))
  );
}

function Sim3D({ mission, onTick, onGate, onFinish, gatesCleared, holdProgress }) {
  return (
    <Canvas camera={{ position: [0, 2.4, 4], fov: 70 }} dpr={[1, 2]} style={{ background: "#04060A" }}>
      <Suspense fallback={null}>
        {h(SkyDome)}
        {h("ambientLight", { intensity: 0.45 })}
        {h("directionalLight", { position: [10, 14, 6], intensity: 1.4 })}
        {h("directionalLight", { position: [-5, 4, -8], intensity: 0.45, color: "#5A8CFF" })}
        {h(GridFloor)}
        {h(Ground)}
        {mission.kind === "gates" && mission.gates.map((g, i) =>
          h(Gate, { key: i, pos: g.pos, rot: g.rot, cleared: gatesCleared > i, next: gatesCleared === i }))}
        {mission.kind === "hover" && h(Gate, { pos: mission.target.pos, rot: 0, cleared: holdProgress >= 1, next: holdProgress < 1 })}
        {mission.kind === "landing" && h(Pad, { pos: mission.pad.pos, r: mission.pad.r })}
        {h(Drone, {
          physics: mission.physics,
          onState: (s) => { onTick(s); checkObjective(s, mission, gatesCleared, onGate, onFinish); }
        })}
      </Suspense>
    </Canvas>
  );
}

function checkObjective(s, mission, gatesCleared, onGate, onFinish) {
  if (mission.kind === "gates") {
    if (gatesCleared >= mission.gates.length) return;
    const g = mission.gates[gatesCleared];
    const dx = s.x - g.pos[0], dy = s.y - g.pos[1], dz = s.z - g.pos[2];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.3) {
      if (gatesCleared + 1 >= mission.gates.length) onFinish();
      else onGate();
    }
  } else if (mission.kind === "hover") {
    const t = mission.target;
    const dx = s.x - t.pos[0], dy = s.y - t.pos[1], dz = s.z - t.pos[2];
    const inside = Math.sqrt(dx * dx + dy * dy + dz * dz) < t.r;
    onGate(inside ? "in" : "out");
  } else if (mission.kind === "landing") {
    const p = mission.pad;
    const dx = s.x - p.pos[0], dz = s.z - p.pos[2];
    if (Math.sqrt(dx * dx + dz * dz) < p.r && s.y <= 0.45 && Math.abs(s.vy) < 1.5) {
      onFinish();
    }
  }
}

/* -------------------- ARCADE 2D MODE -------------------- */
function ArcadeSim({ mission, onTick, onGate, onFinish, gatesCleared }) {
  const canvasRef = useRef();
  const stateRef = useRef({ x: 250, y: 380, vx: 0, vy: 0, keys: {} });

  // Map mission gates to 2D arcade coords (or use defaults for non-gate missions)
  const gates2d = useMemo(() => {
    if (mission.kind === "gates") {
      // Map each 3D gate's (x,z) into a 500x420 canvas
      return mission.gates.map((g, i) => ({
        x: 250 + g.pos[0] * 18,
        y: 380 - i * (340 / Math.max(1, mission.gates.length)),
      }));
    }
    if (mission.kind === "hover") return [{ x: 250, y: 200 }];
    return [{ x: 380, y: 80 }]; // landing pad target
  }, [mission]);

  useEffect(() => {
    const dn = (e) => { stateRef.current.keys[e.code] = true; e.preventDefault?.(); };
    const up = (e) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // Touch controls
  const touchRef = useRef({ dx: 0, dy: 0 });
  const onTouch = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0];
    if (!t) { touchRef.current = { dx: 0, dy: 0 }; return; }
    touchRef.current = { dx: (t.clientX - r.left) - r.width / 2, dy: (t.clientY - r.top) - r.height / 2 };
  };

  useEffect(() => {
    const c = canvasRef.current; const ctx = c.getContext("2d");
    const w = c.width = 500, h2 = c.height = 420;
    let raf;
    let lastT = performance.now();
    const tick = () => {
      const t = performance.now(); const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
      const s = stateRef.current, k = s.keys;
      const ax = ((k["KeyD"] ? 1 : 0) - (k["KeyA"] ? 1 : 0) + (k["ArrowRight"] ? 1 : 0) - (k["ArrowLeft"] ? 1 : 0));
      const ay = ((k["KeyS"] ? 1 : 0) - (k["KeyW"] ? 1 : 0) + (k["ArrowDown"] ? 1 : 0) - (k["ArrowUp"] ? 1 : 0));
      const tx = touchRef.current.dx / 60, ty = touchRef.current.dy / 60;
      s.vx += (ax + tx) * 320 * dt;
      s.vy += (ay + ty) * 320 * dt;
      s.vx *= 0.92; s.vy *= 0.92;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 12) { s.x = 12; s.vx = 0; } if (s.x > w - 12) { s.x = w - 12; s.vx = 0; }
      if (s.y < 12) { s.y = 12; s.vy = 0; } if (s.y > h2 - 12) { s.y = h2 - 12; s.vy = 0; }

      // Draw
      ctx.fillStyle = "#04060A"; ctx.fillRect(0, 0, w, h2);
      ctx.strokeStyle = "#1F2235";
      for (let i = 0; i < w; i += 25) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h2); ctx.stroke(); }
      for (let i = 0; i < h2; i += 25) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
      gates2d.forEach((g, i) => {
        const cleared = gatesCleared > i, next = gatesCleared === i;
        ctx.strokeStyle = cleared ? "#00C759" : next ? "#0047FF" : "#444"; ctx.lineWidth = next ? 3 : 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, 22, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.fillStyle = "#0047FF"; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill();

      // gate check
      if (gatesCleared < gates2d.length) {
        const g = gates2d[gatesCleared];
        if (Math.hypot(s.x - g.x, s.y - g.y) < 20) {
          if (gatesCleared + 1 >= gates2d.length) onFinish();
          else onGate();
        }
      }
      onTick({ x: s.x, y: s.y, vx: s.vx, vy: s.vy });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gatesCleared, onGate, onFinish, onTick, gates2d]);

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={onTouch}
      onTouchMove={onTouch}
      onTouchEnd={() => { touchRef.current = { dx: 0, dy: 0 }; }}
      className="w-full rounded-sm border border-neutral-800 bg-neutral-950"
      style={{ aspectRatio: "500/420", touchAction: "none" }}
    />
  );
}

/* -------------------- PAGE -------------------- */
export default function Simulator() {
  const { user, refresh } = useAuth();
  const [mode, setMode] = useState(() => (isTouch() ? "arcade" : "3d"));
  const [missionId, setMissionId] = useState("gate-course-1");
  const mission = MISSIONS[missionId];
  const [running, setRunning] = useState(false);
  const [startTs, setStartTs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [gatesCleared, setGatesCleared] = useState(0);
  const [holdTime, setHoldTime] = useState(0); // seconds inside hover zone
  const lastInsideRef = useRef(0);
  const [last, setLast] = useState(null);
  const [best, setBest] = useState(null);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((performance.now() - startTs) / 1000), 50);
    return () => clearInterval(id);
  }, [running, startTs]);

  useEffect(() => {
    if (!user || user === false) return;
    api.get(`/sim/best?mission=${missionId}`).then(({ data }) => setBest(data.best || null)).catch(() => {});
  }, [user, missionId]);

  // Hover tracking
  const onHover = (state) => {
    if (mission.kind !== "hover" || !running) return;
    const now = performance.now();
    if (state === "in") {
      const dt = (now - (lastInsideRef.current || now)) / 1000;
      lastInsideRef.current = now;
      setHoldTime((t) => {
        const next = Math.min(mission.holdSeconds, t + (dt > 0.3 ? 0 : dt));
        if (next >= mission.holdSeconds) finish();
        return next;
      });
    } else {
      lastInsideRef.current = now;
    }
  };

  const begin = () => {
    setRunning(true); setGatesCleared(0); setHoldTime(0); setStartTs(performance.now()); setElapsed(0); setLast(null);
    lastInsideRef.current = 0;
  };
  const finish = async () => {
    if (!running) return;
    const t = (performance.now() - startTs) / 1000;
    setRunning(false); setLast(t); setElapsed(t);
    if (mission.kind === "gates") setGatesCleared(mission.gates.length);
    if (!user || user === false) {
      toast(`Time ${t.toFixed(2)}s — sign in to save your best.`);
      return;
    }
    try {
      const { data } = await api.post("/sim/score", {
        mission: missionId,
        time_sec: t,
        gates_cleared: mission.kind === "gates" ? mission.gates.length : 1,
      });
      if (data?.is_new_best) {
        toast.success(`New best · ${t.toFixed(2)}s · +${data.xpAwarded || 0} XP`);
        setBest({ time_sec: t });
      } else {
        toast(`Run complete · ${t.toFixed(2)}s · best ${data?.best?.time_sec?.toFixed(2)}s`);
      }
      await refresh();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not save run");
    }
  };
  const reset = () => { setRunning(false); setGatesCleared(0); setHoldTime(0); setLast(null); setElapsed(0); };

  const holdProgress = mission.kind === "hover" ? holdTime / mission.holdSeconds : 0;
  const hint = {
    "gate-course-1": "WASD to fly. Space throttle. Shift down. Q/E strafe.",
    "precision-hover": `Stay inside the blue zone for ${mission.holdSeconds}s. Wind will push you.`,
    "pylon-slalom": "Weave through alternating gates. Strong wind crosswise.",
    "no-gps-landing": "Land on the blue pad. GPS drift makes your position lie.",
  }[missionId];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-primary))]">SIMULATOR · {mission.name.toUpperCase()}</div>
          <h1 className="soa-display text-3xl md:text-5xl font-black tracking-tighter mt-1">{mission.name}</h1>
          <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-1 max-w-md">{hint}</p>
        </div>
        <div className="flex gap-2">
          <button data-testid="sim-mode-3d" onClick={() => setMode("3d")} className={`soa-chip ${mode === "3d" ? "soa-chip-primary" : ""}`}>3D</button>
          <button data-testid="sim-mode-arcade" onClick={() => setMode("arcade")} className={`soa-chip ${mode === "arcade" ? "soa-chip-primary" : ""}`}>ARCADE</button>
        </div>
      </div>

      {/* Mission picker */}
      <div className="flex flex-wrap gap-2 mt-5">
        {MISSION_LIST.map((mid) => (
          <button
            key={mid}
            data-testid={`mission-${mid}`}
            onClick={() => { reset(); setMissionId(mid); }}
            className={`soa-chip ${missionId === mid ? "soa-chip-primary" : ""}`}
          >
            {MISSIONS[mid].name}
          </button>
        ))}
      </div>

      {/* HUD */}
      <div className="grid md:grid-cols-4 gap-3 mt-6">
        <HUDStat label="TIME" value={`${elapsed.toFixed(2)}s`} />
        {mission.kind === "gates" && <HUDStat label="GATES" value={`${gatesCleared} / ${mission.gates.length}`} />}
        {mission.kind === "hover" && <HUDStat label="HOLD" value={`${holdTime.toFixed(1)} / ${mission.holdSeconds}s`} />}
        {mission.kind === "landing" && <HUDStat label="OBJECTIVE" value="LAND ON PAD" />}
        <HUDStat label="LAST RUN" value={last != null ? `${last.toFixed(2)}s` : "—"} />
        <HUDStat label="PERSONAL BEST" value={best ? `${best.time_sec.toFixed(2)}s` : "—"} icon={<Trophy className="w-4 h-4 text-[#FFCC00]" />} />
      </div>

      {/* Stage */}
      <div className="mt-6 soa-panel p-3 pt-6 relative">
        <div className="h-[480px] md:h-[520px] relative" data-testid="sim-stage">
          {mode === "3d"
            ? <Sim3D
                mission={mission}
                onTick={(s) => setSpeed(Math.hypot(s.vx, s.vz))}
                onGate={(arg) => {
                  if (mission.kind === "hover") onHover(arg);
                  else setGatesCleared((g) => g + 1);
                }}
                onFinish={finish}
                gatesCleared={gatesCleared}
                holdProgress={holdProgress}
              />
            : <ArcadeSim
                mission={mission}
                onTick={(s) => setSpeed(Math.hypot(s.vx, s.vy) / 100)}
                onGate={() => setGatesCleared((g) => g + 1)}
                onFinish={finish}
                gatesCleared={gatesCleared}
              />
          }
          {!running && (
            <div className="absolute inset-0 grid place-items-center bg-black/55 pointer-events-none">
              <div className="text-center pointer-events-auto">
                <div className="soa-mono text-[10px] tracking-widest text-neutral-400">{last != null ? "RUN COMPLETE" : "READY"}</div>
                <div className="soa-display text-3xl md:text-5xl font-black text-white mt-1">{last != null ? `${last.toFixed(2)}s` : "Take off"}</div>
                <button data-testid="sim-start" onClick={begin} className="soa-btn-primary mt-5"><Play className="w-4 h-4" /> {last != null ? "Run again" : "Start"}</button>
              </div>
            </div>
          )}
          {running && (
            <button onClick={reset} data-testid="sim-reset" className="absolute top-2 right-2 soa-btn-ghost text-white"><RotateCcw className="w-3.5 h-3.5" /></button>
          )}
        </div>
      </div>

      <div className="mt-6 soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">
        SPEED · {speed.toFixed(2)} · MODE {mode.toUpperCase()} · {isTouch() ? "TOUCH" : "KEYBOARD"} CONTROLS
      </div>
    </div>
  );
}

function HUDStat({ label, value, icon }) {
  return (
    <div className="soa-card p-4" data-testid={`hud-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{label}</div>
        {icon}
      </div>
      <div className="soa-display text-2xl md:text-3xl font-black tracking-tighter mt-2">{value}</div>
    </div>
  );
}
