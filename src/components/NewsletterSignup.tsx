"use client";

import { useState } from "react";

type NewsletterDict = {
  title: string;
  subtitle: string;
  placeholder: string;
  button: string;
  busy: string;
  success: string;
  successNewEmail: string;
  already: string;
  loggedInAs: string;
  useRegisteredHint: string;
  errorInvalid: string;
  errorGeneric: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewsletterSignup({
  dict,
  locale,
  userEmail,
}: {
  dict: NewsletterDict;
  locale: string;
  userEmail: string | null;
}) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "registered" | "other" | "already">(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError(dict.errorInvalid);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, locale }),
      });
      if (!res.ok) throw new Error("failed");
      const body = await res.json();
      if (body?.data?.already) {
        setDone("already");
        return;
      }
      const isRegistered = !!userEmail && value === userEmail.toLowerCase();
      setDone(isRegistered ? "registered" : "other");
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-[20px] p-5 border border-[rgba(var(--primary-rgb),0.18)]"
      style={{
        background:
          "radial-gradient(circle at 88% 0%, rgba(var(--teal-rgb),0.14), transparent 46%), var(--surface)",
      }}
    >
      <div className="text-[16px] font-[1000] text-[var(--text)]">📬 {dict.title}</div>
      <p className="mt-1 text-[13px] font-[700] leading-[1.8] text-[var(--muted-5)]">
        {dict.subtitle}
      </p>

      {done ? (
        <p
          className={`mt-3 text-[13px] font-[900] ${
            done === "already" ? "text-[var(--warning-text)]" : "text-[var(--success)]"
          }`}
        >
          {done === "other" ? dict.successNewEmail : done === "already" ? dict.already : dict.success}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex items-stretch gap-2 max-w-[420px] max-sm:flex-col">
          <input
            type="email"
            inputMode="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dict.placeholder}
            aria-label={dict.placeholder}
            className="flex-1 min-w-[180px] bg-[var(--bg-tint)] border border-[var(--line)] rounded-[12px] px-4 py-2.5 text-[13px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-[12px] bg-[var(--primary)] px-5 py-2.5 text-[13px] font-[950] text-white transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? dict.busy : dict.button}
          </button>
        </form>
      )}

      {userEmail && !done && (
        <p className="mt-2 text-[11.5px] font-[800] text-[var(--muted-5)]">
          ✅ {dict.loggedInAs} <span dir="ltr">{userEmail}</span> — {dict.useRegisteredHint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11.5px] font-[850] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}
