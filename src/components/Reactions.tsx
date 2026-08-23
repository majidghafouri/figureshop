"use client";

import { useEffect, useState } from "react";

export type ReactionKind = "like" | "love" | "haha" | "wow" | "sad" | "fire";

const KIND_EMOJI: Record<ReactionKind, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  fire: "🔥",
};

type ReactionDict = Record<ReactionKind, string> & { title: string };

type Summary = { counts: Record<string, number>; total: number; mine: string | null };

export default function Reactions({
  targetType,
  targetId,
  dict,
}: {
  targetType: "PRODUCT" | "ARTICLE";
  targetId: string;
  dict: ReactionDict;
}) {
  const kinds: ReactionKind[] = ["like", "love", "haha", "wow", "sad", "fire"];
  const [summary, setSummary] = useState<Summary>({ counts: {}, total: 0, mine: null });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<ReactionKind | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/reactions?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!alive || !body?.data) return;
        setSummary({
          counts: body.data.counts ?? {},
          total: body.data.total ?? 0,
          mine: body.data.mine ?? null,
        });
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [targetType, targetId]);

  const react = async (kind: ReactionKind) => {
    if (busy) return;
    setBusy(kind);
    // optimistic toggle
    const prev = summary;
    const wasMine = prev.mine === kind;
    const nextCounts = { ...prev.counts };
    if (prev.mine) nextCounts[prev.mine] = Math.max(0, (nextCounts[prev.mine] ?? 1) - 1);
    if (!wasMine) nextCounts[kind] = (nextCounts[kind] ?? 0) + 1;
    setSummary({ counts: nextCounts, total: Math.max(0, prev.total + (wasMine ? -1 : prev.mine ? 0 : 1)), mine: wasMine ? null : kind });

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, kind }),
      });
      if (!res.ok) throw new Error("failed");
      const body = await res.json();
      if (body?.data) {
        setSummary({
          counts: body.data.counts ?? {},
          total: body.data.total ?? 0,
          mine: body.data.mine ?? null,
        });
      }
    } catch {
      setSummary(prev); // revert on failure
    } finally {
      setBusy(null);
    }
  };

  if (!loaded && summary.total === 0) {
    return <div className="h-[46px]" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[12.5px] font-[900] text-[var(--muted)]">{dict.title}</span>
      <div
        className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1"
        role="group"
        aria-label={dict.title}
      >
        {kinds.map((kind) => {
          const active = summary.mine === kind;
          const count = summary.counts[kind] ?? 0;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => react(kind)}
              disabled={!!busy}
              aria-pressed={active}
              title={dict[kind]}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-[950] transition-all disabled:opacity-60 ${
                active
                  ? "bg-[var(--soft)] text-[var(--primary)] ring-2 ring-[var(--primary)]/25"
                  : "text-[var(--text-2)] hover:bg-[var(--soft)]"
              }`}
            >
              <span className="text-[15px] leading-none">{KIND_EMOJI[kind]}</span>
              {count > 0 && (
                <span className={active ? "text-[var(--primary)]" : "text-[var(--muted)]"} dir="ltr">
                  {count.toLocaleString("en-US")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
