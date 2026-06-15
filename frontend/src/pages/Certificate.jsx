import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Award, Printer, ArrowRight } from "lucide-react";

export default function Certificate() {
  const { trackId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/certificates/${trackId}`)
      .then(({ data }) => setData(data))
      .catch((e) => setError(e.response?.data?.detail || "Could not load certificate"));
  }, [trackId]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="soa-card p-8 text-center">
          <div className="soa-mono text-[11px] tracking-widest text-[#FF3B30]">SIGN IN REQUIRED</div>
          <h1 className="soa-display text-3xl font-black mt-2">Certificates need an account</h1>
          <Link to="/login" className="soa-btn-primary mt-5 inline-flex">Sign in</Link>
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-12 soa-mono text-sm">LOADING…</div>;

  if (!data.eligible) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="soa-card p-8 text-center">
          <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))]">NOT YET</div>
          <h1 className="soa-display text-3xl font-black mt-2">Finish the track first</h1>
          <p className="text-[rgb(var(--soa-ink-2))] mt-2">
            Completed {data.completedCount}/{data.totalCount} lessons in <strong>{data.track.title}</strong>.
          </p>
          <Link to={`/tracks/${data.track.id}`} className="soa-btn-primary mt-5 inline-flex">
            Continue track <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const date = data.awarded_at ? new Date(data.awarded_at) : new Date();
  const fmt = date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">CERTIFICATE · OF COMPLETION</div>
          <h1 className="soa-display text-3xl md:text-4xl font-black tracking-tight mt-1">{data.track.title}</h1>
        </div>
        <button onClick={() => window.print()} data-testid="cert-print-button" className="soa-btn-primary">
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="mt-8 soa-card p-12 md:p-16 relative" id="cert-page" data-testid="certificate-card">
        {/* Engraved corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#0047FF]" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#0047FF]" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#0047FF]" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#0047FF]" />

        <div className="text-center">
          <Award className="w-12 h-12 mx-auto text-[#0047FF]" strokeWidth={1.2} />
          <div className="soa-mono text-[10px] tracking-[0.3em] uppercase text-[rgb(var(--soa-ink-3))] mt-4">
            Science of Autonomy · Certificate of Completion
          </div>
          <div className="soa-display text-2xl md:text-3xl mt-10 font-light text-[rgb(var(--soa-ink-2))]">
            This certifies that
          </div>
          <div className="soa-display text-5xl md:text-7xl font-black tracking-tighter mt-3" data-testid="cert-user-name">
            {data.user_name}
          </div>
          <div className="soa-display text-xl mt-8 font-light text-[rgb(var(--soa-ink-2))]">
            has completed the track
          </div>
          <div className="soa-display text-3xl md:text-4xl font-bold mt-3 text-[#0047FF]" data-testid="cert-track-title">
            {data.track.title}
          </div>
          <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-3 max-w-xl mx-auto">{data.track.summary}</p>

          <div className="border-t border-[rgb(var(--soa-line))] mt-12 pt-6 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div>
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">AWARDED</div>
              <div className="soa-display font-bold mt-1">{fmt}</div>
            </div>
            <div>
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">CERTIFICATE ID</div>
              <div className="soa-mono text-sm font-bold mt-1">{data.cert_id}</div>
            </div>
            <div>
              <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">VERIFY AT</div>
              <div className="soa-mono text-sm mt-1">scienceofautonomy.app</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
