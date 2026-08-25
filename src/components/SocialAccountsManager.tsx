"use client";

import { useEffect, useState } from "react";

type SocialDict = {
  socialAccounts: string;
  socialAccountsHint: string;
  connectGoogle: string;
  connectGithub: string;
  disconnect: string;
  connected: string;
  notConnected: string;
  cannotDisconnect: string;
  mergeConflict: string;
  mergeConflictDesc: string;
  otherProfile: string;
  currentProfile: string;
  keepCurrent: string;
  keepOther: string;
  mergeComplete: string;
  mergeFailed: string;
  linkedOk: string;
  linkedAlready: string;
  nameField: string;
  emailField: string;
  phoneField: string;
};

interface SocialAccount {
  id: string;
  provider: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

interface MergeConflict {
  socialAccountId: string;
  provider: string;
  otherName: string | null;
  otherEmail: string | null;
  otherPhone: string | null;
  otherAvatar: string | null;
}

interface UserProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
}

const PROVIDERS = [
  { key: "google", icon: "G", color: "#4285F4", bg: "#4285F415" },
  { key: "github", icon: "GH", color: "#333", bg: "#33333315" },
] as const;

export default function SocialAccountsManager({
  dict,
  accounts: initialAccounts,
  user,
}: {
  dict: SocialDict;
  accounts: SocialAccount[];
  user: UserProfile;
}) {
  const d = dict;
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "error" } | null>(null);

  const [mergeConflict, setMergeConflict] = useState<MergeConflict | null>(null);
  const [mergeChoices, setMergeChoices] = useState<Record<string, "current" | "other">>({
    name: "current",
    email: "current",
    phone: "current",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("merge") === "1") {
      setMergeConflict({
        socialAccountId: params.get("socialAccountId") || "",
        provider: params.get("provider") || "",
        otherName: params.get("otherName"),
        otherEmail: params.get("otherEmail"),
        otherPhone: params.get("otherPhone"),
        otherAvatar: params.get("otherAvatar"),
      });
      setMergeChoices({
        name: user.name ? "current" : "other",
        email: user.email ? "current" : "other",
        phone: user.phone ? "current" : "other",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("linked")) {
      const key = params.get("linked") === "ok" ? "linkedOk" : "linkedAlready";
      setMsg({ text: d[key], kind: "ok" });
      window.history.replaceState({}, "", window.location.pathname);
      fetchAccounts();
    }
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/account/social");
    if (res.ok) {
      const json = await res.json();
      setAccounts(json.data?.accounts ?? json.accounts ?? []);
    }
  };

  const connect = async (provider: string) => {
    setBusy(provider);
    setMsg(null);
    try {
      const res = await fetch("/api/account/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (json.ok) {
        window.location.href = json.data.url;
      } else {
        setMsg({ text: json.error || "Error", kind: "error" });
      }
    } catch {
      setMsg({ text: "Error", kind: "error" });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (accountId: string) => {
    setBusy(accountId);
    setMsg(null);
    try {
      const res = await fetch("/api/account/social/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const json = await res.json();
      if (json.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        setMsg({ text: d.connected + " → " + d.disconnect, kind: "ok" });
      } else {
        setMsg({
          text: json.error === "cannot_disconnect_last_method" ? d.cannotDisconnect : "Error",
          kind: "error",
        });
      }
    } catch {
      setMsg({ text: "Error", kind: "error" });
    } finally {
      setBusy(null);
    }
  };

  const merge = async () => {
    if (!mergeConflict) return;
    setBusy("merge");
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        socialAccountId: mergeConflict.socialAccountId,
      };
      if (mergeChoices.name === "other") body.name = mergeConflict.otherName;
      if (mergeChoices.email === "other" && mergeConflict.otherEmail) body.email = mergeConflict.otherEmail;
      if (mergeChoices.phone === "other" && mergeConflict.otherPhone) body.phone = mergeConflict.otherPhone;

      const res = await fetch("/api/account/social/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setMergeConflict(null);
        setMsg({ text: d.mergeComplete, kind: "ok" });
        fetchAccounts();
      } else {
        setMsg({ text: d.mergeFailed, kind: "error" });
      }
    } catch {
      setMsg({ text: d.mergeFailed, kind: "error" });
    } finally {
      setBusy(null);
    }
  };

  const isLinked = (provider: string) => accounts.find((a) => a.provider === provider);

  const otherProfile = mergeConflict
    ? { name: mergeConflict.otherName, email: mergeConflict.otherEmail, phone: mergeConflict.otherPhone }
    : null;

  return (
    <div className="mt-8 bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 shadow-[0_12px_36px_rgba(20,45,90,0.05)]">
      <h2 className="text-[18px] font-[1000] text-[var(--text)]">{d.socialAccounts}</h2>
      <p className="mt-1 text-[13px] font-[850] text-[var(--muted)]">{d.socialAccountsHint}</p>

      {msg && (
        <p
          className={`mt-4 text-[13px] font-[850] rounded-[12px] px-4 py-3 ${
            msg.kind === "ok"
              ? "text-[var(--success)] bg-[var(--success-soft)] border border-[var(--success-soft-3)]"
              : "text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)]"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {PROVIDERS.map((p) => {
          const linked = isLinked(p.key);
          return (
            <div
              key={p.key}
              className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--line-2)] bg-[var(--neutral-soft)] px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[16px] font-[1000] shrink-0"
                  style={{ background: p.bg, color: p.color }}
                >
                  {p.icon}
                </div>
                <div>
                  <p className="text-[14px] font-[950] text-[var(--text)] capitalize">{p.key}</p>
                  {linked ? (
                    <p className="text-[12px] font-[850] text-[var(--success)]">
                      {d.connected}
                      {linked.name ? ` — ${linked.name}` : ""}
                      {linked.email ? ` (${linked.email})` : ""}
                    </p>
                  ) : (
                    <p className="text-[12px] font-[850] text-[var(--muted)]">{d.notConnected}</p>
                  )}
                </div>
              </div>
              <div>
                {linked ? (
                  <button
                    onClick={() => disconnect(linked.id)}
                    disabled={busy === linked.id}
                    className="rounded-[12px] border border-[var(--danger)] text-[var(--danger)] font-[950] px-4 py-2.5 text-[12.5px] transition-all hover:bg-[var(--danger)]/5 disabled:opacity-50"
                  >
                    {busy === linked.id ? "…" : d.disconnect}
                  </button>
                ) : (
                  <button
                    onClick={() => connect(p.key)}
                    disabled={busy === p.key}
                    className="rounded-[12px] text-white font-[950] px-4 py-2.5 text-[12.5px] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
                  >
                    {busy === p.key ? "…" : p.key === "google" ? d.connectGoogle : d.connectGithub}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mergeConflict && otherProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 max-w-[540px] w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-[1000] text-[var(--text)]">{d.mergeConflict}</h3>
            <p className="mt-2 text-[13px] font-[850] text-[var(--muted)] leading-relaxed">{d.mergeConflictDesc}</p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-[16px] border border-[var(--line-2)] bg-[var(--neutral-soft)] p-4">
                <p className="text-[12px] font-[900] text-[var(--muted)] mb-3">{d.currentProfile}</p>
                <ProfileMini name={user.name} email={user.email} phone={user.phone} />
              </div>
              <div className="rounded-[16px] border border-[var(--line-2)] bg-[var(--neutral-soft)] p-4">
                <p className="text-[12px] font-[900] text-[var(--muted)] mb-3">{d.otherProfile}</p>
                <ProfileMini name={otherProfile.name} email={otherProfile.email} phone={otherProfile.phone} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(["name", "email", "phone"] as const).map((field) => {
                const currentVal = field === "name" ? user.name : field === "email" ? user.email : user.phone;
                const otherVal = field === "name" ? otherProfile.name : field === "email" ? otherProfile.email : otherProfile.phone;
                if (!currentVal && !otherVal) return null;
                const label = field === "name" ? d.nameField : field === "email" ? d.emailField : d.phoneField;
                return (
                  <div key={field}>
                    <p className="text-[12.5px] font-[900] text-[var(--text-2)] mb-1.5">{label}</p>
                    <div className="flex gap-3">
                      <label className={`flex-1 rounded-[12px] border px-3 py-2.5 text-[12.5px] font-[850] cursor-pointer transition-all ${mergeChoices[field] === "current" ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-[var(--line-2)] text-[var(--muted)]"}`}>
                        <input type="radio" name={field} checked={mergeChoices[field] === "current"} onChange={() => setMergeChoices((c) => ({ ...c, [field]: "current" }))} className="sr-only" />
                        {currentVal || "—"}
                      </label>
                      <label className={`flex-1 rounded-[12px] border px-3 py-2.5 text-[12.5px] font-[850] cursor-pointer transition-all ${mergeChoices[field] === "other" ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-[var(--line-2)] text-[var(--muted)]"}`}>
                        <input type="radio" name={field} checked={mergeChoices[field] === "other"} onChange={() => setMergeChoices((c) => ({ ...c, [field]: "other" }))} className="sr-only" />
                        {otherVal || "—"}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setMergeConflict(null)}
                className="rounded-[12px] border border-[var(--line)] text-[var(--muted)] font-[950] px-5 py-2.5 text-[13px] transition-all hover:bg-[var(--soft)]"
              >
                Cancel
              </button>
              <button
                onClick={merge}
                disabled={busy === "merge"}
                className="rounded-[12px] text-white font-[950] px-5 py-2.5 text-[13px] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
              >
                {busy === "merge" ? "…" : d.mergeComplete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMini({ name, email, phone }: { name: string | null; email: string | null; phone: string | null }) {
  return (
    <div className="space-y-1.5 text-[12.5px] font-[850]">
      {name && <p className="text-[var(--text)]">{name}</p>}
      {email && <p className="text-[var(--muted)]" dir="ltr">{email}</p>}
      {phone && <p className="text-[var(--muted)]" dir="ltr">{phone}</p>}
      {!name && !email && !phone && <p className="text-[var(--muted)]">—</p>}
    </div>
  );
}
