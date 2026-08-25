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
      const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      decoded = JSON.parse(atob(padded));
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
        const parts = [json.error ?? "Login failed"];
        if (json.keys) parts.push("Keys: " + json.keys.join(", "));
        if (json.checkString) parts.push("Check: " + json.checkString);
        if (json.expectedHash) parts.push("Expected: " + json.expectedHash);
        if (json.receivedHash) parts.push("Received: " + json.receivedHash);
        if (json.tokenLen) parts.push("TokenLen: " + json.tokenLen);
        if (json.tokenStart) parts.push("TokenStart: " + json.tokenStart);
        if (json.authDateAge !== undefined) parts.push("AuthAge: " + json.authDateAge + "s");
        setError(parts.join("\n"));
      }
    }).catch(() => {
      setError("Network error");
    });
  }, []);

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-6 max-w-sm text-center shadow-xl">
        <p className="text-[var(--danger)] font-[850] text-[15px] mb-3 whitespace-pre-wrap text-left text-[11px]">{error}</p>
        <a href="/auth" className="text-[var(--primary)] text-[13px] font-[800] underline">
          Try again
        </a>
      </div>
    </div>
  );
}
