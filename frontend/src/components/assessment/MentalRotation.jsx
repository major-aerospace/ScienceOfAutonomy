import { useEffect, useMemo, useState } from "react";
import { TID } from "@/lib/tids";

// Mental rotation: show a 3D-ish shape and ask which option is the same shape rotated.
// We use small SVG L-shaped polyominoes. Score = fraction correct of N trials.
const TRIALS = 6;

function makeShape() {
  // L-tetromino variations
  const cells = [
    [0, 0], [0, 1], [0, 2], [1, 2],
  ];
  return cells;
}

function rotate(cells, k) {
  let pts = cells.map(([x, y]) => [x, y]);
  for (let i = 0; i < k; i++) {
    pts = pts.map(([x, y]) => [y, -x]);
  }
  // normalize
  const minX = Math.min(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  return pts.map(([x, y]) => [x - minX, y - minY]);
}

function mirror(cells) {
  const pts = cells.map(([x, y]) => [-x, y]);
  const minX = Math.min(...pts.map(p => p[0]));
  return pts.map(([x, y]) => [x - minX, y]);
}

function same(a, b) {
  if (a.length !== b.length) return false;
  const A = new Set(a.map(p => p.join(",")));
  for (const p of b) if (!A.has(p.join(","))) return false;
  return true;
}

function Shape({ cells, size = 20, color = "#0047FF" }) {
  const w = Math.max(...cells.map(p => p[0])) + 1;
  const h = Math.max(...cells.map(p => p[1])) + 1;
  return (
    <svg viewBox={`-1 -1 ${w + 2} ${h + 2}`} width={size * (w + 2)} height={size * (h + 2)}>
      {cells.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={color} stroke="#fff" strokeWidth="0.06" />
      ))}
    </svg>
  );
}

export default function MentalRotation({ onDone }) {
  const trials = useMemo(() => {
    const base = makeShape();
    return Array.from({ length: TRIALS }, () => {
      const targetRot = Math.floor(Math.random() * 4);
      const target = rotate(base, targetRot);
      // 3 options: 1 same-rotated, 2 mirrored-rotated
      const correctOption = rotate(target, Math.floor(Math.random() * 4));
      const decoys = [];
      while (decoys.length < 2) {
        const d = rotate(mirror(base), Math.floor(Math.random() * 4));
        if (!decoys.some((dd) => same(dd, d))) decoys.push(d);
      }
      const options = [correctOption, ...decoys];
      // shuffle
      const order = [0, 1, 2].sort(() => Math.random() - 0.5);
      const shuffled = order.map((i) => options[i]);
      const correctIndex = order.indexOf(0);
      return { target, options: shuffled, correctIndex };
    });
  }, []);

  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [last, setLast] = useState(null);

  if (idx >= TRIALS) {
    const score = correct / TRIALS;
    return (
      <div className="soa-card p-8 text-center">
        <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">RESULT · MENTAL ROTATION</div>
        <div className="soa-display text-4xl font-black mt-2">{correct} / {TRIALS}</div>
        <button className="soa-btn-primary mt-5" onClick={() => onDone(score)} data-testid={TID.assessNext}>Continue</button>
      </div>
    );
  }

  const t = trials[idx];
  const pick = (i) => {
    const isOk = i === t.correctIndex;
    setLast(isOk);
    if (isOk) setCorrect((c) => c + 1);
    setTimeout(() => { setLast(null); setIdx((x) => x + 1); }, 400);
  };

  return (
    <div className="soa-card p-6">
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">MENTAL ROTATION · {idx + 1}/{TRIALS}</div>
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">Pick the matching rotation</div>
      </div>
      <div className="flex items-center justify-center mt-6">
        <div className="p-4 border-[1.5px] border-[rgb(var(--soa-ink))] rounded-sm">
          <Shape cells={t.target} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-6">
        {t.options.map((opt, i) => (
          <button
            key={i}
            data-testid={TID.mrChoice(i)}
            onClick={() => pick(i)}
            className={`soa-card p-4 grid place-items-center transition-all ${last != null ? "" : "hover:-translate-y-1"}`}
          >
            <Shape cells={opt} color={last != null ? (i === t.correctIndex ? "#00C759" : "#111") : "#0047FF"} />
          </button>
        ))}
      </div>
    </div>
  );
}
