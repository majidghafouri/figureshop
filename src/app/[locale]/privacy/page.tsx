import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import TableOfContents from "@/components/TableOfContents";

export const revalidate = 600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);
  return buildMetadata({
    title: dict.privacy.title,
    description: dict.privacy.intro.slice(0, 160),
    path: `${prefix}/privacy`,
    locale,
  });
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const headings = dict.privacy.sections.map((s) => ({
    id: s.id,
    text: s.heading,
    level: 2,
  }));

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_12%_8%,rgba(var(--teal-rgb),0.10),transparent_30%), radial-gradient(circle_at_90%_14%,rgba(var(--primary-rgb),0.08),transparent_26%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.privacy.title, url: "" },
      ], locale))} />
      <div className="container-page">
        <div className="text-center">
          <span className="inline-block bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-4 py-1.5 text-[12px] font-[950]">
            {dict.privacy.kicker}
          </span>
          <h1 className="mt-4 text-[clamp(28px,4vw,44px)] font-[1000] text-[var(--text)]">{dict.privacy.title}</h1>
          <p className="mt-2 text-[12.5px] font-[850] text-[var(--muted)]">
            {dict.privacy.lastUpdatedLabel}: {dict.privacy.updated}
          </p>
        </div>

        <Reveal>
          <p className="mx-auto mt-8 max-w-[760px] rounded-[24px] bg-[var(--surface)] border border-[var(--line)] p-6 text-[14.5px] leading-[2] font-[750] text-[var(--text-2)] shadow-[0_12px_36px_rgba(20,45,90,0.05)]">
            {dict.privacy.intro}
          </p>
        </Reveal>

        <div className="mt-10 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 items-start">
          <aside className="hidden lg:block">
            <TableOfContents headings={headings} tocTitle={dict.privacy.tocTitle} />
          </aside>

          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {dict.privacy.sections.map((section, i) => (
                <Reveal key={section.id} delay={i * 30}>
                  <section id={section.id} className="h-full bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 scroll-mt-[100px] hover:shadow-[0_18px_48px_rgba(20,45,90,0.10)] transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="w-[46px] h-[46px] shrink-0 rounded-[14px] flex items-center justify-center text-[22px] product-img-bg border border-[var(--soft-line)]">
                        {section.icon}
                      </span>
                      <h2 className="text-[16.5px] font-[1000] text-[var(--text)]">{section.heading}</h2>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {section.body.map((p, j) => (
                        <p key={j} className="text-[13.5px] leading-[2] font-[700] text-[var(--muted)]">
                          {p}
                        </p>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 text-[13px] leading-[2] font-[700] text-[var(--muted-4)]">
              <span className="font-[950] text-[var(--muted)]">{dict.privacy.lastUpdatedLabel}: </span>
              {dict.privacy.updated} — © {new Date().getFullYear()} Figureforge
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}