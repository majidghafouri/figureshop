"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dictionary } from "@/lib/i18n-dictionaries";

type AuthMode = "login" | "register" | "forgot";

const AUTH_STORAGE_KEY = "figureforge-auth-state-v1";

export default function AuthForm({ dict, prefix }: { dict: Dictionary; prefix: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<"email" | "code">("email");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(5).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [serverCooldown, setServerCooldown] = useState<number | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY) ?? "null") as {
        mode: AuthMode;
        step: "email" | "code";
        identifier: string;
        digits: string[];
        password: string;
        confirmPassword: string;
        cooldown: number;
        devCode: string | null;
      } | null;
      if (saved && (saved.mode === "register" || saved.mode === "forgot")) {
        setMode(saved.mode);
        setStep(saved.step === "code" ? "code" : "email");
        setIdentifier(saved.identifier ?? "");
        setDigits(
          Array.isArray(saved.digits) && saved.digits.length === 5
            ? saved.digits
            : Array(5).fill(""),
        );
        setPassword(saved.password ?? "");
        setConfirmPassword(saved.confirmPassword ?? "");
        setCooldown(saved.cooldown ?? 0);
        setDevCode(saved.devCode ?? null);
      } else {
        const modeParam = searchParams.get("mode") as AuthMode | null;
        if (modeParam === "register" || modeParam === "forgot") {
          setMode(modeParam);
          setStep("email");
          setIdentifier("");
          setDigits(Array(5).fill(""));
          setPassword("");
          setConfirmPassword("");
          setError(null);
          setDevCode(null);
        }
      }
    } catch {
      const modeParam = searchParams.get("mode") as AuthMode | null;
      if (modeParam === "register" || modeParam === "forgot") {
        setMode(modeParam);
        setStep("email");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          mode,
          step,
          identifier,
          digits,
          password,
          confirmPassword,
          cooldown,
          devCode,
        }),
      );
    } catch {}
  }, [mode, step, identifier, digits, password, confirmPassword, cooldown, devCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const skipFirstSearchParams = useRef(true);
  useEffect(() => {
    if (skipFirstSearchParams.current) {
      skipFirstSearchParams.current = false;
      return;
    }
    const modeParam = searchParams.get("mode") as AuthMode | null;
    if (modeParam !== "register" && modeParam !== "forgot") return;
    setMode((prev) => {
      if (prev === modeParam) return prev;
      setStep("email");
      setIdentifier("");
      setDigits(Array(5).fill(""));
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setDevCode(null);
      setCooldown(0);
      setServerCooldown(null);
      return modeParam;
    });
  }, [searchParams]);

  const resolveIdentifier = (v: string) => {
    const raw = v.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      return { email: raw.toLowerCase() };
    }
    const digits = raw.replace(/[^\d]/g, "");
    const match = digits.match(/^(?:98|0)?(9\d{9})$/);
    if (match) return { phone: `0${match[1]}` };
    return null;
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setStep("email");
    setIdentifier("");
    setDigits(Array(5).fill(""));
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setDevCode(null);
    setCooldown(0);
    setServerCooldown(null);
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (mode === "register" && !acceptedTerms) {
      setError(dict.auth.acceptTermsError);
      return;
    }
    const identifierPayload = resolveIdentifier(identifier);
    if (!identifierPayload) {
      setError(dict.auth.errorInvalidEmail);
      return;
    }

    const purpose = mode === "register" ? "REGISTER" : "PASSWORD_RESET";

    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identifierPayload, purpose }),
      });
      const json = await res.json();
      if (!json.ok) {
        if (res.status === 429 && json.retryAfter) {
          setServerCooldown(json.retryAfter);
          setCooldown(json.retryAfter);
        }
        setError(
          json.error === "email_failed"
            ? dict.auth.errorEmailFailed + (json.detail ? ` (${json.detail})` : "")
            : json.error === "sms_failed"
              ? dict.auth.errorSendFailed
              : json.error === "invalid_identifier" || json.error === "invalid_email"
                ? dict.auth.errorInvalidEmail
                : json.error === "user_exists_use_login"
                  ? dict.auth.errorUserExists
                  : json.error === "no_password_set"
                    ? dict.auth.errorNoPassword
                    : dict.auth.errorSendFailed,
        );
        return;
      }
      setStep("code");
      setDigits(Array(5).fill(""));
      setPassword("");
      setConfirmPassword("");
      if (json.data?.devCode) setDevCode(json.data.devCode);
      setCooldown(serverCooldown ?? 180);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch {
      setError(dict.auth.errorSendFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleDigit = (i: number, value: string) => {
    const v = value.replace(/[^\d]/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 4) inputsRef.current[i + 1]?.focus();
    if (v && i === 4) {
      verify(next.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^\d]/g, "").slice(0, 5);
    if (!pasted) return;
    const next = [...digits];
    for (let k = 0; k < pasted.length; k++) next[k] = pasted[k];
    setDigits(next);
    if (pasted.length === 5) {
      verify(next.join(""));
    } else {
      inputsRef.current[Math.min(pasted.length, 4)]?.focus();
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (digits[i]) {
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        next[i - 1] = "";
        setDigits(next);
        inputsRef.current[i - 1]?.focus();
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const clearCode = () => {
    setDigits(Array(5).fill(""));
    inputsRef.current[0]?.focus();
  };

  const verify = async (code?: string) => {
    setError(null);
    if (busy) return;
    const value = code ?? digits.join("");
    if (value.length !== 5) {
      setError(dict.auth.errorInvalidCode);
      return;
    }

    const purpose = mode === "register" ? "REGISTER" : "PASSWORD_RESET";
    const endpoint = "/api/auth/verify-otp";

    if (mode === "register" || mode === "forgot") {
      if (!password) {
        setError(dict.auth.passwordTooShort);
        passwordRef.current?.focus();
        return;
      }
      if (password !== confirmPassword) {
        confirmPasswordRef.current?.focus();
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...resolveIdentifier(identifier),
          code: value,
          purpose,
          password: mode === "register" || mode === "forgot" ? password : undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(
          json.error === "expired_code"
            ? dict.auth.errorExpiredCode
            : json.error === "invalid_password"
              ? dict.auth.passwordTooShort
              : json.error === "no_password_set"
                ? dict.auth.errorNoPassword
                : json.error === "invalid_identifier"
                  ? dict.auth.errorInvalidEmail
                  : dict.auth.errorInvalidCode,
        );
        inputsRef.current[4]?.focus();
        return;
      }
      const next = searchParams.get("next");
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      router.push(next ?? "/");
      router.refresh();
    } catch {
      setError(dict.auth.errorInvalidCode);
    } finally {
      setBusy(false);
    }
  };

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const identifierPayload = resolveIdentifier(identifier);
    if (!identifierPayload) {
      setError(dict.auth.errorInvalidEmail);
      return;
    }
    if (!password) {
      setError(dict.auth.passwordTooShort);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identifierPayload, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(
          json.error === "invalid_credentials" || json.error === "invalid_identifier"
            ? dict.auth.errorInvalidCredentials
            : json.error === "no_password_set"
              ? dict.auth.errorNoPassword
              : dict.auth.errorInvalidCredentials,
        );
        return;
      }
      const next = searchParams.get("next");
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      router.push(next ?? "/");
      router.refresh();
    } catch {
      setError(dict.auth.errorInvalidCredentials);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    await sendCode();
  };

  const renderEmailStep = () => (
    <>
      <div className="mt-7 space-y-4">
        <label className="block">
          <span className="text-[12.5px] font-[900] text-[var(--text-2)]">
            {dict.auth.emailPlaceholder}
          </span>
          <input
            type="text"
            inputMode="email"
            dir="ltr"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com / 0912…"
            className="mt-2 w-full border border-[var(--line-2)] rounded-[16px] px-4 py-3.5 text-[15px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
          />
        </label>

        {(mode === "register" || mode === "forgot") && (
          <>
            {error && (
              <p className="text-[13px] font-[850] text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)] rounded-[12px] px-3 py-2.5">
                {error}
              </p>
            )}
            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="mt-0.5 w-[18px] h-[18px] accent-[var(--primary)] shrink-0"
                />
                <span className="text-[12.5px] leading-[1.9] font-[800] text-[var(--text-2)]">
                  {dict.auth.agreePrefix}
                  <a
                    href={`${prefix}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] font-[950] hover:underline underline-offset-4"
                  >
                    {dict.auth.termsLink}
                  </a>
                  {dict.auth.agreeSuffix}
                </span>
              </label>
            )}
            <button
              type="button"
              onClick={sendCode}
              disabled={busy}
              className="w-full rounded-[16px] text-white font-[950] py-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg,var(--primary),var(--sky))",
              }}
            >
              {busy ? dict.common.loading : dict.auth.sendCode}
            </button>
          </>
        )}

        {mode === "login" && (
          <>
            <label className="block">
              <span className="text-[12.5px] font-[900] text-[var(--text-2)]">
                {dict.auth.passwordPlaceholder}
              </span>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[var(--line-2)] rounded-[16px] px-4 py-3.5 text-[15px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-[800] text-[var(--muted)]"
                >
                  {showPassword ? "🙛" : "👁️"}
              </button>
              </div>
            </label>

            {error && (
              <p className="text-[13px] font-[850] text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)] rounded-[12px] px-3 py-2.5">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={login}
              disabled={busy}
              className="w-full rounded-[16px] text-white font-[950] py-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg,var(--primary),var(--sky))",
              }}
            >
              {busy ? dict.common.loading : dict.auth.loginButton}
            </button>

            <div className="flex items-center justify-between text-[12.5px] font-[800] text-[var(--muted)]">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-[var(--primary)] hover:underline"
              >
                {dict.auth.forgotPassword}
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-[var(--primary)] hover:underline"
              >
                {dict.auth.noAccount}
              </button>
            </div>
          </>
        )}

        {mode === "login" && (
          <p className="text-[12px] leading-[1.9] font-[750] text-[var(--muted)] text-center">
            {dict.auth.demoNote}
          </p>
        )}

        {(mode === "register" || mode === "forgot") && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-[12.5px] font-[900] text-[var(--primary)] hover:underline"
            >
              {mode === "register" ? dict.auth.haveAccount : dict.auth.backToLogin}
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderCodeStep = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
      className="mt-7 space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[13px] font-[850] text-[var(--text-2)]" dir="ltr">
          {identifier}
        </span>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setIdentifier("");
            setDigits(Array(5).fill(""));
            setPassword("");
            setConfirmPassword("");
            setError(null);
            setDevCode(null);
            setCooldown(0);
            setServerCooldown(null);
          }}
          className="text-[12.5px] font-[900] text-[var(--primary)] hover:underline"
        >
          {dict.auth.changeEmail}
        </button>
      </div>

      <div className="flex justify-center gap-2" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => handleKey(i, e)}
            onFocus={handleFocus}
            className="w-[52px] h-[60px] text-center border border-[var(--line-2)] rounded-[14px] text-[22px] font-[1000] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
          />
        ))}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[12.5px] font-[900] text-[var(--text-2)]">
            {mode === "register"
              ? dict.auth.passwordPlaceholder
              : dict.auth.passwordPlaceholder}
          </span>
          <div className="relative mt-2">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--line-2)] rounded-[16px] px-4 py-3.5 text-[15px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-[800] text-[var(--muted)]"
            >
              {showPassword ? "🙛" : "👁️"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-[12.5px] font-[900] text-[var(--text-2)]">
            {dict.auth.passwordConfirmPlaceholder}
          </span>
          <div className="relative mt-2">
            <input
              ref={confirmPasswordRef}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[var(--line-2)] rounded-[16px] px-4 py-3.5 text-[15px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-[800] text-[var(--muted)]"
            >
              {showPassword ? "🙛" : "👁️"}
            </button>
          </div>
        </label>
      </div>

      {devCode && (
        <p
          className="text-center text-[12.5px] font-[900] text-[var(--sky)] bg-[var(--soft)] border border-[var(--line-4)] rounded-[12px] px-3 py-2.5"
          dir="ltr"
        >
          DEV CODE: {devCode}
        </p>
      )}

      {password && confirmPassword && password !== confirmPassword && (
        <p className="text-[13px] font-[850] text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)] rounded-[12px] px-3 py-2.5">
          {dict.auth.passwordMismatch}
        </p>
      )}

      {error && error !== dict.auth.passwordMismatch && (
        <p className="text-[13px] font-[850] text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)] rounded-[12px] px-3 py-2.5">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={clearCode}
          disabled={busy || digits.every((d) => !d)}
          className="text-[12.5px] font-[900] text-[var(--muted)] hover:text-[var(--primary)] disabled:opacity-50"
        >
          {dict.auth.clearCode}
        </button>
        <button
          type="submit"
          disabled={
            busy ||
            digits.some((d) => !d) ||
            !password ||
            password !== confirmPassword
          }
          className="rounded-[16px] text-white font-[950] px-6 py-3.5 text-[15px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)]"
          style={{
            backgroundImage:
              "linear-gradient(135deg,var(--primary),var(--sky))",
          }}
        >
          {busy
            ? dict.common.loading
            : mode === "register"
              ? dict.auth.signupButton
              : dict.auth.resetPassword}
        </button>
      </div>

      <div className="text-center">
        {cooldown > 0 ? (
          <span className="text-[12.5px] font-[850] text-[var(--muted)]">
            {dict.auth.resendIn} {cooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            className="text-[12.5px] font-[900] text-[var(--primary)] hover:underline"
          >
            {dict.auth.resend}
          </button>
        )}
      </div>

      <p className="text-[12px] leading-[1.9] font-[750] text-[var(--muted)] text-center">
        {dict.auth.demoNote}
      </p>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[28px] p-8 shadow-[0_18px_54px_rgba(20,45,90,0.10)]">
        <div className="text-center">
          <div
            className="mx-auto w-[64px] h-[64px] rounded-[20px] flex items-center justify-center text-white text-[26px] shadow-[0_12px_30px_rgba(var(--primary-rgb),0.35)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg,var(--primary),var(--teal))",
            }}
          >
            {mode === "login" ? "🔐" : mode === "register" ? "✉️" : "🔑"}
          </div>
          <h1 className="mt-4 text-[clamp(22px,2.6vw,30px)] font-[1000] text-[var(--text)]">
            {mode === "login"
              ? dict.auth.loginTitle
              : mode === "register"
                ? dict.auth.registerTitle
                : dict.auth.forgotTitle}
          </h1>
          <p className="mt-2 text-[13.5px] font-[750] text-[var(--muted)]">
            {mode === "login"
              ? dict.auth.loginSubtitle
              : mode === "register"
                ? dict.auth.registerSubtitle
                : dict.auth.forgotSubtitle}
          </p>
        </div>

        {step === "email" && mode === "login"
          ? renderEmailStep()
          : step === "email" && (mode === "register" || mode === "forgot")
            ? renderEmailStep()
            : renderCodeStep()}

        {mode === "login" && step === "email" && (
          <div className="mt-6">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--line-2)]" />
              </div>
              <div className="relative flex justify-center text-[12px] font-[800]">
                <span className="bg-[var(--surface)] px-3 text-[var(--muted)]">
                  {dict.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--line-2)] bg-[var(--bg)] py-3 text-[13px] font-[850] text-[var(--text)] transition-all duration-200 hover:border-[var(--primary)] hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.1)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {dict.auth.continueWithGoogle}
              </a>

              <a
                href="/api/auth/github"
                className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--line-2)] bg-[var(--bg)] py-3 text-[13px] font-[850] text-[var(--text)] transition-all duration-200 hover:border-[var(--primary)] hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.1)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                {dict.auth.continueWithGitHub}
              </a>

              <a
                href="/api/auth/apple"
                className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--line-2)] bg-[var(--bg)] py-3 text-[13px] font-[850] text-[var(--text)] transition-all duration-200 hover:border-[var(--primary)] hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.1)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {dict.auth.continueWithApple}
              </a>

              <a
                href={`https://oauth.telegram.org/auth?bot_id=${process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID}&origin=${typeof window !== "undefined" ? window.location.origin : "https://figureforge.ir"}&request_access=write`}
                className="flex items-center justify-center gap-2 rounded-[14px] border border-[var(--line-2)] bg-[var(--bg)] py-3 text-[13px] font-[850] text-[var(--text)] transition-all duration-200 hover:border-[var(--primary)] hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.1)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0088cc">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {dict.auth.continueWithTelegram}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
