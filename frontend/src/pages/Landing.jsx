import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { HeroDrone } from "@/components/three/Drone3D";
import { ArrowRight, Activity, Layers, Compass, Radio, GitBranch, Users, Shield, Globe, Cpu, Plane } from "lucide-react";
import { TID } from "@/lib/tids";
import { api } from "@/lib/api";

const TRACK_ICONS = {
  "track-foundations": Plane,
  "track-anatomy": Layers,
  "track-gnc": Compass,
};

export default function Landing() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    api.get("/tracks").then(({ data }) => setTracks(data.tracks || [])).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative soa-blueprint-bg">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 grid lg:grid-cols-[1.05fr,1fr] gap-10 items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="soa-chip soa-chip-primary">v1.0 · MVP</span>
              <span className="soa-chip">VENDOR-NEUTRAL</span>
              <span className="soa-chip">VISUAL-FIRST</span>
            </div>
            <h1 className="soa-display text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mt-6">
              The science<br />
              of <span className="text-[#0047FF]">autonomy</span>,<br />
              <span className="relative">taught visually.</span>
            </h1>
            <p className="text-lg md:text-xl text-[rgb(var(--soa-ink-2))] mt-5 max-w-xl leading-relaxed">
              Interactive 3D, animated diagrams and live graphs explain how unmanned systems sense, think, move and coordinate. Bite-sized lessons. Zero brand placement.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tracks" data-testid={TID.heroStart} className="soa-btn-primary">
                Start learning <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/assessment" data-testid={TID.heroAssess} className="soa-btn-secondary">
                Take the Dronability self-assessment
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-6 soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))]">
              <span>10 TRACKS · 37 LESSONS · LIVE</span>
              <span>11 INTERACTIVE WIDGETS</span>
            </div>
          </div>

          {/* 3D Hero */}
          <div className="relative h-[380px] md:h-[460px]">
            <div className="absolute inset-0 soa-grid-bg rounded-sm" />
            <div className="absolute inset-0 border-[1.5px] border-[rgb(var(--soa-ink))] rounded-sm overflow-hidden bg-white">
              <HeroDrone />
              {/* HUD corners */}
              <span className="absolute top-3 left-3 soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">QUADROTOR · GENERIC</span>
              <span className="absolute top-3 right-3 soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">CG · STABLE</span>
              <span className="absolute bottom-3 left-3 soa-mono text-[10px] tracking-widest text-[#0047FF]">RPM · 28,400</span>
              <span className="absolute bottom-3 right-3 soa-mono text-[10px] tracking-widest text-[#00C759]">LINK · OK</span>
              {/* Corner marks */}
              <span className="absolute top-2 left-2 w-3 h-3 border-l-[1.5px] border-t-[1.5px] border-[rgb(var(--soa-ink))]" />
              <span className="absolute top-2 right-2 w-3 h-3 border-r-[1.5px] border-t-[1.5px] border-[rgb(var(--soa-ink))]" />
              <span className="absolute bottom-2 left-2 w-3 h-3 border-l-[1.5px] border-b-[1.5px] border-[rgb(var(--soa-ink))]" />
              <span className="absolute bottom-2 right-2 w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-[rgb(var(--soa-ink))]" />
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="border-y border-[rgb(var(--soa-line))] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: "VISUAL-FIRST", v: "3D · diagrams · graphs" },
            { k: "VENDOR-NEUTRAL", v: "No brand placement" },
            { k: "BITE-SIZED", v: "3–7 min lessons" },
            { k: "DRONABILITY", v: "Cognitive self-profile" },
          ].map((s) => (
            <div key={s.k}>
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{s.k}</div>
              <div className="soa-display text-lg font-bold mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRACKS PREVIEW */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr,auto] gap-4 items-end">
          <div>
            <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">CURRICULUM · 03 LIVE</div>
            <h2 className="soa-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
              Climb from rotor to swarm.
            </h2>
          </div>
          <Link to="/tracks" className="soa-btn-secondary">All curriculum</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {tracks.map((t, i) => {
            const Icon = TRACK_ICONS[t.id] || Layers;
            return (
              <Link
                to={`/tracks/${t.id}`}
                data-testid={TID.trackCard(t.id)}
                key={t.id}
                className="soa-card soa-card-clickable p-6 group relative"
              >
                <div className="flex items-center justify-between">
                  <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">TRACK · {String(t.order).padStart(2, "0")}</div>
                  <Icon className="w-5 h-5 text-[#0047FF]" strokeWidth={1.5} />
                </div>
                <h3 className="soa-display text-xl md:text-2xl font-bold mt-3 leading-tight">{t.title}</h3>
                <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">{t.summary}</p>
                <div className="flex items-center justify-between mt-5 soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-2))]">
                  <span>{t.lessonCount} LESSONS · {t.moduleCount} MODULES</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Full curriculum strip */}
        <div className="mt-10 border-t border-[rgb(var(--soa-line))] pt-6">
          <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">FULL CURRICULUM · 10 TRACKS · ALL LIVE</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Sensing & Perception", "Comms & Connectivity", "Autonomy Stack & AI", "Multi-Agent & Swarms", "Human Factors", "Safety & Ethics", "Real-World Applications"].map((n) => (
              <span key={n} className="soa-chip">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT TEACHES */}
      <section className="bg-[rgb(var(--soa-panel))] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">PEDAGOGY</div>
          <h2 className="soa-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2 max-w-3xl">
            Drag a slider. Watch a system respond. <span className="text-[#0047FF]">That's the lesson.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { k: "01", t: "Manipulate", d: "Every concept is a knob, a toggle, or a draggable model. You discover the rule by changing the system." },
              { k: "02", t: "Visualize", d: "A live graph, an animated diagram, or a 3D model is always the hero. Text is a caption, never a wall." },
              { k: "03", t: "Anchor", d: "Each topic links science → real component → real-world use, so insight survives outside the app." },
            ].map((s) => (
              <div key={s.k} className="border border-neutral-800 p-6 rounded-sm">
                <div className="soa-mono text-[#0047FF] text-sm tracking-widest">{s.k}</div>
                <div className="soa-display text-2xl font-bold mt-2">{s.t}</div>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DRONABILITY CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">SIGNATURE FEATURE</div>
            <h2 className="soa-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
              Discover your<br />Dronability profile.
            </h2>
            <p className="text-lg text-[rgb(var(--soa-ink-2))] mt-4 max-w-lg">
              A short, science-grounded self-assessment across five cognitive domains — plus your Trainability slope: how fast you improve with practice.
            </p>
            <Link to="/assessment" className="soa-btn-primary mt-6 inline-flex">
              Take the assessment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            <div className="soa-card p-6">
              <div className="grid grid-cols-5 gap-3">
                {["Spatial", "Attention", "Psychomotor", "Reasoning", "Disposition"].map((d) => (
                  <div key={d}>
                    <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{d.toUpperCase()}</div>
                    <div className="h-24 bg-[rgb(var(--soa-bg))] mt-2 relative">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#0047FF]"
                        style={{ height: `${30 + Math.random() * 60}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[rgb(var(--soa-line))] mt-4 pt-3 flex items-center justify-between">
                <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">TRAINABILITY SLOPE</div>
                <div className="soa-mono text-[#0047FF] font-bold">+0.42 / session</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
