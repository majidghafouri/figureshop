"use client";

import { useState } from "react";
import Link from "next/link";

type ReactionKind = "like" | "love" | "haha" | "wow" | "sad" | "fire";

const KIND_EMOJI: Record<ReactionKind, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  fire: "🔥",
};

type ReactionsDict = {
  title: string;
  subtitle: string;
  statTotal: string;
  statGuests: string;
  search: string;
  filterAll: string;
  filterArticles: string;
  filterProducts: string;
  empty: string;
  table: {
    who: string;
    reaction: string;
    target: string;
    location: string;
    date: string;
  };
  guest: string;
  article: string;
  product: string;
  noAccount: string;
};

export type ReactionRow = {
  id: string;
  targetType: "ARTICLE" | "PRODUCT";
  targetId: string;
  targetSlug: string | null;
  targetTitle: string;
  kind: string;
  createdAt: string;
  visitor: {
    uid: string;
    ip: string | null;
    location: string | null;
    userAgent: string | null;
    user: { id: string; name: string | null; email: string | null } | null;
  };
};

export default function ReactionsManager({
  dict,
  kindDict,
  rows,
}: {
  dict: ReactionsDict;
  kindDict: Record<ReactionKind, string> & { title: string };
  rows: ReactionRow[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ARTICLE" | "PRODUCT">("all");

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.targetTitle.toLowerCase().includes(q) ||
      (r.visitor.user?.name ?? "").toLowerCase().includes(q) ||
      (r.visitor.user?.email ?? "").toLowerCase().includes(q) ||
      (r.visitor.ip ?? "").includes(q) ||
      (r.visitor.location ?? "").toLowerCase().includes(q);
    const matchesFilter = filter === "all" || r.targetType === filter;
    return matchesSearch && matchesFilter;
  });

  const guests = rows.filter((r) => !r.visitor.user).length;
  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" });
  const shortUid = (uid: string) => uid.slice(0, 8);

  return (
    <div>
      <p className="mt-1 text-[12.5px] font-[850] text-[var(--muted)]">{dict.subtitle}</p>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 max-w-xl">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">🧡</span>
            <span className="text-[12px] font-[850] text-[var(--muted)]">{dict.statTotal}</span>
          </div>
          <p className="mt-1.5 text-[22px] font-[1000] text-[var(--text)]" dir="ltr">
            {rows.length.toLocaleString("en-US")}
          </p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">🕵️</span>
            <span className="text-[12px] font-[850] text-[var(--muted)]">{dict.statGuests}</span>
          </div>
          <p className="mt-1.5 text-[22px] font-[1000] text-[var(--text)]" dir="ltr">
            {guests.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.search}
          className="flex-1 min-w-[200px] border border-[var(--line-2)] rounded-[12px] px-4 py-2.5 text-[13px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
        />
        <div className="flex items-center gap-1.5">
          {(["all", "ARTICLE", "PRODUCT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-[10px] text-[12px] font-[900] transition-colors ${
                filter === f
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface)] border border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--soft)]"
              }`}
            >
              {f === "all" ? dict.filterAll : f === "ARTICLE" ? dict.filterArticles : dict.filterProducts}
            </button>
          ))}
        </div>
        <span className="text-[12px] font-[850] text-[var(--muted)]">
          {filtered.length} / {rows.length}
        </span>
      </div>

      {/* Table */}
      <div className="mt-4 bg-[var(--surface)] border border-[var(--line)] rounded-[18px] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-[13.5px] font-[850] text-[var(--muted)]">{dict.empty}</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="px-4 py-3 text-[11.5px] font-[950] text-[var(--muted)] uppercase tracking-wide">{dict.table.who}</th>
                  <th className="px-4 py-3 text-[11.5px] font-[950] text-[var(--muted)] uppercase tracking-wide">{dict.table.reaction}</th>
                  <th className="px-4 py-3 text-[11.5px] font-[950] text-[var(--muted)] uppercase tracking-wide">{dict.table.target}</th>
                  <th className="px-4 py-3 text-[11.5px] font-[950] text-[var(--muted)] uppercase tracking-wide">{dict.table.location}</th>
                  <th className="px-4 py-3 text-[11.5px] font-[950] text-[var(--muted)] uppercase tracking-wide">{dict.table.date}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--soft)] transition-colors">
                    <td className="px-4 py-3">
                      {r.visitor.user ? (
                        <span className="flex flex-col">
                          <span className="text-[12.5px] font-[900] text-[var(--text)]">
                            👤 {r.visitor.user.name || dict.noAccount}
                          </span>
                          {r.visitor.user.email && (
                            <span className="text-[11px] font-[800] text-[var(--muted)]" dir="ltr">
                              {r.visitor.user.email}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="flex flex-col">
                          <span className="text-[12.5px] font-[900] text-[var(--text-2)]">🕵️ {dict.guest}</span>
                          <span className="text-[11px] font-[800] text-[var(--muted)]" dir="ltr">
                            uid:{shortUid(r.visitor.uid)}{r.visitor.ip ? ` · ${r.visitor.ip}` : ""}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-[var(--soft)] border border-[var(--line-4)] rounded-full px-2.5 py-0.5 text-[12px] font-[950] text-[var(--text-2)]">
                        {KIND_EMOJI[r.kind as ReactionKind] ?? "✨"}{" "}
                        {kindDict[r.kind as ReactionKind] ?? r.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-col max-w-[260px]">
                        <span className="text-[11px] font-[950] text-[var(--muted)]">
                          {r.targetType === "ARTICLE" ? `📰 ${dict.article}` : `🧸 ${dict.product}`}
                        </span>
                        {r.targetSlug ? (
                          <Link
                            href={r.targetType === "ARTICLE" ? `/blog/${r.targetSlug}` : `/products/${r.targetSlug}`}
                            className="text-[12.5px] font-[900] text-[var(--primary)] hover:underline line-clamp-1"
                          >
                            {r.targetTitle}
                          </Link>
                        ) : (
                          <span className="text-[12.5px] font-[900] text-[var(--text-2)] line-clamp-1">{r.targetTitle}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-[850] text-[var(--muted)]" dir="ltr">
                      {r.visitor.location || "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-[850] text-[var(--muted)] whitespace-nowrap" dir="ltr">
                      {fmt(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
