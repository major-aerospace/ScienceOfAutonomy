export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[rgb(var(--soa-line))] bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="soa-display text-xl font-black tracking-tight">SCIENCE OF AUTONOMY</div>
          <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2 max-w-sm">
            A vendor-neutral, visual-first learning platform for the science of unmanned and autonomous systems.
          </p>
        </div>
        <div>
          <div className="soa-label">Curriculum</div>
          <ul className="mt-3 space-y-1 soa-mono text-xs text-[rgb(var(--soa-ink-2))]">
            <li>10 tracks · principles → components → applications</li>
            <li>Interactive 3D, graphs & diagrams</li>
            <li>Adaptive paths via Dronability profile</li>
          </ul>
        </div>
        <div>
          <div className="soa-label">Principles</div>
          <ul className="mt-3 space-y-1 soa-mono text-xs text-[rgb(var(--soa-ink-2))]">
            <li>· Vendor-neutral content</li>
            <li>· Visual-first pedagogy</li>
            <li>· Open standards & techniques</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--soa-line))] py-4 text-center soa-mono text-[10px] tracking-widest uppercase text-[rgb(var(--soa-ink-3))]">
        © {new Date().getFullYear()} Science of Autonomy · For learning, not endorsement
      </div>
    </footer>
  );
}
