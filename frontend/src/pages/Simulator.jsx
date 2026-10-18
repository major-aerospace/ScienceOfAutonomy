// 3D Drone Flight Simulator — fly through gates with WASD + Space/Shift.
// Auto-falls-back to a top-down arcade variant on touch devices.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, createElement as h } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import FlightEnvironment from "@/components/simulator/FlightEnvironment";
import "./Simulator.css";
import { Play, RotateCcw, Trophy, ArrowUpRight, Wind, Compass, Navigation, Radio } from "lucide-react";

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
  return typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || false);
}

/* -------------------- 3D MODE -------------------- */
function Drone({ onState, physics, running }) {
  const droneRef = useRef();
  const rotorsRef = useRef([]);
  const stateRef = useRef({
    x: 0, y: 1.4, z: 0,
    vx: 0, vy: 0, vz: 0,
    yaw: 0, pitch: 0,
    keys: {},
    windPhase: 0,
  });

  useEffect(() => {
    const dn = (e) => {
      if (!running || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return;
      if (["Space", "ShiftLeft", "ShiftRight", "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"].includes(e.code)) {
        e.preventDefault(); stateRef.current.keys[e.code] = true;
      }
    };
    const up = (e) => { stateRef.current.keys[e.code] = false; };
    const blur = () => { stateRef.current.keys = {}; };
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("blur", blur); window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, [running]);

  const { camera } = useThree();

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    const s = stateRef.current;
    rotorsRef.current.forEach((rotor, i) => { if (rotor) rotor.rotation.y += dt * (running ? 85 : 10) * (i % 2 ? -1 : 1); });
    if (!running) {
      if (droneRef.current) droneRef.current.position.set(0, 1.4 + Math.sin(performance.now()/900)*.04, 0);
      camera.position.lerp({x: 3.4, y: 3.1, z: 6.2}, Math.min(1,dt*2));
      camera.lookAt(0, 1.2, -6);
      return;
    }
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
      droneRef.current.rotation.set(s.vz * .025, s.yaw, -s.vx * .025);
    }

    const camDist = 4.8, camHeight = 1.8;
    const targetCamX = s.x + Math.sin(s.yaw) * camDist;
    const targetCamZ = s.z + Math.cos(s.yaw) * camDist;
    camera.position.lerp({ x: targetCamX, y: s.y + camHeight, z: targetCamZ }, Math.min(1, dt * 6));
    camera.lookAt(s.x, s.y, s.z);

    onState?.(s);
  });

  return h("group", { ref: droneRef, position: [0,1.4,0] },
    h("mesh", {castShadow:true, scale:[.65,.17,.43]}, h("sphereGeometry", {args:[1,24,16]}), h("meshStandardMaterial", {color:"#edf2ef", metalness:.55, roughness:.3})),
    h("mesh", {position:[0,.04,-.36]}, h("sphereGeometry", {args:[.16,20,16]}), h("meshStandardMaterial", {color:"#122c39", metalness:.8, roughness:.15})),
    ...[[.55,.52],[-.55,.52],[.55,-.52],[-.55,-.52]].map(([dx,dz],i)=>h("group",{key:i},
      h("mesh",{position:[dx/2,0,dz/2],rotation:[0,dx*dz>0?-Math.PI/4:Math.PI/4,0],castShadow:true},h("boxGeometry",{args:[.12,.09,.85]}),h("meshStandardMaterial",{color:"#384c55",metalness:.6,roughness:.4})),
      h("group",{position:[dx,.02,dz]},
        h("mesh",{castShadow:true},h("cylinderGeometry",{args:[.1,.12,.16,20]}),h("meshStandardMaterial",{color:"#283c47",metalness:.7})),
        h("mesh",{position:[0,-.05,0]},h("sphereGeometry",{args:[.055,12,8]}),h("meshBasicMaterial",{color:dz<0?"#9af4d4":"#ff9b61"})),
        h("group",{position:[0,.13,0],ref:el=>{rotorsRef.current[i]=el;}},
          h("mesh",null,h("boxGeometry",{args:[.72,.012,.055]}),h("meshStandardMaterial",{color:"#152c36",transparent:true,opacity:.75})),
          h("mesh",{rotation:[-Math.PI/2,0,0]},h("circleGeometry",{args:[.36,32]}),h("meshBasicMaterial",{color:"#d8e7e8",transparent:true,opacity:.14,side:2}))
        )
      )
    ))
  );
}

