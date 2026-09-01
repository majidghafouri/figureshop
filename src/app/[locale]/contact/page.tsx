import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";

export const revalidate = 600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);
  return buildMetadata({
    title: `${dict.contact.kicker} | ${dict.nav.home}`,
    description: dict.contact.subtitle,
    path: `${prefix}/contact`,
    locale,
  });
}

export default async function ContactPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const phone = (await getSetting("contact_phone")) || dict.footer.phone;
  const email = (await getSetting("contact_email")) || "info@figureforge.ir";
  const address = (await getSetting(`contact_address_${locale}`)) || dict.contact.addressText;
  const hours = (await getSetting(`contact_hours_${locale}`)) || dict.contact.hoursText;

  const infoCards = [
    { icon: "📞", label: dict.contact.phone, value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` },
    { icon: "✉️", label: dict.contact.email, value: email, href: `mailto:${email}` },
    { icon: "📍", label: dict.contact.address, value: address },
    { icon: "🕘", label: dict.contact.hours, value: hours },
  ];

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_12%_8%,rgba(var(--teal-rgb),0.10),transparent_30%), radial-gradient(circle_at_90%_14%,rgba(var(--primary-rgb),0.08),transparent_26%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.contact.kicker, url: "" },
      ], locale))} />
      <div className="container-page">
        <div className="text-center">
          <span className="inline-block bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-4 py-1.5 text-[12px] font-[950]">
            {dict.contact.kicker}
          </span>
          <h1 className="mt-4 text-[clamp(28px,4vw,44px)] font-[1000] text-[var(--text)]">{dict.contact.title}</h1>
          <p className="mt-2 text-[14px] font-[750] text-[var(--muted)]">{dict.contact.subtitle}</p>
        </div>

        <Reveal>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {infoCards.map((c) => (
              <div key={c.label} className="bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-5 text-center hover:shadow-[0_16px_42px_rgba(20,45,90,0.10)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-[52px] h-[52px] mx-auto rounded-[15px] flex items-center justify-center text-[24px] product-img-bg border border-[var(--soft-line)]">
                  {c.icon}
                </div>
                <p className="mt-3 text-[12.5px] font-[900] text-[var(--muted)]">{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="mt-1 block text-[14px] font-[1000] text-[var(--text)] hover:text-[var(--primary)] transition-colors" dir="ltr">
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-1 text-[14px] font-[1000] text-[var(--text)]">{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 max-w-[640px] mx-auto">
          <ContactForm dict={dict} />
        </div>
      </div>
    </div>
  );
}
