export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center">
      <div className="soa-mono text-xs tracking-widest text-[rgb(var(--soa-ink-3))]">ERROR · 404</div>
      <h1 className="soa-display text-5xl font-black tracking-tight mt-3">SIGNAL LOST</h1>
      <p className="mt-4 text-[rgb(var(--soa-ink-2))]">That page is out of range. Return to base.</p>
      <a href="/" className="soa-btn-primary mt-6 inline-flex">Return home</a>
    </div>
  );
}
