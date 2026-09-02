import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Locale, localePrefix, isLocale, formatDate, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildBreadcrumbJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd, SITE_URL } from "@/lib/seo";
import prisma from "@/lib/db";
import { mapProduct, productInclude } from "@/lib/shop";
import Reveal from "@/components/Reveal";
import ProductGrid from "@/components/ProductGrid";
import SpotlightCarousel from "@/components/SpotlightCarousel";
import JsonLd from "@/components/JsonLd";
import GuestOnly from "@/components/GuestOnly";
import GeoGuide from "@/components/GeoGuide";
import { notFound } from "next/navigation";
import { blogPostInclude } from "@/lib/blog";

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
    dict,
    locale,
    path: prefix || "/",
    title: dict.meta.title,
    description: dict.meta.description,
    authors: ["Figureforge"],
  });
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);
  const breadcrumbs = [
    { name: dict.nav.home, url: "" },
  ];

  const [featured, categories, rssPosts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude(locale),
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        translations: { where: { locale } },
        children: { include: { translations: { where: { locale } } } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() }, sourceType: "RSS" },
      include: blogPostInclude(locale),
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const cats = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.translations[0]?.name ?? c.slug,
    image: c.image,
    children: c.children.map((ch) => ({
      slug: ch.slug,
      name: ch.translations[0]?.name ?? ch.slug,
    })),
  }));

  return (
    <>
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd(breadcrumbs, locale))} />
      <JsonLd data={JSON.parse(buildOrganizationJsonLd())} />
      <JsonLd data={JSON.parse(buildWebsiteJsonLd())} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: dict.homeGeo.title,
          description: dict.homeGeo.description,
          url: SITE_URL,
          inLanguage: locale === "fa" ? "fa" : locale === "ar" ? "ar" : "en",
          dateModified: new Date().toISOString(),
          about: { "@type": "Thing", name: dict.homeGeo.title },
          author: {
            "@type": "Organization",
            name: "فیگرفورج | Figureforge",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@id": `${SITE_URL}/#author`,
          "@type": "Person",
          name: "فیگرفورج تیم متخصص | Figureforge Collector Team",
          jobTitle: "کلکسیون‌شناس فیگور و اکشن فیگور | Action Figure Collectibles Expert",
          description:
            "تیم متخصص فیگرفورج با سال‌ها تجربه در اصالت‌سنجی و قیمت‌گذاری فیگورهای اورجینال انیمه، گیمینگ، سینمایی و دیزنی. / Figureforge's figure-collecting team specializing in authenticity verification, valuation and care of original anime, gaming, film and Disney figures.",
          knowsAbout: [
            "Action Figures",
            "Collectible Figures",
            "Anime Figures",
            "Figure Authentication",
            "Figure Collecting",
          ],
          url: SITE_URL,
          sameAs: ["https://schema.org/ActionFigure"],
        }}
      />
      {featured[0] && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: featured[0].translations[0]?.name ?? featured[0].slug,
            description: featured[0].translations[0]?.description ?? dict.homeGeo.description,
            image: featured[0].images?.[0]
              ? `${SITE_URL}${featured[0].images[0]}`
              : `${SITE_URL}/og-default.jpg`,
            brand: featured[0].brand ? { "@type": "Brand", name: featured[0].brand } : undefined,
            sku: featured[0].slug,
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: featured[0].price,
              availability: "https://schema.org/InStock",
              url: `${SITE_URL}${prefix}/products/${featured[0].slug}`,
              seller: { "@type": "Organization", name: "فیگرفورج | Figureforge" },
            },
          }}
        />
      )}
      <section
        id="home"
        className="relative isolate overflow-hidden py-[64px] max-sm:py-[44px] min-h-[calc(100vh-76px)] scroll-mt-[76px] flex items-center"
        style={{
          background:
            "radial-gradient(circle at 78% 24%, rgba(var(--teal-rgb),0.18), transparent 26%), radial-gradient(circle at 17% 28%, rgba(var(--primary-rgb),0.14), transparent 32%), linear-gradient(135deg, var(--bg-tint) 0%, var(--bg-tint) 52%, var(--bg-tint) 100%)",
        }}
      >
        {/* grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--primary-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--primary-rgb),0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "linear-gradient(180deg,var(--black) 0%,rgba(0,0,0,.5) 65%,transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg,var(--black) 0%,rgba(0,0,0,.5) 65%,transparent 100%)",
          }}
        />
        {/* floating blob */}
        <div
          className="anim-float-blob absolute pointer-events-none rounded-full"
          style={{
            width: 570,
            height: 570,
            left: -150,
            bottom: -210,
            background: "radial-gradient(circle, rgba(var(--teal-rgb),0.22), transparent 64%)",
          }}
        />

        <div className="container-page relative grid xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)] gap-[42px] items-center">
          {/* Left */}
          <div className="max-w-[620px]">
            <div
              className="anim-fade-up inline-flex items-center gap-2.5 border border-[rgba(var(--teal-rgb),0.34)] bg-[rgba(232,255,252,0.74)] text-[var(--success-3)] rounded-full px-3.5 py-2 font-[950] text-[13.5px]"
              style={{ animationDelay: "0.02s" }}
            >
              <span className="w-[10px] h-[10px] rounded-full bg-[var(--teal)] anim-pulse-dot" />
              {dict.hero.eyebrow}
            </div>

            <h1
              className="anim-fade-up mt-5 text-[clamp(38px,5.6vw,64px)] max-sm:text-[clamp(32px,10.5vw,46px)] leading-[1.18] tracking-[-1.8px] font-[1000] text-[var(--text)]"
              style={{ animationDelay: "0.04s" }}
            >
              {dict.hero.titleStart} <span
                className="inline"
                style={{
                  background: "linear-gradient(135deg,var(--text),var(--primary))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {dict.hero.titleHighlight}
              </span>{" "}
              {dict.hero.titleEnd}
            </h1>

            {/* stat bar */}
            <div
              className="anim-fade-up mt-6 grid grid-cols-[auto_minmax(0,1fr)] p-[14px_16px] border border-[rgba(var(--primary-rgb),0.18)] rounded-[24px] items-center gap-4"
              style={{
                animationDelay: "0.06s",
                background:
                  "linear-gradient(135deg, var(--glass-92), var(--glass-tint))",
                boxShadow: "0 16px 46px rgba(20,45,90,0.10)",
              }}
            >
              <span
                className="text-white font-[1000] text-[15px] rounded-[14px] px-3 py-2 whitespace-nowrap"
                style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--teal))" }}
              >
                {dict.hero.statBadge}
              </span>
              <span className="text-[14px] font-[850] text-[var(--text-4)] leading-[1.7]">
                {dict.hero.statText}
              </span>
            </div>

            <p
              className="anim-fade-up mt-5 text-[15.5px] max-sm:text-[15px] leading-[2.02] text-[var(--text-8)] font-[650]"
              style={{ animationDelay: "0.08s" }}
            >
              {dict.hero.lead}
            </p>

            <div
              className="anim-fade-up mt-7 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.1s" }}
            >
              <Link
                href={`${prefix}/products`}
                className="btn-primary px-[24px] py-[13px] text-[15px]"
              >
                {dict.hero.ctaPrimary}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
              <Link
                href="#categories"
                className="btn-secondary px-[20px] py-[12px] text-[14.5px]"
              >
                {dict.hero.ctaSecondary}
              </Link>
            </div>

            <div
              className="anim-fade-up mt-5 flex flex-wrap gap-2"
              style={{ animationDelay: "0.12s" }}
            >
              {dict.hero.chips.map((chip) => (
                <span
                  key={chip}
                  className="bg-[var(--surface)] border border-[var(--line-2)] rounded-full px-3 py-1.5 font-[800] text-[12.5px] text-[var(--text-4)]"
                >
                  {chip}
                </span>
              ))}
            </div>

            <p
              className="anim-fade-up mt-5 text-[var(--muted-5)] font-[700] text-[14px]"
              style={{ animationDelay: "0.14s" }}
            >
              {dict.hero.note}
            </p>
          </div>

          {/* Right: rotating spotlight carousel */}
          <div className="anim-visual-float hidden sm:block relative">
            {featured.length > 0 && (
              <SpotlightCarousel
                products={featured.slice(0, 6).map((p) => mapProduct(p))}
                dict={dict}
                prefix={prefix}
              />
            )}
          </div>
        </div>
      </section>

      {/* ================= TRUST BAR ================= */}
      <section className="relative overflow-hidden py-[34px] bg-gradient-to-b from-[var(--surface)] via-[var(--bg-tint)] to-[var(--surface)]">
        <div className="container-page grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🛡️", label: dict.trustBar.quality },
            { icon: "🚚", label: dict.trustBar.shipping },
            { icon: "↩️", label: dict.trustBar.returns },
            { icon: "💬", label: dict.trustBar.support },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 70}>
              <div className="flex items-center justify-center gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-[20px] px-4 py-4 shadow-[0_10px_30px_rgba(20,45,90,0.05)] card-hover">
                <span className="w-11 h-11 rounded-[15px] bg-gradient-to-br from-[var(--soft-2)] to-[var(--success-soft-2)] flex items-center justify-center text-[20px]">
                  {item.icon}
                </span>
                <span className="font-[950] text-[14px] text-[var(--text)]">{item.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="why"
        className="relative overflow-hidden py-[78px] max-sm:py-[58px] scroll-mt-[76px] bg-gradient-to-b from-[var(--surface)] via-[var(--bg-tint)] to-[var(--surface)]"
      >
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_430px] gap-7 items-end mb-[38px]">
            <div>
              <Reveal>
                <span className="kicker-pill">{dict.features.kicker}</span>
                <h2 className="mt-3 text-[clamp(26px,3vw,42px)] max-sm:text-[28px] leading-[1.35] tracking-[-0.9px] font-[1000] text-[var(--text)]">
                  {dict.features.title}
                </h2>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <p className="text-[15.5px] leading-[1.92] text-[var(--text-2)] font-[650]">
                {dict.features.subtitle}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[15px]">
            {dict.features.cards.map((card, i) => (
              <Reveal key={card.title} delay={i * 90}>
                <div className="h-full bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 shadow-[0_12px_36px_rgba(20,45,90,0.07)] card-hover">
                  <span className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[var(--soft-2)] to-[var(--success-soft-2)] flex items-center justify-center text-[22px]">
                    {card.icon}
                  </span>
                  <h3 className="mt-4 text-[18.5px] leading-[1.55] font-[1000] text-[var(--text)]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.92] text-[var(--text-7)] font-[650]">
                    {card.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section
        id="categories"
        className="relative overflow-hidden py-[78px] max-sm:py-[58px] scroll-mt-[76px] section-bg-light"
        style={{
          background:
            "radial-gradient(circle_at_12%_18%,rgba(var(--teal-rgb),0.105),transparent_30%), radial-gradient(circle_at_90%_30%,rgba(var(--primary-rgb),0.075),transparent_26%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
        }}
      >
        <div className="container-page">
          <div className="text-center max-w-[640px] mx-auto mb-[38px]">
            <Reveal>
              <span className="kicker-pill">{dict.categories.kicker}</span>
              <h2 className="mt-3 text-[clamp(26px,3vw,42px)] max-sm:text-[28px] leading-[1.35] tracking-[-0.9px] font-[1000] text-[var(--text)]">
                {dict.categories.title}
              </h2>
              <p className="mt-3 text-[15.5px] leading-[1.92] text-[var(--text-2)] font-[650]">
                {dict.categories.subtitle}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[15px]">
            {cats.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 80}>
                <Link
                  href={`${prefix}/category/${cat.slug}`}
                  className="group flex flex-col items-center justify-center text-center gap-4 bg-[var(--glass-90)] border border-[var(--line)] rounded-[28px] p-7 min-h-[150px] backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_58px_rgba(24,54,100,0.12)] hover:border-[var(--line-10)]"
                >
                  <span className="w-[52px] h-[52px] rounded-[17px] bg-gradient-to-br from-[var(--primary)] to-[var(--teal)] flex items-center justify-center text-white text-[24px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.28)] group-hover:scale-110 transition-transform duration-300">
                    {cat.image ? (
                      <Image src={cat.image} alt="" width={28} height={28} className="w-7 h-7 object-contain" />
                    ) : (
                      "🎯"
                    )}
                  </span>
                  <span>
                    <span className="block font-[1000] text-[16.5px] text-[var(--text)]">
                      {cat.name}
                    </span>
                    {cat.children.length > 0 && (
                      <span className="mt-1.5 block text-[12px] font-[800] text-[var(--muted)]">
                        {cat.children.map((c) => c.name).join(" · ")}
                      </span>
                    )}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}
      <section
        id="products"
        className="relative overflow-hidden py-[78px] max-sm:py-[58px] scroll-mt-[76px]"
        style={{
          background:
            "radial-gradient(circle at 86% 8%, rgba(var(--primary-rgb),0.06), transparent 30%), linear-gradient(180deg,var(--white),var(--bg-tint))",
        }}
      >
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_430px] gap-7 items-end mb-[38px]">
            <div>
              <Reveal>
                <span className="kicker-pill">{dict.products.kicker}</span>
                <h2 className="mt-3 text-[clamp(26px,3vw,42px)] max-sm:text-[28px] leading-[1.35] tracking-[-0.9px] font-[1000] text-[var(--text)]">
                  {dict.products.title}
                </h2>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[15.5px] leading-[1.92] text-[var(--text-2)] font-[650]">
                  {dict.products.subtitle}
                </p>
                <Link
                  href={`${prefix}/products`}
                  className="shrink-0 btn-secondary px-[16px] py-[10px] text-[13px]"
                >
                  {dict.products.viewAll}
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <ProductGrid products={featured.map((p) => mapProduct(p))} locale={locale} dict={dict} />
          </Reveal>
        </div>
      </section>

      {/* ================= LATEST FROM THE WEB ================= */}
      {rssPosts.length > 0 && (
        <section className="relative overflow-hidden py-[78px] max-sm:py-[58px]"
          style={{
            background:
              "radial-gradient(circle at 86% 8%, rgba(var(--teal-rgb),0.06), transparent 30%), linear-gradient(180deg,var(--white),var(--bg-tint))",
          }}
        >
          <div className="container-page">
            <div className="mb-[38px]">
              <Reveal>
                <span className="kicker-pill">{dict.blog.fromTheWeb}</span>
                <h2 className="mt-3 text-[clamp(26px,3vw,42px)] max-sm:text-[28px] leading-[1.35] tracking-[-0.9px] font-[1000] text-[var(--text)]">
                  {dict.blog.latestArticle}
                </h2>
                <Link
                  href={`${prefix}/blog`}
                  className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-[13px] font-[950] text-[var(--text)] shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 transition-all"
                >
                  {dict.blog.viewAllArticles}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                </Link>
              </Reveal>
            </div>
            <Reveal>
              {rssPosts.length > 0 && (() => {
                const featured = rssPosts[0];
                const ft = featured.translations[0];
                return (
                  <Link
                    key={featured.id}
                    href={`${prefix}/blog/${featured.slug}`}
                    className="group block bg-[var(--surface)] border border-[var(--line)] rounded-[28px] overflow-hidden hover:shadow-[0_22px_60px_rgba(20,45,90,0.12)] hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div className="grid md:grid-cols-[1.1fr_1fr] gap-0">
                      <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden product-img-bg">
                        <Image
                          src={featured.coverImage ?? ""}
                          alt={ft?.title ?? featured.slug}
                          fill
                          sizes="(max-width:1024px) 100vw, 50vw"
                          width={1200}
                          height={630}
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                        <span className="absolute top-4 right-4 bg-[var(--teal-soft)] text-[var(--teal)] border border-[var(--teal-soft-3)] rounded-full px-3.5 py-1.5 text-[11.5px] font-[950] shadow-sm">
                          {dict.blog.fromTheWeb}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center p-7 md:p-9 max-sm:p-6">
                        <h3 className="text-[clamp(18px,2.4vw,26px)] leading-[1.5] font-[1000] text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                          {ft?.title ?? featured.slug}
                        </h3>
                        {ft?.excerpt && (
                          <p className="mt-3 text-[14px] leading-[2] font-[700] text-[var(--muted)] line-clamp-3">
                            {ft.excerpt}
                          </p>
                        )}
                        <div className="mt-4 flex items-center gap-2 flex-wrap text-[12.5px] font-[800] text-[var(--muted-4)]">
                          {featured.sourceSiteName && (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-[var(--teal-soft)] text-[var(--teal)] text-[10px] font-[1000]">
                                {featured.sourceSiteName[0]?.toUpperCase() || "W"}
                              </span>
                              {featured.sourceSiteName}
                            </span>
                          )}
                          {featured.sourceSiteName && featured.publishedAt && <span className="opacity-50">·</span>}
                          {featured.publishedAt && (
                            <time dateTime={featured.publishedAt.toISOString()}>{formatDate(featured.publishedAt, locale)}</time>
                          )}
                          {featured.publishedAt && featured.readingTime && <span className="opacity-50">·</span>}
                          {featured.readingTime && (
                            <span>{featured.readingTime} {dict.blog.minRead}</span>
                          )}
                        </div>
                        <div className="mt-5">
                          <span className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-br from-[var(--primary)] to-[var(--sky)] text-white px-5 py-2.5 text-[13px] font-[950] shadow-[0_8px_24px_rgba(52,84,209,0.25)] transition-all group-hover:shadow-[0_12px_32px_rgba(52,84,209,0.35)] group-hover:-translate-y-0.5">
                            {dict.blog.readMore}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </Reveal>
          </div>
        </section>
      )}

      {/* ================= COLLECTORS GUIDE (GEO) ================= */}
      <GeoGuide dict={dict} />

      {/* ================= CTA ================= */}
      <GuestOnly>
        <section id="start" className="relative overflow-hidden py-[78px] max-sm:py-[58px] scroll-mt-[76px]"
        style={{
          background:
            "radial-gradient(circle at 68% 38%, rgba(var(--primary-rgb),0.075), transparent 38%), radial-gradient(circle at 28% 68%, rgba(var(--teal-rgb),0.09), transparent 34%), linear-gradient(135deg, var(--bg-tint) 0%, var(--bg-tint) 42%, var(--bg-tint) 100%)",
        }}
      >
        <div className="container-page">
          <Reveal>
            <div
              className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center rounded-[36px] p-10 max-sm:p-7 text-white shadow-[0_22px_70px_rgba(27,54,115,0.14)]"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, rgba(var(--teal-rgb),0.28), transparent 35%), linear-gradient(135deg, var(--text), var(--primary-2))",
              }}
            >
              <div>
                <p className="text-[rgba(255,255,255,0.85)] font-[950] text-[13.5px]">
                  {dict.cta.eyebrow}
                </p>
                <h2 className="mt-2 text-[clamp(24px,2.9vw,40px)] leading-[1.3] font-[1000]">
                  {dict.cta.title}
                </h2>
                <p className="mt-3 text-[rgba(255,255,255,0.8)] font-[700] text-[15px] leading-[1.9] max-w-[460px]">
                  {dict.cta.subtitle}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {dict.cta.chips.map((chip) => (
                    <span key={chip} className="bg-[rgba(255,255,255,0.12)] rounded-full px-3.5 py-2 text-[12.5px] font-[900]">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex md:justify-end">
                <a
                  href={`${prefix}/auth`}
                  className="inline-flex items-center gap-2 bg-[var(--surface)] text-[var(--text)] px-[28px] py-[14px] rounded-full font-[1000] shadow-[0_12px_34px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(255,255,255,0.3)]"
                >
                  {dict.cta.button}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
        </section>
      </GuestOnly>
    </>
  );
}
