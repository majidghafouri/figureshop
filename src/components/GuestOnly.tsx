"use client";

import { useEffect, useState } from "react";

export default function GuestOnly({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { user?: unknown }) => {
        if (active && d?.user) setIsGuest(false);
      })
      .catch(() => {
        /* guest */
      });
    return () => {
      active = false;
    };
  }, []);

  if (!isGuest) return null;
  return <>{children}</>;
}