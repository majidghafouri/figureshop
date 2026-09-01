import type { ImgHTMLAttributes } from "react";
import Link from "next/link";
import { Locale, localePrefix, locales } from "@/lib/i18n";
import { Dictionary } from "@/lib/i18n-dictionaries";
import Logo from "@/components/Logo";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getSessionUser } from "@/lib/auth";

export default async function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const prefix = localePrefix(locale);
  const langLabels: Record<Locale, string> = { fa: "فارسی", en: "English", ar: "العربية" };
  const sessionUser = await getSessionUser().catch(() => null);

  return (
    <footer
      className="relative overflow-hidden py-[56px_0_30px] border-t border-[var(--line)]"
      style={{
        background:
          "radial-gradient(circle at 12% 0%, rgba(var(--teal-rgb),0.16), transparent 34%), radial-gradient(circle at 86% 16%, rgba(var(--primary-rgb),0.14), transparent 36%), linear-gradient(135deg, var(--bg-tint) 0%, var(--soft-2) 44%, var(--success-soft-2) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 -18px 54px rgba(20,45,90,0.045)",
      }}
    >
      <div className="container-page">
        <div className="grid grid-cols-[1.2fr_repeat(3,1fr)] max-sm:grid-cols-1 max-md:grid-cols-2 gap-6 py-8">
          {/* Brand */}
          <div className="max-sm:mb-2">
            <Logo locale={locale} />
            <p className="mt-4 text-[var(--text-5)] text-[13.5px] leading-[1.92] font-[700] max-w-[300px]">
              {dict.footer.tagline}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="mailto:info@figureforge.ir"
                className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(var(--primary-rgb),0.15)]"
                aria-label="Email"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M22 7l-10 6L2 7"/></svg>
              </a>
              <a
                href="https://t.me/figureforge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(var(--primary-rgb),0.15)]"
                aria-label="Telegram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.5L18 6.6c.3-.3-.1-.5-.5-.2L7.3 13.2l-4.4-1.4c-1-.3-1-1 .2-1.4L20.8 3.4c.8-.3 1.5.2 1.1 1.2z"/></svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {(["shop", "help", "contact"] as const).map((col) => (
            <div key={col}>
              <div className="text-[var(--text)] font-[950] text-[16px] mb-3">
                {dict.footer.columns[col]}
              </div>
              <ul className="space-y-2.5">
                {dict.footer.links[col].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={prefix + link.href}
                      className="text-[var(--text-5)] font-[700] text-[13.5px] no-underline transition-colors duration-200 hover:text-[var(--primary)] hover:underline hover:underline-offset-[5px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {col === "help" && (
                  <li>
                    <Link
                      href={prefix + "/privacy"}
                      className="text-[var(--text-5)] font-[700] text-[13.5px] no-underline transition-colors duration-200 hover:text-[var(--primary)] hover:underline hover:underline-offset-[5px]"
                    >
                      {dict.footer.links.help.find(l => l.label === "Privacy Policy")?.label || "Privacy Policy"}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-2">
          <NewsletterSignup
            dict={dict.newsletter}
            locale={locale}
            userEmail={sessionUser?.email ?? null}
          />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[rgba(var(--primary-rgb),0.16)] pt-5 flex flex-wrap items-center justify-between gap-4 text-[13px] font-[700] text-[var(--muted-5)]">
          <span>{dict.footer.rights}</span>
          <div className="flex items-center gap-3">
            <a
              href="https://trustseal.enamad.ir/?id=773536&Code=VQhpOQtj5t7Y8nhGy6ZjSmSGVE1QBj1f"
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="origin"
              aria-label="اینماد"
              className="inline-flex rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(var(--primary-rgb),0.15)]"
            >
              <img
                referrerPolicy="origin"
                src="https://trustseal.enamad.ir/logo.aspx?id=773536&Code=VQhpOQtj5t7Y8nhGy6ZjSmSGVE1QBj1f"
                alt="Enamad Trust Seal"
                width={120}
                height={50}
                style={{ cursor: "pointer" }}
                className="h-20 w-auto"
                {...{ code: "VQhpOQtj5t7Y8nhGy6ZjSmSGVE1QBj1f" } as ImgHTMLAttributes<HTMLImageElement>}
              />
            </a>
            <div className="flex items-center gap-2">
              {locales.map((l, i) => (
                <span key={l} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[var(--line-11)] select-none">|</span>}
                  <Link
                    href={l === "fa" ? "/" : `/${l}`}
                    className={`transition-colors duration-200 ${
                      l === locale ? "text-[var(--primary)] font-[950]" : "hover:text-[var(--primary)]"
                    }`}
                  >
                    {langLabels[l]}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
