import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";

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
    title: dict.faq.title,
    description: dict.faq.intro.slice(0, 160),
    path: `${prefix}/faq`,
    locale,
  });
}

export default function FaqPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const faqJsonLd = JSON.parse(
    buildFaqJsonLd(
      dict.faq.categories.flatMap((c) =>
        c.items.map((item) => ({ q: item.q, a: item.a })),
      ),
    ),
  );

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_12%_8%,rgba(var(--teal-rgb),0.10),transparent_30%), radial-gradient(circle_at_90%_14%,rgba(var(--primary-rgb),0.08),transparent_26%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.faq.title, url: "" },
      ], locale))} />
      <JsonLd data={faqJsonLd} />
      <div className="container-page">
        <div className="text-center">
          <span className="inline-block bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-4 py-1.5 text-[12px] font-[950]">
            {dict.faq.kicker}
          </span>
          <h1 className="mt-4 text-[clamp(28px,4vw,44px)] font-[1000] text-[var(--text)]">{dict.faq.title}</h1>
          <p className="mx-auto mt-4 max-w-[640px] text-[14.5px] leading-[2] font-[750] text-[var(--muted)]">
            {dict.faq.intro}
          </p>
        </div>

        <div className="mt-10 mx-auto max-w-[820px] space-y-8">
          {dict.faq.categories.map((category, ci) => (
            <Reveal key={category.heading} delay={ci * 40}>
              <section>
                <h2 className="flex items-center gap-2.5 text-[17px] font-[1000] text-[var(--text)]">
                  <span className="w-[42px] h-[42px] shrink-0 rounded-[13px] product-img-bg border border-[var(--soft-line)] flex items-center justify-center text-[20px]">
                    {category.icon}
                  </span>
                  {category.heading}
                </h2>
                <div className="mt-3 space-y-2.5">
                  {category.items.map((item) => (
                    <details
                      key={item.q}
                      className="group bg-[var(--surface)] border border-[var(--line)] rounded-[18px] overflow-hidden transition-shadow hover:shadow-[0_12px_32px_rgba(20,45,90,0.07)] open:shadow-[0_14px_40px_rgba(20,45,90,0.10)]"
                    >
                      <summary className="flex items-center justify-between gap-3 cursor-pointer select-none list-none px-5 py-4 text-[14px] font-[950] text-[var(--text)] [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <span className="shrink-0 w-[26px] h-[26px] rounded-full bg-[var(--soft)] border border-[var(--line-4)] flex items-center justify-center text-[15px] font-[1000] text-[var(--primary)] transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="px-5 pb-5 pt-0 text-[13.5px] leading-[2] font-[750] text-[var(--muted)]">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
