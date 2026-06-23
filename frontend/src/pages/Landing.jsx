import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeroDrone } from "@/components/three/Drone3D";
import { ArrowRight, Activity, Layers, Compass, Radio, GitBranch, Users, Shield, Globe, Cpu, Plane, Gamepad2 } from "lucide-react";
import { TID } from "@/lib/tids";
import { api } from "@/lib/api";

const TRACK_ICONS = {
  "track-foundations": Plane,
  "track-anatomy": Layers,
  "track-gnc": Compass,
};

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function Landing() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    api.get("/tracks").then(({ data }) => setTracks(data.tracks || [])).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative soa-blueprint-bg">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-28 grid lg:grid-cols-[1.05fr,1fr] gap-12 items-center">
          <motion.div {...fade} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="soa-mono text-[10px] tracking-[0.32em] text-[rgb(var(--soa-ink-3))]">
              SCIENCE · ASSESSMENT · SIMULATOR
            </div>
            <h1 className="soa-display text-5xl md:text-[88px] font-black tracking-tighter leading-[0.92] mt-6">
              Learn autonomy<br />the way you'd<br />
              <span className="text-[rgb(var(--soa-primary))]">design&nbsp;it.</span>
            </h1>
            <p className="text-lg md:text-xl text-[rgb(var(--soa-ink-2))] mt-8 max-w-xl leading-relaxed">
              Bite-sized lessons. A 3D flight simulator. A scientifically-grounded self-assessment. One platform, no brand placement.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/simulator" data-testid={TID.heroStart} className="soa-btn-primary">
                <Gamepad2 className="w-4 h-4" /> Open the simulator
              </Link>
              <Link to="/tracks" className="soa-btn-secondary">
                Browse curriculum <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-8 soa-mono text-[10px] tracking-[0.28em] text-[rgb(var(--soa-ink-3))]">
              <span>10 TRACKS</span>
              <span>46 LESSONS</span>
              <span>1 SIMULATOR</span>
            </div>
          </motion.div>

          {/* 3D Hero */}
          <motion.div
            {...fade}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative h-[420px] md:h-[520px]"
          >
            <div className="absolute inset-0 soa-grid-bg rounded-sm" />
            <div className="absolute inset-0 border-[1.5px] border-[rgb(var(--soa-line))] rounded-sm overflow-hidden bg-[rgb(var(--soa-surface))]">
              <HeroDrone />
              <span className="absolute top-3 left-3 soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">QUADROTOR · GENERIC</span>
              <span className="absolute bottom-3 left-3 soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-primary))]">RPM · 28,400</span>
              <span className="absolute bottom-3 right-3 soa-mono text-[10px] tracking-widest text-[#00C759]">LINK · OK</span>
              <span className="absolute top-2 left-2 w-3 h-3 border-l-[1.5px] border-t-[1.5px] border-[rgb(var(--soa-line))]" />
              <span className="absolute top-2 right-2 w-3 h-3 border-r-[1.5px] border-t-[1.5px] border-[rgb(var(--soa-line))]" />
              <span className="absolute bottom-2 left-2 w-3 h-3 border-l-[1.5px] border-b-[1.5px] border-[rgb(var(--soa-line))]" />
              <span className="absolute bottom-2 right-2 w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-[rgb(var(--soa-line))]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-y border-[rgb(var(--soa-line))] bg-[rgb(var(--soa-surface))]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
          {[
            { k: "01", t: "Learn", d: "10 vendor-neutral tracks. Every lesson is a model, a graph or a sim — never a paragraph." },
            { k: "02", t: "Assess", d: "A 5-domain Dronability profile with a Trainability slope you can grow over time." },
            { k: "03", t: "Fly", d: "A built-in 3D drone simulator. Your gate-course time feeds your psychomotor score." },
          ].map((s, i) => (
            <motion.div
              key={s.k}
              {...fade}
              viewport={{ once: true, margin: "-80px" }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <div className="soa-mono text-[10px] tracking-[0.3em] text-[rgb(var(--soa-primary))]">{s.k}</div>
              <div className="soa-display text-2xl md:text-3xl font-bold mt-3">{s.t}</div>
              <p className="text-[rgb(var(--soa-ink-2))] mt-3 leading-relaxed text-[15px]">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TRACKS PREVIEW */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr,auto] gap-4 items-end">
          <div>
            <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">CURRICULUM</div>
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
          <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">FULL CURRICULUM</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Sensing & Perception", "Comms & Connectivity", "Autonomy Stack & AI", "Multi-Agent & Swarms", "Human Factors", "Safety & Ethics", "Real-World Applications"].map((n) => (
              <span key={n} className="soa-chip">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATOR SHOWCASE */}
      <section className="bg-[rgb(var(--soa-panel))] text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fade} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="soa-mono text-[10px] tracking-[0.3em] text-[rgb(var(--soa-primary))]">FLAGSHIP · SIMULATOR</div>
            <h2 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-4 leading-[0.95]">
              A real flight loop,<br />in your browser.
            </h2>
            <p className="text-lg text-neutral-400 mt-5 max-w-md leading-relaxed">
              Throttle, drag, yaw — every input feeds physics. Fly a gate course in 3D on desktop, an arcade variant on mobile. Your best time becomes part of your Dronability profile.
            </p>
            <Link to="/simulator" className="soa-btn-primary mt-7 inline-flex">
              <Gamepad2 className="w-4 h-4" /> Take flight
            </Link>
          </motion.div>
          <motion.div {...fade} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <div className="relative aspect-video border border-neutral-800 rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0047FF]/30 via-transparent to-transparent" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <Gamepad2 className="w-12 h-12 mx-auto text-[#0047FF]" strokeWidth={1.2} />
                  <div className="soa-mono text-[10px] tracking-widest text-neutral-500 mt-3">WASD · SPACE · SHIFT</div>
                  <div className="soa-display text-xl font-bold mt-1">3D + Arcade modes</div>
                </div>
              </div>
              <span className="absolute top-3 left-3 soa-mono text-[10px] tracking-widest text-neutral-400">MISSION · GATE COURSE 01</span>
              <span className="absolute bottom-3 left-3 soa-mono text-[10px] tracking-widest text-[#00C759]">PSYCHOMOTOR · FEEDS PROFILE</span>
            </div>
          </motion.div>
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