function Gate({ pos, rot, cleared, next }) {
  const color = cleared ? "#50d9ac" : (next ? "#ffad63" : "#dae5df");
  const emissive = next ? color : "#000";
  return h("group", { position: pos, rotation: [0, rot, 0] },
    // Frame
    h("mesh", null, h("torusGeometry", { args: [1.4, 0.065, 12, 64] }), h("meshStandardMaterial", { color, emissive, emissiveIntensity: next ? 0.9 : 0 })),
    // Pole
    h("mesh", { position: [0, -1.5, 0] }, h("cylinderGeometry", { args: [0.05, 0.05, 1.5] }), h("meshStandardMaterial", { color: "#222" }))
  );
}

function Pad({ pos, r }) {
  return h("group", { position: pos },
    h("mesh", { rotation: [-Math.PI / 2, 0, 0] }, h("circleGeometry", { args: [r, 32] }), h("meshStandardMaterial", { color: "#0047FF", emissive: "#0047FF", emissiveIntensity: 0.5 })),
    h("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [0, 0.01, 0] }, h("ringGeometry", { args: [r * 0.8, r, 32] }), h("meshBasicMaterial", { color: "#fff" }))
  );
}

function Sim3D({ mission, onTick, onGate, onFinish, gatesCleared, holdProgress, running }) {
  return (
    <Canvas shadows camera={{ position: [3.4, 3.1, 6.2], fov: 58 }} dpr={[1, 1.5]} gl={{antialias:true}}>
      <Suspense fallback={null}>
        <FlightEnvironment />
        {mission.kind === "gates" && mission.gates.map((g, i) =>
          h(Gate, { key: i, pos: g.pos, rot: g.rot, cleared: gatesCleared > i, next: gatesCleared === i }))}
        {mission.kind === "hover" && h(Gate, { pos: mission.target.pos, rot: 0, cleared: holdProgress >= 1, next: holdProgress < 1 })}
        {mission.kind === "landing" && h(Pad, { pos: mission.pad.pos, r: mission.pad.r })}
        {h(Drone, {
          physics: mission.physics, running,
          onState: (s) => { onTick(s); if (running) checkObjective(s, mission, gatesCleared, onGate, onFinish); }
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
function ArcadeSim({ mission, onTick, onGate, onFinish, gatesCleared, running }) {
  const canvasRef = useRef();
  const stateRef = useRef({ x: 250, y: 380, vx: 0, vy: 0, keys: {} });

  // Map mission gates to 2D arcade coords (or use defaults for non-gate missions)
  const gates2d = useMemo(() => {
    if (mission.kind === "gates") {
      // Map each 3D gate's (x,z) into a 500x420 canvas
      return mission.gates.map((g, i) => ({
        x: 250 + g.pos[0] * 18,
        y: 330 - i * (300 / Math.max(1, mission.gates.length)),
      }));
    }
    if (mission.kind === "hover") return [{ x: 250, y: 200 }];
    return [{ x: 380, y: 80 }]; // landing pad target
  }, [mission]);

  useEffect(() => {
    const dn = (e) => { if (running && ["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code) && !/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) { stateRef.current.keys[e.code] = true; e.preventDefault(); } };
    const up = (e) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, [running]);

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
      s.vx += (running ? ax + tx : 0) * 320 * dt;
      s.vy += (running ? ay + ty : 0) * 320 * dt;
      s.vx *= 0.92; s.vy *= 0.92;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 12) { s.x = 12; s.vx = 0; } if (s.x > w - 12) { s.x = w - 12; s.vx = 0; }
      if (s.y < 12) { s.y = 12; s.vy = 0; } if (s.y > h2 - 12) { s.y = h2 - 12; s.vy = 0; }

      // Draw
      const sea = ctx.createLinearGradient(0,0,w,h2); sea.addColorStop(0,"#153d4b"); sea.addColorStop(1,"#0b2535");
      ctx.fillStyle = sea; ctx.fillRect(0, 0, w, h2);
      ctx.fillStyle="#365c58"; ctx.beginPath(); ctx.ellipse(250,210,180,290,-.25,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#263e44"; ctx.fillRect(130,0,240,420);
      ctx.strokeStyle = "#ffffff0b";
      for (let i = 0; i < w; i += 25) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h2); ctx.stroke(); }
      for (let i = 0; i < h2; i += 25) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
      gates2d.forEach((g, i) => {
        const cleared = gatesCleared > i, next = gatesCleared === i;
        ctx.strokeStyle = cleared ? "#71e6b9" : next ? "#ffc085" : "#8fa8ab"; ctx.lineWidth = next ? 3 : 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, 22, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.strokeStyle="#dfeae9"; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(s.x-9,s.y-9); ctx.lineTo(s.x+9,s.y+9); ctx.moveTo(s.x+9,s.y-9); ctx.lineTo(s.x-9,s.y+9); ctx.stroke();
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(s.x,s.y,5,0,Math.PI*2); ctx.fill();
      [[-9,-9],[9,-9],[-9,9],[9,9]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(s.x+x,s.y+y,5,0,Math.PI*2);ctx.stroke();});

      // gate check
      if (running && gatesCleared < gates2d.length) {
        const g = gates2d[gatesCleared];
        const inside = Math.hypot(s.x - g.x, s.y - g.y) < 20;
        if (mission.kind === "hover") onGate(inside ? "in" : "out");
        else if (inside) {
          if (mission.kind === "landing") { if (Math.hypot(s.vx,s.vy) < 35) onFinish(); }
          else if (gatesCleared + 1 >= gates2d.length) onFinish();
          else onGate();
        }
      }
      onTick({ x: s.x, y: s.y, vx: s.vx, vy: s.vy });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gatesCleared, onGate, onFinish, onTick, gates2d, running, mission.kind]);

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
  const [runId, setRunId] = useState(0);
  const runningRef = useRef(false);
  const [startTs, setStartTs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [gatesCleared, setGatesCleared] = useState(0);
  const [holdTime, setHoldTime] = useState(0); // seconds inside hover zone
  const lastInsideRef = useRef(0);
  const holdRef = useRef(0);
  const telemetryRef = useRef(0);
  const [last, setLast] = useState(null);
  const [best, setBest] = useState(null);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((performance.now() - startTs) / 1000), 50);
    return () => clearInterval(id);
  }, [running, startTs]);

  useEffect(() => {
    let active = true;
    setBest(null);
    if (!user) return;
    api.get(`/sim/best?mission=${missionId}`).then(({ data }) => { if (active) setBest(data.best || null); }).catch(() => {});
    return () => { active = false; };
  }, [user, missionId]);

  // Hover tracking
  const onHover = (state) => {
    if (mission.kind !== "hover" || !running) return;
    const now = performance.now();
    if (state === "in") {
      const dt = (now - (lastInsideRef.current || now)) / 1000;
      lastInsideRef.current = now;
      holdRef.current = Math.min(mission.holdSeconds, holdRef.current + (dt > 0.3 ? 0 : dt));
      setHoldTime(holdRef.current);
      if (holdRef.current >= mission.holdSeconds) finish();
    } else {
      lastInsideRef.current = now;
    }
  };

  const begin = () => {
    runningRef.current = true; setRunId(id => id + 1);
    setRunning(true); setGatesCleared(0); setHoldTime(0); setStartTs(performance.now()); setElapsed(0); setLast(null);
    lastInsideRef.current = 0; holdRef.current = 0;
  };
  const finish = async () => {
    if (!runningRef.current) return;
    runningRef.current = false;
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
  const reset = () => { runningRef.current = false; setRunId(id => id + 1); holdRef.current = 0; setSpeed(0); setRunning(false); setGatesCleared(0); setHoldTime(0); setLast(null); setElapsed(0); };

  const holdProgress = mission.kind === "hover" ? holdTime / mission.holdSeconds : 0;
  const hint = {
    "gate-course-1": "WASD to fly. Space throttle. Shift down. Q/E strafe.",
    "precision-hover": `Stay inside the highlighted zone for ${mission.holdSeconds}s. Wind will push you.`,
    "pylon-slalom": "Weave through alternating gates. Strong wind crosswise.",
    "no-gps-landing": "Land on the marked pad. GPS drift makes your position lie.",
  }[missionId];

  const updateSpeed = (value) => { if (performance.now() - telemetryRef.current > 100) { telemetryRef.current = performance.now(); setSpeed(value); } };
  const descriptions = {
    "gate-course-1": ["01", "Find your flight line", "Follow five illuminated gates along the coast. Smooth inputs beat raw speed.", "5 gates", "Calm"],
    "precision-hover": ["02", "Find your balance", "Hold position against the coastal breeze. Small corrections make the difference.", "8-second hold", "Light wind"],
    "pylon-slalom": ["03", "Own every turn", "Thread the alternating gates while crosswinds test your control.", "6 gates", "Crosswind"],
    "no-gps-landing": ["04", "Trust your eyes", "Approach the landing pad with a gentle descent and limited position assistance.", "Precision landing", "GPS drift"],
  };
  const brief = descriptions[missionId];
  return (
    <div className="flight-page">
      <header className="flight-heading">
        <div><div className="flight-eyebrow"><span /> THE FLIGHT LAB</div><h1>A little altitude.<br/><span>A new perspective.</span></h1></div>
        <p>Learn the feeling behind the physics.<br/>A coastal playground for your next breakthrough.</p>
      </header>
      <div className="flight-workspace">
        <aside className="flight-missions">
          <div className="flight-section-label">CHOOSE YOUR MISSION <Compass size={16}/></div>
          {MISSION_LIST.map(mid => <button key={mid} data-testid={`mission-${mid}`} aria-pressed={missionId===mid} onClick={()=>{reset();setMissionId(mid);}} className={`flight-mission ${missionId===mid?"selected":""}`}>
            <span className="flight-mission-number">{descriptions[mid][0]}</span><span><strong>{MISSIONS[mid].name}</strong><small>{descriptions[mid][3]}</small></span><ArrowUpRight size={17}/>
          </button>)}
          <div className="flight-brief"><span className="flight-section-label">THE OBJECTIVE</span><h2>{brief[1]}</h2><p>{brief[2]}</p><div><Wind size={15}/>{brief[4]}</div></div>
          <div className="flight-record"><Trophy size={18}/><div><small>YOUR PERSONAL BEST</small><strong>{best?`${best.time_sec.toFixed(2)}s`:"Your first flight awaits"}</strong></div></div>
        </aside>
        <section className="flight-console" aria-label="Flight simulator">
          <div className="flight-toolbar"><span><span className="flight-status-dot"/> COASTAL RANGE <small>/ TRAINING FIELD 01</small></span><div className="flight-mode"><button aria-pressed={mode==="3d"} data-testid="sim-mode-3d" onClick={()=>{reset();setMode("3d");}}>3D flight</button><button aria-pressed={mode==="arcade"} data-testid="sim-mode-arcade" onClick={()=>{reset();setMode("arcade");}}>Top-down</button></div></div>
          <div className="flight-stage" data-testid="sim-stage">
            {mode === "3d" ? <Sim3D key={`${missionId}-${runId}`} mission={mission} running={running} onTick={s=>updateSpeed(Math.hypot(s.vx,s.vz))} onGate={arg=>{if(mission.kind==="hover") onHover(arg); else setGatesCleared(g=>g+1);}} onFinish={finish} gatesCleared={gatesCleared} holdProgress={holdProgress}/> : <ArcadeSim key={`${missionId}-${runId}`} mission={mission} running={running} onTick={s=>updateSpeed(Math.hypot(s.vx,s.vy)/100)} onGate={arg=>{if(mission.kind==="hover") onHover(arg); else setGatesCleared(g=>g+1);}} onFinish={finish} gatesCleared={gatesCleared}/>}
            <div className="flight-scene-label"><Navigation size={14}/><span>SEABREEZE FIELD<br/><small>Virtual training environment</small></span></div>
            <div className="flight-crosshair" aria-hidden="true">+</div>
            {!running && <div className="flight-launch"><span className="flight-eyebrow">{last!=null?"FLIGHT COMPLETE":"ALL SYSTEMS READY"}</span><h2>{last!=null?`${last.toFixed(2)} seconds`:"Your sky. Your pace."}</h2><p>{last!=null?"Take another lap. Find a smoother line.":"Explore, experiment, and find your flow."}</p><button data-testid="sim-start" onClick={begin}><Play size={17} fill="currentColor"/>{last!=null?"Fly again":"Launch flight"}<ArrowUpRight size={18}/></button></div>}
            {running && <button aria-label="Reset flight" onClick={reset} data-testid="sim-reset" className="flight-reset"><RotateCcw size={16}/> Reset</button>}
            <div className="flight-telemetry"><HUDStat label="FLIGHT TIME" value={`${elapsed.toFixed(2)}s`}/><HUDStat label={mission.kind==="hover"?"HOLD":mission.kind==="landing"?"OBJECTIVE":"GATES"} value={mission.kind==="hover"?`${holdTime.toFixed(1)} / 8s`:mission.kind==="landing"?"Land on pad":`${gatesCleared} / ${mission.gates.length}`}/><HUDStat label="SPEED" value={`${speed.toFixed(1)} m/s`}/><div className="flight-live"><Radio size={14}/>{running?"IN FLIGHT":"STANDBY"}</div></div>
          </div>
          <div className="flight-controls"><span>YOUR CONTROLS</span><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><small>{mode==="3d"?"Move / turn":"Move"}</small></div>{mode==="3d"&&<><div><kbd>SPACE</kbd><small>Ascend</small></div><div><kbd>SHIFT</kbd><small>Descend</small></div><div><kbd>Q</kbd><kbd>E</kbd><small>Strafe</small></div></>}{mode==="arcade"&&<small>Touch and drag to steer</small>}</div>
        </section>
      </div>
      <div className="flight-footnote"><span>BUILT FOR CURIOSITY. READY FOR PRACTICE.</span><p>{hint} Educational simulation, not flight certification.</p></div>
    </div>
  );
}
function HUDStat({label,value}) {
  return <div className="flight-stat" data-testid={`hud-${label.replace(/\s+/g,"-").toLowerCase()}`}><small>{label}</small><strong>{value}</strong></div>;
}
