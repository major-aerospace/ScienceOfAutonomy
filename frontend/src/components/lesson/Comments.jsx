import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

export default function Comments({ lessonId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get(`/lessons/${lessonId}/comments`).then(({ data }) => setComments(data.comments || []));
  };
  useEffect(() => { load(); }, [lessonId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!user) { toast.error("Sign in to comment"); return; }
    setBusy(true);
    try {
      await api.post(`/lessons/${lessonId}/comments`, { body: body.trim() });
      setBody("");
      load();
    } catch {
      toast.error("Could not post");
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-8" data-testid="comments-section">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#0047FF]" />
        <h3 className="soa-display text-lg font-bold">Discussion · {comments.length}</h3>
      </div>

      <form onSubmit={submit} className="mt-3 soa-card p-3 flex gap-2 items-start">
        <textarea
          data-testid="comment-input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={user ? "Add to the conversation…" : "Sign in to comment."}
          disabled={!user}
          rows={2}
          className="flex-1 outline-none resize-none bg-transparent text-sm"
        />
        <button data-testid="comment-submit" disabled={!user || busy || !body.trim()} className="soa-btn-primary self-end">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {comments.length === 0 ? (
          <div className="soa-mono text-[11px] tracking-widest text-[rgb(var(--soa-ink-3))] py-4 text-center">
            BE THE FIRST TO COMMENT.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} data-testid={`comment-${c.id}`} className="soa-card p-3">
              <div className="flex items-center justify-between">
                <div className="soa-display font-bold text-sm">{c.user_name}</div>
                <div className="soa-mono text-[10px] tracking-widest text-[rgb(var(--soa-ink-3))]">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-[rgb(var(--soa-ink))] mt-1 whitespace-pre-wrap">{c.body}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
