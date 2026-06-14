import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState, createElement as h } from "react";

// IMPORTANT: react-three-fiber primitives (mesh, group, boxGeometry, etc.) are
// intolerant of arbitrary DOM-style attributes that the dev tooling (visual-edits)
// injects on JSX elements (`x-line-number`, etc.). We bypass that by using
// React.createElement directly here.

function Arm({ pos, rot = [0, 0, 0] }) {
  return h(
    "mesh",
    { position: pos, rotation: rot },
    h("boxGeometry", { args: [1.4, 0.08, 0.18] }),
    h("meshStandardMaterial", { color: "#1F1F1F", metalness: 0.4, roughness: 0.5 })
  );
}

function Motor({ propSpinSpeed = 0, propColor = "#0047FF", reverse = false }) {
  const propRef = useRef();
  useFrame((_, dt) => {
    if (propRef.current) {
      propRef.current.rotation.y += (reverse ? -1 : 1) * propSpinSpeed * dt;
    }
  });
  return h(
    "group",
    null,
    h("mesh", null,
      h("cylinderGeometry", { args: [0.12, 0.12, 0.18, 24] }),
      h("meshStandardMaterial", { color: "#2A2A2A", metalness: 0.7, roughness: 0.3 })
    ),
    h("mesh", { position: [0, 0.1, 0] },
      h("torusGeometry", { args: [0.13, 0.012, 12, 32] }),
      h("meshStandardMaterial", { color: "#888", metalness: 0.9, roughness: 0.2 })
    ),
    h("group", { ref: propRef, position: [0, 0.18, 0] },
      h("mesh", null,
        h("boxGeometry", { args: [0.9, 0.012, 0.06] }),
        h("meshStandardMaterial", { color: propColor, metalness: 0.2, roughness: 0.4 })
      ),
      h("mesh", { rotation: [0, Math.PI / 2, 0] },
        h("boxGeometry", { args: [0.9, 0.012, 0.06] }),
        h("meshStandardMaterial", { color: propColor, metalness: 0.2, roughness: 0.4 })
      )
    )
  );
}

function Body() {
  return h(
    "group",
    null,
    h("mesh", null,
      h("boxGeometry", { args: [0.62, 0.16, 0.42] }),
      h("meshStandardMaterial", { color: "#0F0F0F", metalness: 0.5, roughness: 0.4 })
    ),
    h("mesh", { position: [0, 0.085, 0] },
      h("boxGeometry", { args: [0.5, 0.005, 0.08] }),
      h("meshStandardMaterial", { color: "#0047FF", emissive: "#0047FF", emissiveIntensity: 0.5 })
    ),
    h("mesh", { position: [0.3, -0.02, 0] },
      h("sphereGeometry", { args: [0.09, 24, 24] }),
      h("meshStandardMaterial", { color: "#111", metalness: 0.9, roughness: 0.15 })
    ),
    h("mesh", { position: [-0.2, 0.085, 0.15] },
      h("sphereGeometry", { args: [0.018, 12, 12] }),
      h("meshStandardMaterial", { color: "#00C759", emissive: "#00C759", emissiveIntensity: 1.5 })
    )
  );
}

function Drone({ tilt = 0, propSpeed = 18, exploded = 0 }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.04;
    if (tilt === 0) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.06;
    else group.current.rotation.z = tilt;
  });

  const armLen = 0.85;
  const arms = [
    { rev: false, sign: [1, 1] },
    { rev: true, sign: [-1, 1] },
    { rev: true, sign: [1, -1] },
    { rev: false, sign: [-1, -1] },
  ];
  const e = exploded;

  return h(
    "group",
    { ref: group },
    h("group", { position: [0, -e * 0.4, 0] }, h(Body)),
    h(Arm, { pos: [armLen * 0.5, e * 0.2, armLen * 0.5], rot: [0, -Math.PI / 4, 0] }),
    h(Arm, { pos: [-armLen * 0.5, e * 0.2, armLen * 0.5], rot: [0, Math.PI / 4, 0] }),
    h(Arm, { pos: [armLen * 0.5, e * 0.2, -armLen * 0.5], rot: [0, Math.PI / 4, 0] }),
    h(Arm, { pos: [-armLen * 0.5, e * 0.2, -armLen * 0.5], rot: [0, -Math.PI / 4, 0] }),
    ...arms.map((m, i) =>
      h("group",
        { key: i, position: [armLen * m.sign[0], e * 0.7, armLen * m.sign[1]] },
        h(Motor, { propSpinSpeed: propSpeed, reverse: m.rev })
      )
    ),
    // Battery
    h("group", { position: [0, -0.18 - e * 0.7, 0] },
      h("mesh", null,
        h("boxGeometry", { args: [0.4, 0.08, 0.18] }),
        h("meshStandardMaterial", { color: "#222", metalness: 0.4, roughness: 0.6 })
      ),
      h("mesh", { position: [0, -0.05, 0] },
        h("boxGeometry", { args: [0.42, 0.005, 0.19] }),
        h("meshStandardMaterial", { color: "#FFCC00", emissive: "#FFCC00", emissiveIntensity: 0.3 })
      )
    ),
    // GNSS module
    h("group", { position: [0, 0.13 + e * 0.6, -0.08] },
      h("mesh", null,
        h("cylinderGeometry", { args: [0.07, 0.07, 0.04, 24] }),
        h("meshStandardMaterial", { color: "#1A1A1A", metalness: 0.5, roughness: 0.4 })
      ),
      h("mesh", { position: [0, 0.025, 0] },
        h("cylinderGeometry", { args: [0.05, 0.05, 0.01, 24] }),
        h("meshStandardMaterial", { color: "#0047FF", emissive: "#0047FF", emissiveIntensity: 0.4 })
      )
    )
  );
}

