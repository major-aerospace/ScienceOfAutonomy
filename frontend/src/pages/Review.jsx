import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ArrowRight, BookOpenCheck } from "lucide-react";
import { TID } from "@/lib/tids";

export default function Review() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/review/queue");
      setItems(data.items || []);
    } catch (e) {
      toast.error("Sign in to see your review queue.");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const answer = async (id, correct) => {
    try {
      const { data } = await api.post("/review/answer", { review_id: id, correct });
      if (data.graduated) toast.success("Graduated from review");
      else toast.success(`Next review in ${data.next_in_days} day${data.next_in_days > 1 ? "s" : ""}`);
      load();
    } catch (e) {
      toast.error("Could not record answer");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="soa-mono text-[11px] tracking-widest text-[#0047FF]">SPACED REPETITION</div>
      <h1 className="soa-display text-4xl md:text-6xl font-black tracking-tighter mt-2">Review queue</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">
        Concepts you nearly nailed. Revisit them on a growing interval — 1, 3, 7, 14, then 30 days.
      </p>

      {loading ? (
        <div className="soa-mono text-sm mt-10">LOADING…</div>
      ) : items.length === 0 ? (
        <div className="soa-card p-8 mt-10 text-center">
          <BookOpenCheck className="w-10 h-10 mx-auto text-[#00C759]" strokeWidth={1.4} />
          <div className="soa-display text-2xl font-bold mt-3">Nothing to review</div>
          <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">
            New review items appear when you miss a quiz question. Keep learning.
          </p>
          <Link to="/tracks" className="soa-btn-primary mt-5 inline-flex">Open curriculum <ArrowRight className="w-4 h-4" /></Link>
        </div>
      ) : (
        <div className="space-y-4 mt-10">
          {items.map((it) => (
            <ReviewCard key={it.id} item={it} onAnswer={answer} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ item, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const q = item.sample_question;

  const submit = () => {
    if (picked == null) return;
    setSubmitted(true);
    const correct = picked === q.answer;
    setTimeout(() => onAnswer(item.id, correct), 700);
  };

  return (
    <div className="soa-card p-5" data-testid={`review-item-${item.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">REVIEW · INTERVAL {item.ease}/5</div>
          <div className="soa-display text-xl font-bold mt-1">{item.lesson.title}</div>
        </div>
        <Link to={`/lessons/${item.lesson.id}`} className="soa-btn-ghost">Open lesson</Link>
      </div>

      {q && (
        <div className="mt-4">
          <div className="text-sm font-medium">{q.prompt}</div>
          <div className="grid gap-2 mt-3">
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              const showState = submitted && (isPicked || i === q.answer);
              const cls = !submitted
                ? isPicked ? "border-[#0047FF]" : "border-[rgb(var(--soa-line))]"
                : i === q.answer ? "border-[#00C759]" : isPicked ? "border-[#FF3B30]" : "border-[rgb(var(--soa-line))]";
              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => setPicked(i)}
                  className={`text-left p-3 border-[1.5px] ${cls} rounded-sm bg-white`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{opt}</span>
                    {showState && (i === q.answer ? <CheckCircle2 className="w-4 h-4 text-[#00C759]" /> : isPicked ? <XCircle className="w-4 h-4 text-[#FF3B30]" /> : null)}
                  </div>
                </button>
              );
            })}
          </div>
          {!submitted && (
            <div className="flex justify-end mt-3">
              <button disabled={picked == null} onClick={submit} className="soa-btn-primary">Check</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
