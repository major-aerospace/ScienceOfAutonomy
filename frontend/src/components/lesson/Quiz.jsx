import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { TID } from "@/lib/tids";

export default function Quiz({ questions, onPass }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!questions || questions.length === 0) return null;

  const done = idx >= questions.length;
  if (done) {
    const pct = correctCount / questions.length;
    return (
      <div className="bg-white border-[1.5px] border-[#0047FF] rounded-sm p-6">
        <div className="soa-tick text-[rgb(var(--soa-ink-3))]">QUIZ · COMPLETE</div>
        <h4 className="soa-display text-2xl font-black mt-1">
          {correctCount} / {questions.length} correct
        </h4>
        <p className="text-sm text-[rgb(var(--soa-ink-2))] mt-2">
          {pct >= 0.7 ? "Strong understanding. You've earned the lesson." : "Worth another pass — try the visual again."}
        </p>
        <button
          data-testid={TID.lessonComplete}
          onClick={() => onPass?.(pct)}
          className="soa-btn-primary mt-4"
        >
          Complete lesson · +{Math.round(25 + pct * 15)} XP
        </button>
      </div>
    );
  }

  const q = questions[idx];

  const submit = () => {
    if (picked == null) return;
    setSubmitted(true);
    if (picked === q.answer) setCorrectCount((c) => c + 1);
  };
  const advance = () => {
    setSubmitted(false); setPicked(null); setIdx((i) => i + 1);
  };

  return (
    <div className="bg-white border-[1.5px] border-[rgb(var(--soa-line))] rounded-sm p-6">
      <div className="flex items-center justify-between">
        <div className="soa-tick text-[rgb(var(--soa-ink-3))]">CHECK · {idx + 1} / {questions.length}</div>
        <div className="soa-mono text-[11px] text-[rgb(var(--soa-ink-3))]">MCQ</div>
      </div>
      <h4 className="soa-display text-lg font-bold mt-2">{q.prompt}</h4>
      <div className="space-y-2 mt-4">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.answer;
          const showState = submitted && (isPicked || isCorrect);
          const border = !submitted
            ? isPicked ? "border-[#0047FF]" : "border-[rgb(var(--soa-line))] hover:border-[rgb(var(--soa-ink))]"
            : isCorrect ? "border-[#00C759]" : isPicked ? "border-[#FF3B30]" : "border-[rgb(var(--soa-line))]";
          return (
            <button
              key={i}
              data-testid={TID.quizOption(i)}
              disabled={submitted}
              onClick={() => setPicked(i)}
              className={`w-full text-left p-3 rounded-sm border-[1.5px] transition-colors ${border} bg-white`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{opt}</span>
                {showState && (isCorrect
                  ? <CheckCircle2 className="w-5 h-5 text-[#00C759]" strokeWidth={1.6} />
                  : isPicked ? <XCircle className="w-5 h-5 text-[#FF3B30]" strokeWidth={1.6} /> : null)}
              </div>
            </button>
          );
        })}
      </div>
      {submitted && (
        <div data-testid={TID.quizFeedback} className="mt-3 bg-[#FAFAFA] border-[1.5px] border-[rgb(var(--soa-line))] p-3 rounded-sm">
          <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">EXPLANATION</div>
          <div className="text-sm text-[rgb(var(--soa-ink))] mt-1">{q.explanation}</div>
        </div>
      )}
      <div className="flex justify-end mt-4">
        {!submitted ? (
          <button data-testid={TID.quizSubmit} disabled={picked == null} onClick={submit} className="soa-btn-primary">Check</button>
        ) : (
          <button onClick={advance} className="soa-btn-primary">{idx === questions.length - 1 ? "See results" : "Next question"}</button>
        )}
      </div>
    </div>
  );
}
