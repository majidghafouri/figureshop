"use client";

import { useEffect, useState } from "react";

export default function TelegramCallbackHandler() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#tgAuthResult=")) return;

    const data = hash.slice("#tgAuthResult=".length);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    let decoded: Record<string, unknown>;
    try {
      decoded = JSON.parse(atob(data));
    } catch {
      setError("Failed to decode Telegram response");
      return;
    }

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decoded),
    }).then(async (res) => {
      const json = await res.json();
      if (json.ok) {
        window.location.href = "/";
      } else {
        setError(json.error ?? "Login failed");
      }
    }).catch(() => {
      setError("Network error");
    });
  }, []);

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-6 max-w-sm text-center shadow-xl">
        <p className="text-[var(--danger)] font-[850] text-[15px] mb-3">{error}</p>
        <a href="/auth" className="text-[var(--primary)] text-[13px] font-[800] underline">
          Try again
        </a>
      </div>
    </div>
  );
}
