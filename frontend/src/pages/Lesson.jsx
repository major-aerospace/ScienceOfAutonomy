import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";
import LessonBlock from "@/components/lesson/LessonBlock";
import Quiz from "@/components/lesson/Quiz";
import Comments from "@/components/lesson/Comments";
import TierSelector, { useTier } from "@/components/TierSelector";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Share2, Baby, GraduationCap } from "lucide-react";

export default function Lesson() {
  const { lessonId } = useParams();
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [lesson, setLesson] = useState(null);
  const tier = useTier();

  useEffect(() => {
    setLesson(null);
    api.get(`/lessons/${lessonId}`).then(({ data }) => setLesson(data)).catch(() => {});
  }, [lessonId]);

  const complete = async (score) => {
    if (!user || user === false) {
      toast("Sign in to save progress and earn XP.", { description: "You can still browse as a guest." });
      if (lesson?.nextLessonId) nav(`/lessons/${lesson.nextLessonId}`);
      return;
    }
    try {
      const { data } = await api.post("/progress/complete", { lesson_id: lessonId, score });
      if (data?.xpAwarded) toast.success(`+${data.xpAwarded} XP earned`);
      if (data?.newBadges?.length) {
        data.newBadges.forEach((b) => toast.success(`Badge unlocked: ${b.replace(/-/g, " ")}`, { duration: 4000 }));
      }
      await refresh();
      if (lesson?.nextLessonId) nav(`/lessons/${lesson.nextLessonId}`);
      else nav(`/tracks/${lesson.trackId}`);
    } catch (e) {
      toast.error("Could not save progress");
    }
  };

  if (!lesson) return <div className="p-12 soa-mono text-sm">LOADING LESSON…</div>;

  // Use the reactive tier hook so the page updates immediately when the selector changes
  // (including for guests, where the change is stored in localStorage + emitted as an event).
  const blocks = (lesson.blocks || []).filter((b) => !(tier === "eli12" && b.type === "deepdive"));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link to={`/tracks/${lesson.trackId}`} className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))] hover:text-[rgb(var(--soa-ink))] inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> BACK TO TRACK
      </Link>
      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="soa-chip soa-chip-primary">LESSON · {String(lesson.order).padStart(2, "0")}</span>
          <span className="soa-chip">{lesson.estMinutes} MIN</span>
        </div>
        <TierSelector inline />
      </div>
      <h1 data-testid={TID.lessonTitle} className="soa-display text-3xl md:text-5xl font-black tracking-tighter mt-3 leading-[1]">{lesson.title}</h1>
      <p className="text-[rgb(var(--soa-ink-2))] mt-2 max-w-2xl">{lesson.summary}</p>

      {tier === "eli12" && (
        <div className="mt-5 border-l-[3px] border-[#FFCC00] bg-[#FFCC00]/10 p-4 rounded-sm flex items-start gap-3" data-testid="eli12-banner">
          <Baby className="w-5 h-5 mt-0.5 text-[rgb(var(--soa-ink))]" strokeWidth={1.6} />
          <div>
            <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-2))]">EXPLAIN LIKE I&apos;M 12</div>
            <div className="text-sm mt-1">No equations. No jargon. Just the idea.</div>
          </div>
        </div>
      )}

      {tier === "deep" && (
        <div className="mt-5 border-l-[3px] border-[#0047FF] bg-[#0047FF]/10 p-4 rounded-sm flex items-start gap-3" data-testid="deep-banner">
          <GraduationCap className="w-5 h-5 mt-0.5 text-[rgb(var(--soa-ink))]" strokeWidth={1.6} />
          <div>
            <div className="soa-mono text-[10px] tracking-widest text-[#0047FF]">DEEP DIVE · ENGINEERING TIER</div>
            <div className="text-sm mt-1">Math, equations, and technical framing. Deep-dive sections open by default.</div>
          </div>
        </div>
      )}

      <div className="space-y-6 mt-10">
        {blocks.map((b, i) => (
          <div key={i}>
            <LessonBlock block={b} />
          </div>
        ))}

        <Quiz questions={lesson.quiz} onPass={complete} />

        {lesson.socialClip && (
          <div className="soa-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">SOCIAL · 30-60s CLIP</div>
                <div className="soa-display text-lg font-bold mt-1">{lesson.socialClip.hook}</div>
              </div>
              <Share2 className="w-4 h-4 text-[rgb(var(--soa-ink-3))]" strokeWidth={1.5} />
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div>
                <div className="soa-label">Core idea</div>
                <div className="text-sm mt-1">{lesson.socialClip.coreIdea}</div>
              </div>
              <div>
                <div className="soa-label">Visual</div>
                <div className="text-sm mt-1">{lesson.socialClip.visualSuggestion}</div>
              </div>
              <div>
                <div className="soa-label">Takeaway</div>
                <div className="text-sm mt-1">{lesson.socialClip.takeaway}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {lesson.socialClip.hashtags.map((h) => <span key={h} className="soa-chip">{h}</span>)}
            </div>
          </div>
        )}

        <Comments lessonId={lesson.id} />
      </div>

      <div className="flex items-center justify-between mt-10">
        {lesson.prevLessonId ? (
          <Link to={`/lessons/${lesson.prevLessonId}`} data-testid={TID.lessonPrev} className="soa-btn-ghost inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </Link>
        ) : <span />}
        {lesson.nextLessonId && (
          <Link to={`/lessons/${lesson.nextLessonId}`} data-testid={TID.lessonNext} className="soa-btn-secondary">
            Next lesson <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
