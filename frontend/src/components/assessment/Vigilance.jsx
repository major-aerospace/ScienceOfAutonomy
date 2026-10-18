import { useCallback, useEffect, useRef, useState } from "react";
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
  const [finished, setFinished] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const activeRef = useRef(false);
  const visibleRef = useRef(false);
  const targetTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const finishTimerRef = useRef(null);
  const clockRef = useRef(null);
  const startedAtRef = useRef(0);
  const hitsRef = useRef(0);
  const falseRef = useRef(0);
  const totalRef = useRef(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  const clearTimers = useCallback(() => {
    clearTimeout(targetTimerRef.current);
    clearTimeout(hideTimerRef.current);
    clearInterval(clockRef.current);
  }, []);

  const end = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    visibleRef.current = false;
    clearTimers();
    setRunning(false);
    setFinished(true);
    setTargetVisible(false);
    setTimeLeft(0);
    const t = totalRef.current;
    const score = Math.max(0, Math.min(1, (hitsRef.current - falseRef.current * 0.5) / Math.max(1, t)));
    finishTimerRef.current = setTimeout(() => onDoneRef.current(score), 600);
  }, [clearTimers]);

  useEffect(() => () => {
    activeRef.current = false;
    clearTimers();
    clearTimeout(finishTimerRef.current);
  }, [clearTimers]);

  useEffect(() => {
    if (!running) return;
    clockRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(DURATION_S - (performance.now() - startedAtRef.current) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) end();
    }, 250);
    // schedule random targets
    const scheduleNext = () => {
      if (!activeRef.current) return;
      const delay = 2500 + Math.random() * 4500;
      targetTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        visibleRef.current = true;
        setTargetVisible(true);
        setTargetPosition({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });
        setTotalTargets(++totalRef.current);
        hideTimerRef.current = setTimeout(() => {
          if (!activeRef.current) return;
          if (visibleRef.current) setMisses(m => m + 1);
          visibleRef.current = false;
          setTargetVisible(false);
          scheduleNext();
        }, 900);
      }, delay);
    };
    scheduleNext();
    return clearTimers;
  }, [running, end, clearTimers]);

  const begin = () => {
    if (activeRef.current || finished) return;
    activeRef.current = true;
    startedAtRef.current = performance.now();
    setRunning(true);
  };

  const press = () => {
    if (!activeRef.current) return;
    if (visibleRef.current) {
      visibleRef.current = false;
      setHits(++hitsRef.current);
      setTargetVisible(false);
    } else {
      setFalseAlarms(++falseRef.current);
    }
  };

  return (
    <div className="soa-card p-6">
      <div className="flex items-center justify-between">
        <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">ATTENTION PRACTICE · WATCH FOR THE BLIP</div>
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">{running ? `${timeLeft}s left` : finished ? "Complete" : "Ready"}</div>
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
                  left: `${targetPosition.x}%`,
                  top: `${targetPosition.y}%`,
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
        {finished ? <p role="status">Activity complete. Preparing your result…</p> : !running ? (
          <button onClick={begin} className="soa-btn-primary" data-testid={TID.assessStart}>Start watch</button>
        ) : (
          <button data-testid={TID.vigilHit} onClick={press} className="soa-btn-primary">PRESS · TARGET</button>
        )}
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">Hit when you see red. Wait when you don&apos;t.</div>
      </div>
    </div>
  );
}
