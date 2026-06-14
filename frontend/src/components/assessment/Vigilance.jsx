import { useEffect, useRef, useState } from "react";
import { TID } from "@/lib/tids";

// Vigilance task: stare at the radar sweep. Press the button when a rare target appears.
// Score = (hits - false_alarms) / total_targets, clipped 0..1.
const DURATION_S = 35;

export default function Vigilance({ onDone }) {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_S);
  const [targetVisible, setTargetVisible] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const targetTimerRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { clearInterval(id); end(); return 0; }
        return t - 1;
      });
    }, 1000);
    // schedule random targets
    const scheduleNext = () => {
      const delay = 2500 + Math.random() * 4500;
      targetTimerRef.current = setTimeout(() => {
        setTargetVisible(true);
        setTotalTargets((n) => n + 1);
        setTimeout(() => {
          // if user didn't hit, count miss
          setTargetVisible((v) => { if (v) setMisses((m) => m + 1); return false; });
          scheduleNext();
        }, 900);
      }, delay);
    };
    scheduleNext();
    return () => { clearInterval(id); if (targetTimerRef.current) clearTimeout(targetTimerRef.current); };
  }, [running]);

  const end = () => {
    setRunning(false);
    const score = totalTargets === 0 ? 0.5 : Math.max(0, Math.min(1, (hits - falseAlarms * 0.5) / Math.max(1, totalTargets)));
    setTimeout(() => onDone(score), 600);
  };

  const press = () => {
    if (!running) return;
    if (targetVisible) {
      setHits((h) => h + 1);
      setTargetVisible(false);
    } else {
      setFalseAlarms((f) => f + 1);
    }
  };

  return (
    <div className="soa-card p-6">
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">VIGILANCE · WATCH FOR THE BLIP</div>
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">{running ? `${timeLeft}s left` : "Ready"}</div>
      </div>
      <div className="mt-4 bg-neutral-950 rounded-sm h-[260px] relative overflow-hidden">
        {/* Radar */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative w-56 h-56 rounded-full border border-[#0047FF]/40">
            <div className="absolute inset-4 rounded-full border border-[#0047FF]/30" />
            <div className="absolute inset-12 rounded-full border border-[#0047FF]/30" />
            <div className="absolute inset-0 rounded-full" style={{
              background: "conic-gradient(from 0deg, rgba(0,71,255,0.5), transparent 30%)",
              animation: "soa-spin 2.4s linear infinite",
              borderRadius: "100%"
            }} />
            {targetVisible && (
              <div
                className="absolute w-4 h-4 rounded-full bg-[#FF3B30]"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  boxShadow: "0 0 24px rgba(255,59,48,0.7)",
                }}
              />
            )}
          </div>
        </div>
        <style>{`@keyframes soa-spin { to { transform: rotate(360deg); } }`}</style>

        <div className="absolute top-3 left-3 soa-mono text-[10px] tracking-widest text-neutral-400">HITS · {hits}</div>
        <div className="absolute top-3 right-3 soa-mono text-[10px] tracking-widest text-neutral-400">MISSES · {misses}</div>
        <div className="absolute bottom-3 left-3 soa-mono text-[10px] tracking-widest text-neutral-400">FALSE · {falseAlarms}</div>
        <div className="absolute bottom-3 right-3 soa-mono text-[10px] tracking-widest text-neutral-400">{totalTargets} TARGETS</div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        {!running ? (
          <button onClick={() => setRunning(true)} className="soa-btn-primary" data-testid={TID.assessStart}>Start watch</button>
        ) : (
          <button data-testid={TID.vigilHit} onClick={press} className="soa-btn-primary">PRESS · TARGET</button>
        )}
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">Hit when you see red. Wait when you don't.</div>
      </div>
    </div>
  );
}
