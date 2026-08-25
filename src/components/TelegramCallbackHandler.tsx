"use client";

import { useEffect } from "react";

export default function TelegramCallbackHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#tgAuthResult=")) return;

    const data = hash.slice("#tgAuthResult=".length);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    try {
      const decoded = JSON.parse(atob(data));
      fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decoded),
      }).then(async (res) => {
        const json = await res.json();
        if (json.ok) {
          window.location.href = "/";
        }
      });
    } catch {
      // invalid data, ignore
    }
  }, []);

  return null;
}
