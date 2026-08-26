"use client";

import { useState, useEffect, useCallback } from "react";

type CommentUser = { id: string; name: string | null; email: string | null };
type CommentItem = {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  body: string;
  isApproved: boolean;
  createdAt: string;
  user: CommentUser;
  parent?: { id: string; body: string } | null;
};

type Props = { dict: Record<string, string> };

export default function CommentManager({ dict }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "20" });
    if (status) params.set("status", status);
    if (targetType) params.set("targetType", targetType);
    try {
      const res = await fetch(`/api/admin/comments?${params}`);
      const json = await res.json();
      if (json.ok) {
        setComments(json.data.items);
        setTotal(json.data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, status, targetType]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const approve = async (id: string) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true }),
    });
    fetchComments();
  };

  const reject = async (id: string) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: false }),
    });
    fetchComments();
  };

  const remove = async (id: string) => {
    if (!confirm(dict.deleteConfirm || "Delete?")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    fetchComments();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[22px] font-[1000] text-[var(--text)]">{dict.title}</h1>
        <span className="text-[13px] font-[850] text-[var(--muted)]">{total} {dict.total}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[13px] font-[850] text-[var(--text)]"
        >
          <option value="">{dict.allStatuses}</option>
          <option value="pending">{dict.pending}</option>
          <option value="approved">{dict.approved}</option>
        </select>
        <select
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[13px] font-[850] text-[var(--text)]"
        >
          <option value="">{dict.allTypes}</option>
          <option value="PRODUCT">{dict.product}</option>
          <option value="ARTICLE">{dict.article}</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[13px] font-[800] text-[var(--muted)]">...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-[14px] font-[800] text-[var(--muted)]">{dict.empty}</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className={`bg-[var(--surface)] border rounded-[16px] p-4 ${c.isApproved ? "border-green-200" : "border-amber-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-[950] text-[var(--text)]">{c.user.name || c.user.email}</span>
                    <span className={`text-[10.5px] font-[900] px-2 py-0.5 rounded-full ${
                      c.isApproved ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {c.isApproved ? dict.approved : dict.pending}
                    </span>
                    <span className="text-[11px] font-[800] text-[var(--muted-4)]">
                      {c.targetType} • {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {c.parent && (
                    <p className="mt-1 text-[11px] font-[800] text-[var(--muted)] truncate">
                      {dict.replyTo}: {c.parent.body}
                    </p>
                  )}
                  <p className="mt-2 text-[13.5px] leading-[1.8] font-[800] text-[var(--text-2)] whitespace-pre-line">{c.body}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!c.isApproved && (
                    <button onClick={() => approve(c.id)} className="px-3 py-1.5 rounded-[10px] bg-green-500 text-white text-[11.5px] font-[950] hover:bg-green-600 transition">
                      {dict.approve}
                    </button>
                  )}
                  {c.isApproved && (
                    <button onClick={() => reject(c.id)} className="px-3 py-1.5 rounded-[10px] bg-amber-500 text-white text-[11.5px] font-[950] hover:bg-amber-600 transition">
                      {dict.reject}
                    </button>
                  )}
                  <button onClick={() => remove(c.id)} className="px-3 py-1.5 rounded-[10px] bg-red-500 text-white text-[11.5px] font-[950] hover:bg-red-600 transition">
                    {dict.delete}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-[10px] text-[12px] font-[900] transition ${
                p === page ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--soft)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
