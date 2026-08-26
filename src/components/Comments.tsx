"use client";

import { useState, useEffect, useCallback } from "react";

type CommentUser = { id: string; name: string | null; email: string | null };
type CommentItem = {
  id: string;
  userId: string;
  body: string;
  isApproved: boolean;
  createdAt: string;
  user: CommentUser;
  replies: CommentItem[];
  parentId?: string | null;
};

type Props = {
  targetType: "PRODUCT" | "ARTICLE";
  targetId: string;
  isLoggedIn: boolean;
  userId?: string;
  dict: {
    title: string;
    write: string;
    submit: string;
    reply: string;
    replyTo: string;
    pending: string;
    loginRequired: string;
    maxLength: string;
    submitted: string;
    error: string;
    noComments: string;
    replies: string;
    cancel: string;
    dailyLimit: string;
    alreadyCommented: string;
    purchaseRequired: string;
    maxReplies: string;
  };
};

export default function Comments({ targetType, targetId, isLoggedIn, userId, dict }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
      const json = await res.json();
      if (json.ok) setComments(json.data.items);
    } catch { /* ignore */ }
    setLoading(false);
  }, [targetType, targetId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (parentId?: string) => {
    if (!isLoggedIn) {
      setMessage({ type: "err", text: dict.loginRequired });
      return;
    }
    const text = parentId ? replyBody : body;
    if (!text.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, parentId, body: text }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: "ok", text: dict.submitted });
        setBody("");
        setReplyBody("");
        setReplyTo(null);
        fetchComments();
      } else {
        setMessage({ type: "err", text: json.error || dict.error });
      }
    } catch {
      setMessage({ type: "err", text: dict.error });
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-10 border-t border-[var(--line-4)] pt-8">
      <h2 className="text-[clamp(18px,2vw,22px)] font-[1000] text-[var(--text)] mb-6">
        {dict.title} ({comments.length})
      </h2>

      {/* Comment Form */}
      {isLoggedIn ? (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5 mb-8">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={dict.write}
            className="w-full px-4 py-3 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13.5px] font-[850] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-[800] text-[var(--muted-4)]">{body.length}/1000</span>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || !body.trim()}
              className="px-5 py-2.5 rounded-[12px] text-white text-[13px] font-[950] shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
              style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
            >
              {submitting ? "..." : dict.submit}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5 mb-8 text-center">
          <p className="text-[13.5px] font-[850] text-[var(--muted)]">{dict.loginRequired}</p>
        </div>
      )}

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-[12px] text-[13px] font-[850] ${
          message.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 text-[13px] font-[800] text-[var(--muted)]">...</div>
      ) : comments.length === 0 ? (
        <p className="text-center py-8 text-[14px] font-[800] text-[var(--muted)]">{dict.noComments}</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--soft)] flex items-center justify-center text-[14px] font-[1000] text-[var(--primary)]">
                  {(c.user.name || c.user.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-[13.5px] font-[950] text-[var(--text)]">{c.user.name || c.user.email || "User"}</span>
                  <span className="text-[11px] font-[800] text-[var(--muted-4)] ms-2">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-[1.9] font-[750] text-[var(--text-2)] whitespace-pre-line">{c.body}</p>

              {/* Replies */}
              {c.replies.length > 0 && (
                <div className="mt-4 ms-6 space-y-3 border-s-2 border-[var(--line-4)] ps-4">
                  <span className="text-[11px] font-[900] text-[var(--muted)]">{dict.replies} ({c.replies.length})</span>
                  {c.replies.map((r) => (
                    <div key={r.id} className="bg-[var(--bg)] border border-[var(--soft-line)] rounded-[12px] p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--soft)] flex items-center justify-center text-[11px] font-[1000] text-[var(--primary)]">
                          {(r.user.name || r.user.email || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-[12.5px] font-[950] text-[var(--text)]">{r.user.name || r.user.email || "User"}</span>
                        <span className="text-[10.5px] font-[800] text-[var(--muted-4)]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-[1.8] font-[750] text-[var(--text-2)] whitespace-pre-line">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply button / form */}
              {isLoggedIn && userId === c.userId && !c.parentId && c.replies.length < 5 && (
                <div className="mt-3">
                  {replyTo === c.id ? (
                    <div className="ms-6">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        maxLength={1000}
                        rows={2}
                        placeholder={`${dict.replyTo} ${c.user.name || "User"}...`}
                        className="w-full px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[12.5px] font-[850] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleSubmit(c.id)}
                          disabled={submitting || !replyBody.trim()}
                          className="px-4 py-1.5 rounded-[10px] text-white text-[12px] font-[950] disabled:opacity-50"
                          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
                        >
                          {submitting ? "..." : dict.submit}
                        </button>
                        <button
                          onClick={() => { setReplyTo(null); setReplyBody(""); }}
                          className="px-4 py-1.5 rounded-[10px] text-[var(--muted)] text-[12px] font-[900] hover:text-[var(--text)] transition-colors"
                        >
                          {dict.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyTo(c.id)}
                      className="ms-6 text-[12px] font-[900] text-[var(--primary)] hover:underline"
                    >
                      {dict.reply}
                    </button>
                  )}
                </div>
              )}
              {isLoggedIn && userId === c.userId && c.replies.length >= 5 && !c.parentId && (
                <p className="mt-3 ms-6 text-[11px] font-[800] text-[var(--muted-4)]">{dict.maxReplies}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
