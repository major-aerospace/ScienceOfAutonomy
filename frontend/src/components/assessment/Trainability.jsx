import { useEffect, useRef, useState } from "react";
import { TID } from "@/lib/tids";

// Trainability: click on each target as it appears. Time taken = your score.
// We repeat this (the assessment runner calls it twice) to measure improvement.
const TARGETS = 8;

export default function Trainability({ label, onDone }) {
  const [pos, setPos] = useState(() => randomPos());
  const [hits, setHits] = useState(0);
  const [startTs, setStartTs] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(((performance.now() - startTs) / 1000));
    }, 50);
    return () => clearInterval(id);
  }, [running, startTs]);

  const begin = () => {
    setHits(0); setPos(randomPos()); setRunning(true); setStartTs(performance.now()); setElapsed(0);
  };

  const click = () => {
    const next = hits + 1;
    setHits(next);
    if (next >= TARGETS) {
      const t = (performance.now() - startTs) / 1000;
      setRunning(false);
      setElapsed(t);
      setTimeout(() => onDone(t), 400);
    } else {
      setPos(randomPos());
    }
  };

  return (
    <div className="soa-card p-6">
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">TRAINABILITY · {label}</div>
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">{hits}/{TARGETS} · {elapsed.toFixed(2)}s</div>
      </div>
      <div className="relative bg-neutral-950 rounded-sm h-[280px] mt-3 overflow-hidden">
        {running ? (
          <button
            data-testid={TID.trainTarget}
            onClick={click}
            className="absolute w-10 h-10 rounded-full bg-[#0047FF] hover:bg-[#0038CC] transition-transform"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <button onClick={begin} className="soa-btn-primary" data-testid={TID.assessStart}>Start · click {TARGETS} targets</button>
          </div>
        )}
      </div>
      <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))] mt-3">
        Click the blue dot as fast as you can. Each click teleports it.
      </div>
    </div>
  );
}

function randomPos() {
  return { x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 };
}
