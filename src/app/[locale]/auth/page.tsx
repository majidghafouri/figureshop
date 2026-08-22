import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata } from "@/lib/seo";
import { getSessionUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  return buildMetadata({
    title: dict.auth.title,
    description: dict.auth.subtitle,
    path: `${localePrefix(locale)}/auth`,
    locale,
    noindex: true,
  });
}

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { next?: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const user = await getSessionUser();
  if (user) {
    const next = searchParams.next;
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    redirect(`${prefix}/account`);
  }

  return (
    <div className="relative overflow-hidden py-[56px] max-sm:py-[40px]"
      style={{
        background:
          "radial-gradient(circle_at_15%_12%,rgba(var(--teal-rgb),0.12),transparent_30%), radial-gradient(circle_at_88%_10%,rgba(var(--primary-rgb),0.10),transparent_28%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <div className="container-page">
        <AuthForm dict={dict} prefix={prefix} />
      </div>
    </div>
  );
}
