"use client";

import { useState } from "react";
import LoginRequiredModal, { LoginPopupDict } from "@/components/LoginRequiredModal";

export type FavoriteDict = {
  add: string;
  remove: string;
};

export default function FavoriteButton({
  productId,
  isLoggedIn,
  initialFavorited,
  initialCount,
  loginHref,
  dict,
  popupDict,
}: {
  productId: string;
  isLoggedIn: boolean;
  initialFavorited: boolean;
  initialCount: number;
  loginHref: string;
  dict: FavoriteDict;
  popupDict: LoginPopupDict;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const toggle = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    const prev = { favorited, count };
    setFavorited(!favorited);
    setCount(favorited ? Math.max(0, count - 1) : count + 1);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("failed");
      const body = await res.json();
      if (body?.data) {
        setFavorited(!!body.data.favorited);
        setCount(typeof body.data.count === "number" ? body.data.count : prev.count);
      }
    } catch {
      setFavorited(prev.favorited);
      setCount(prev.count);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={favorited}
        title={favorited ? dict.remove : dict.add}
        className={`inline-flex items-center gap-2 rounded-full border px-4 h-[46px] text-[13px] font-[950] transition-all disabled:opacity-60 ${
          favorited
            ? "border-transparent bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_8px_22px_rgba(244,63,94,0.35)]"
            : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-2)] hover:border-rose-300 hover:text-rose-500"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={favorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {count > 0 && <span dir="ltr">{count.toLocaleString("en-US")}</span>}
      </button>

      <LoginRequiredModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        loginHref={loginHref}
        dict={popupDict}
      />
    </>
  );
}
