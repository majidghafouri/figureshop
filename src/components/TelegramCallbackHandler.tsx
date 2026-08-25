"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TelegramCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#tgAuthResult=")) return;

    const data = hash.slice("#tgAuthResult=".length);
    window.location.hash = "";

    try {
      const decoded = JSON.parse(atob(data));
      fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decoded),
      }).then(async (res) => {
        const json = await res.json();
        if (json.ok) {
          router.push("/");
          router.refresh();
        }
      });
    } catch {
      // invalid data, ignore
    }
  }, [router]);

  return null;
}