function Spinner({ children, autorotate = true, speed = 0.4 }) {
  const ref = useRef();
  useFrame((_, dt) => { if (autorotate && ref.current) ref.current.rotation.y += speed * dt; });
  return h("group", { ref }, children);
}

function Lights() {
  return h(
    "group",
    null,
    h("ambientLight", { intensity: 0.7 }),
    h("directionalLight", { position: [5, 6, 4], intensity: 1.1 }),
    h("directionalLight", { position: [-4, 2, -3], intensity: 0.4, color: "#0047FF" })
  );
}

export function HeroDrone() {
  return (
    <Canvas camera={{ position: [2.4, 1.6, 3.2], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
      <Suspense fallback={null}>
        {h(Lights)}
        {h(Spinner, { autorotate: true, speed: 0.35 }, h(Drone, { propSpeed: 28 }))}
      </Suspense>
    </Canvas>
  );
}

export function ExplodedDroneViewer({ exploded, propSpeed = 0 }) {
  const [auto, setAuto] = useState(true);
  return (
    <Canvas
      camera={{ position: [3, 2.2, 3.5], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", touchAction: "none" }}
      onPointerDown={() => setAuto(false)}
    >
      <Suspense fallback={null}>
        {h(Lights)}
        {h(Spinner, { autorotate: auto, speed: 0.25 }, h(Drone, { propSpeed, exploded }))}
      </Suspense>
    </Canvas>
  );
}

export function StabilityDrone3D({ controllerOn }) {
  const [tilt, setTilt] = useState(0);
  const target = useRef(0);
  function TiltDriver() {
    useFrame((_, dt) => {
      if (controllerOn) target.current = 0;
      setTilt((cur) => {
        const k = controllerOn ? 5 : 0.6;
        return cur + (target.current - cur) * Math.min(1, k * dt);
      });
    });
    return null;
  }
  return (
    <Canvas
      camera={{ position: [2.4, 1.4, 3.2], fov: 40 }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
      onPointerDown={() => {
        target.current = 0.5;
        setTimeout(() => { target.current = 0; }, 80);
      }}
    >
      <Suspense fallback={null}>
        {h(Lights)}
        {h(TiltDriver)}
        {h(Drone, { tilt, propSpeed: controllerOn ? 22 : 8 })}
      </Suspense>
    </Canvas>
  );
}

export function PIDDrone({ altitude }) {
  return (
    <Canvas camera={{ position: [2.4, 1.4, 3.2], fov: 40 }} dpr={[1, 2]} style={{ background: "transparent" }}>
      <Suspense fallback={null}>
        {h(Lights)}
        {/* target line */}
        {h("mesh", { position: [0, 0.4, 0] },
          h("boxGeometry", { args: [3, 0.005, 0.005] }),
          h("meshStandardMaterial", { color: "#0047FF", emissive: "#0047FF", emissiveIntensity: 0.7 })
        )}
        {h("group", { position: [0, altitude, 0] }, h(Drone, { propSpeed: 20 }))}
        {h("mesh", { position: [0, -1, 0], rotation: [-Math.PI / 2, 0, 0] },
          h("planeGeometry", { args: [5, 5] }),
          h("meshStandardMaterial", { color: "#EFEFEF" })
        )}
      </Suspense>
    </Canvas>
  );
}
