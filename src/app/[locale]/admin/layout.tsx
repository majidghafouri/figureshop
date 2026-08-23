import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { getSessionUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const prefix = localePrefix(locale);
  const dict = getDictionary(locale);

  const user = await getSessionUser();
  if (!user) {
    redirect(`${prefix}/auth?next=${encodeURIComponent(`${prefix}/admin`)}`);
  }
  if (user.role !== "ADMIN") {
    redirect(`${prefix}/account`);
  }

  const LINKS = [
    { href: "", label: dict.admin.nav.dashboard, icon: "📊" },
    { href: "/analytics", label: dict.admin.nav.analytics, icon: "📈" },
    { href: "/products", label: dict.admin.nav.products, icon: "🗃️" },
    { href: "/categories", label: dict.admin.nav.categories, icon: "🗂️" },
    { href: "/orders", label: dict.admin.nav.orders, icon: "📦" },
    { href: "/coupons", label: dict.admin.nav.coupons, icon: "🏷️" },
    { href: "/users", label: dict.admin.nav.users, icon: "👥" },
    { href: "/newsletter", label: dict.admin.nav.newsletter, icon: "📬" },
    { href: "/reactions", label: dict.admin.nav.reactions, icon: "🧡" },
    { href: "/appearance", label: dict.admin.nav.appearance, icon: "🎨" },
    { href: "/email", label: dict.admin.nav.email, icon: "✉️" },
    { href: "/settings", label: dict.admin.nav.settings, icon: "🔑" },
  ];

  return (
    <div className="relative min-h-screen py-[40px] max-sm:py-[28px]"
      style={{ background: "linear-gradient(180deg,var(--bg),var(--bg-grad-2))" }}
    >
      <div className="container-page">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[clamp(22px,3vw,30px)] font-[1000] text-[var(--text)]">🛡️ {dict.admin.title}</h1>
            <p className="mt-1 text-[12.5px] font-[850] text-[var(--muted)]">{dict.admin.signedInAs} {user.email}</p>
          </div>
          <Link href={`${prefix}/`} className="text-[13px] font-[950] text-[var(--primary)] hover:underline">
            ← {dict.admin.backToShop}
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-[20px] items-start">
          <nav className="lg:sticky lg:top-[96px] bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-3 flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={`${prefix}/admin${l.href}`}
                className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] text-[13.5px] font-[900] text-[var(--text-3)] whitespace-nowrap hover:bg-[var(--soft)] hover:text-[var(--primary)] transition-colors"
              >
                <span>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </nav>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
