"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleProductStatusButton({
  id,
  isDeactivated,
  dict,
}: {
  id: string;
  isDeactivated: boolean;
  dict: { activate: string; deactivate: string; busy: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDeactivated: !isDeactivated }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`text-[12px] font-[950] hover:underline disabled:opacity-50 ${
        isDeactivated ? "text-[var(--success)]" : "text-[var(--warning-strong)]"
      }`}
    >
      {busy ? dict.busy : isDeactivated ? dict.activate : dict.deactivate}
    </button>
  );
}