"use client";

import Link from "next/link";
import { useEffect } from "react";

export type LoginPopupDict = {
  title: string;
  body: string;
  login: string;
  cancel: string;
};

export default function LoginRequiredModal({
  open,
  onClose,
  loginHref,
  dict,
}: {
  open: boolean;
  onClose: () => void;
  loginHref: string;
  dict: LoginPopupDict;
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
      aria-label={dict.title}
    >
      <div
        className="w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_28px_70px_rgba(10,25,60,0.30)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-14 h-14 rounded-full bg-[var(--soft)] flex items-center justify-center text-[26px]">
          🔒
        </div>
        <h3 className="mt-4 text-[17px] font-[1000] text-[var(--text)]">{dict.title}</h3>
        <p className="mt-2 text-[13.5px] font-[800] leading-[1.9] text-[var(--muted)]">{dict.body}</p>
        <div className="mt-5 flex items-center gap-2">
          <Link
            href={loginHref}
            className="flex-1 rounded-[14px] bg-[var(--primary)] px-4 py-3 text-[13.5px] font-[950] text-white transition-all hover:brightness-110"
          >
            {dict.login}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] border border-[var(--line-2)] bg-[var(--surface-2)] px-4 py-3 text-[13.5px] font-[950] text-[var(--text-2)] transition-colors hover:bg-[var(--soft)]"
          >
            {dict.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
