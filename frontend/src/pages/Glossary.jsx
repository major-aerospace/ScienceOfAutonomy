import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

export default function Glossary() {
  const [q, setQ] = useState("");
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => {
      api.get(`/glossary${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(({ data }) => setTerms(data.terms || []));
    }, 120);
    return () => clearTimeout(id);
  }, [q]);

  const categories = Array.from(new Set(terms.map((t) => t.category)));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">REFERENCE</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Glossary</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-xl">
        {terms.length === 0 && q ? "Nothing matched." : "Terms used across the curriculum — vendor-neutral and present-day."}
      </p>

      <div className="relative mt-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--soa-ink-3))]" />
        <input
          data-testid="glossary-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms or definitions…"
          className="soa-input pl-10"
        />
      </div>

      <div className="mt-10 space-y-10">
        {categories.map((cat) => (
          <section key={cat}>
            <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">{cat.toUpperCase()}</div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              {terms.filter((t) => t.category === cat).map((t) => (
                <div key={t.term} data-testid={`glossary-term-${t.term}`} className="soa-card p-4">
                  <div className="soa-display text-lg font-bold">{t.term}</div>
                  <div className="text-sm text-[rgb(var(--soa-ink-2))] mt-1 leading-relaxed">{t.def}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
