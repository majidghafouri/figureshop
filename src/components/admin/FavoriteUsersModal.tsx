"use client";

import { useEffect } from "react";

export type FavoriteUsersDict = {
  favorites: string;
  noFavorites: string;
  favoritesList: string;
  close: string;
};

type FavoriteUser = {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  createdAt: string | Date;
};

export default function FavoriteUsersModal({
  open,
  onClose,
  users,
  dict,
}: {
  open: boolean;
  onClose: () => void;
  users: FavoriteUser[];
  dict: FavoriteUsersDict;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[3px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={dict.favoritesList}
    >
      <div
        className="relative w-full max-w-md rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_28px_70px_rgba(10,25,60,0.30)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.close}
          className="absolute top-4 ltr:right-4 rtl:left-4 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-[16px] font-[1000] text-[var(--text)] flex items-center gap-2">
          <span>💜</span>
          {dict.favoritesList}
          <span className="text-[var(--muted)] font-[850]">({users.length})</span>
        </h3>

        <div className="mt-4 max-h-[320px] overflow-y-auto rounded-[16px] border border-[var(--line-2)]">
          {users.length === 0 ? (
            <div className="p-6 text-center text-[13px] font-[850] text-[var(--muted)]">{dict.noFavorites}</div>
          ) : (
            <ul className="divide-y divide-[var(--surface-3)]">
              {users.map((fav, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--soft)] flex items-center justify-center text-[13px] font-[950] text-[var(--primary)] shrink-0">
                    {(fav.user.name || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-[950] text-[var(--text)] truncate">{fav.user.name || "\u2014"}</p>
                    <p className="text-[11px] font-[850] text-[var(--muted)] truncate" dir="ltr">
                      {fav.user.email || fav.user.phone || "\u2014"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] border border-[var(--line-2)] bg-[var(--surface-2)] px-5 py-2.5 text-[13px] font-[950] text-[var(--text-2)] transition-colors hover:bg-[var(--soft)]"
          >
            {dict.close}
          </button>
        </div>
      </div>
    </div>
  );
}
