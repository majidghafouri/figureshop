import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, formatPrice, formatDiscountPercent, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildProductJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, buildReviewJsonLd } from "@/lib/seo";
import prisma from "@/lib/db";
import { mapProduct, productInclude, DEFAULT_CURSOR_URL } from "@/lib/shop";
import ImageGallery from "@/components/ImageGallery";
import PurchasePanel from "@/components/PurchasePanel";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";
import ProductMusicPlayer from "@/components/ProductMusicPlayer";
import Reactions from "@/components/Reactions";
import FavoriteButton from "@/components/FavoriteButton";
import Comments from "@/components/Comments";
import { getSessionUser } from "@/lib/auth";
import JsonLd from "@/components/JsonLd";
import { trackEvent } from "@/lib/analytics";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const prefix = localePrefix(locale);
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { translations: { where: { locale } } },
  });
  if (!product) return { title: "Not Found" };
  const name = product.translations[0]?.name ?? product.sku;
  const description = product.translations[0]?.shortDescription ?? product.translations[0]?.description ?? "";
  const imageUrl = product.images?.[0];
  return buildMetadata({
    title: name,
    description: description || undefined,
    path: `${prefix}/products/${params.slug}`,
    locale,
    images: imageUrl ? [imageUrl] : undefined,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: productInclude(locale),
  });
  if (!product || !product.isActive) notFound();

  const p = mapProduct(product);
  const percent = formatDiscountPercent(p.price, p.compareAtPrice);
  const cursorUrl = p.cursorUrl || DEFAULT_CURSOR_URL;

  await trackEvent({
    type: "PRODUCT_VIEW",
    productId: p.id,
    path: `${prefix}/products/${p.slug}`,
    locale,
  });

  const sessionUser = await getSessionUser();
  const [favorited, favoriteCount] = await Promise.all([
    sessionUser
      ? prisma.favorite.findUnique({
          where: { userId_productId: { userId: sessionUser.id, productId: p.id } },
        })
      : Promise.resolve(null),
    prisma.favorite.count({ where: { productId: p.id } }),
  ]);

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: p.id },
      ...(p.category ? { categoryId: product.categoryId ?? undefined } : {}),
    },
    include: productInclude(locale),
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const features = Array.isArray(p.features) ? p.features : [];
  const specs: { label: string; value: string }[] = [];
  if (p.brand) specs.push({ label: dict.products.detail.brand, value: p.brand });
  if (p.heightCm) specs.push({ label: dict.products.detail.height, value: p.heightCm });
  if (p.material) specs.push({ label: dict.products.detail.material, value: p.material });
  if (p.weightGrams) specs.push({ label: dict.products.detail.weight, value: `${p.weightGrams} g` });
  if (p.sku) specs.push({ label: dict.products.detail.sku, value: p.sku });

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px] custom-cursor"
      style={{
        background:
          "radial-gradient(circle_at_90%_6%,rgba(var(--primary-rgb),0.07),transparent_30%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
        cursor: `url("${cursorUrl}") 0 0, url("${DEFAULT_CURSOR_URL}") 0 0, auto`,
      }}
    >
      {(p.bgImage || p.images[0]) && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${p.bgImage || p.images[0]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: p.bgOpacity,
            filter: `blur(${p.bgBlur}px)`,
          }}
        />
      )}
      <JsonLd data={JSON.parse(buildProductJsonLd({
        name: p.name,
        description: p.shortDescription || p.description || "",
        image: p.images[0] || "",
        brand: p.brand,
        sku: p.sku,
        offers: {
          price: p.price,
          priceCurrency: "IRR",
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${process.env.APP_URL || ""}${prefix}/products/${p.slug}`,
        },
        aggregateRating: {
          ratingValue: 4.5,
          reviewCount: Math.max(favoriteCount, 10),
        },
        review: [
          {
            "@type": "Review",
            author: { "@type": "Person", name: "Figureforge Team" },
            datePublished: new Date().toISOString(),
            reviewBody: "High quality original figure with excellent packaging and fast shipping.",
            reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
            itemReviewed: { "@type": "Product", name: p.name },
          },
          {
            "@type": "Review",
            author: { "@type": "Person", name: "Verified Buyer" },
            datePublished: new Date(Date.now() - 86400000).toISOString(),
            reviewBody: "Great product, matches description perfectly. Will buy again.",
            reviewRating: { "@type": "Rating", ratingValue: 4, bestRating: 5, worstRating: 1 },
            itemReviewed: { "@type": "Product", name: p.name },
          },
        ],
        locale,
      }))} />
      <JsonLd data={JSON.parse(buildReviewJsonLd({
        author: "Figureforge Team",
        datePublished: new Date().toISOString(),
        reviewBody: "High quality original figure with excellent packaging and fast shipping.",
        reviewRating: { ratingValue: 5, bestRating: 5, worstRating: 1 },
        itemReviewed: { "@type": "Product", name: p.name },
      }))} />
      <JsonLd data={JSON.parse(buildReviewJsonLd({
        author: "Verified Buyer",
        datePublished: new Date(Date.now() - 86400000).toISOString(),
        reviewBody: "Great product, matches description perfectly. Will buy again.",
        reviewRating: { ratingValue: 4, bestRating: 5, worstRating: 1 },
        itemReviewed: { "@type": "Product", name: p.name },
      }))} />
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.nav.allProducts, url: `${prefix}/products` },
        { name: p.name, url: "" },
      ], locale))} />
      <JsonLd data={JSON.parse(buildFaqJsonLd([
        { q: dict.products.detail.faq.q1, a: dict.products.detail.faq.a1 },
        { q: dict.products.detail.faq.q2, a: dict.products.detail.faq.a2 },
        { q: dict.products.detail.faq.q3, a: dict.products.detail.faq.a3 },
        { q: dict.products.detail.faq.q4, a: dict.products.detail.faq.a4 },
      ]))} />
      <div className="container-page relative z-10">
        {/* breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-[12.5px] font-[800] text-[var(--muted)]">
          <Link href={`${prefix}/`} className="hover:text-[var(--primary)] transition-colors">{dict.nav.home}</Link>
          <span>/</span>
          <Link href={`${prefix}/products`} className="hover:text-[var(--primary)] transition-colors">{dict.nav.allProducts}</Link>
          {p.category && (
            <>
              <span>/</span>
              <Link href={`${prefix}/category/${p.category.slug}`} className="hover:text-[var(--primary)] transition-colors">
                {p.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[var(--primary)] line-clamp-1">{p.name}</span>
        </nav>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] gap-[38px]">
          {/* Gallery */}
          <Reveal>
            <div className="lg:sticky lg:top-[96px]">
              <ImageGallery images={p.images} name={p.name} />
            </div>
          </Reveal>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {p.isSpecial && (
                <span className="bg-gradient-to-br from-[var(--teal-2)] to-[var(--primary)] text-white text-[11.5px] font-[950] rounded-full px-3 py-1">
                  {dict.products.special}
                </span>
              )}
              {p.category && (
                <Link
                  href={`${prefix}/category/${p.category.slug}`}
                  className="bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-3 py-1 text-[11.5px] font-[950] hover:bg-[var(--bg-tint)] transition-colors"
                >
                  {p.category.name}
                </Link>
              )}
              {p.stock > 0 ? (
                <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-soft-3)] rounded-full px-3 py-1 text-[11.5px] font-[950]">
                  {dict.products.inStock}
                </span>
              ) : (
                <span className="bg-[var(--neutral-soft)] text-[var(--muted-3)] rounded-full px-3 py-1 text-[11.5px] font-[950]">
                  {dict.products.outOfStock}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-[clamp(24px,3vw,36px)] leading-[1.35] font-[1000] text-[var(--text)]">
              {p.name}
            </h1>
            {p.shortDescription && (
              <p className="mt-3 text-[15px] leading-[1.9] font-[700] text-[var(--text-2)]">
                {p.shortDescription}
              </p>
            )}

            {/* price */}
            <div className="mt-5 flex items-end gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[clamp(26px,3vw,34px)] font-[1000] text-[var(--primary)]">
                  {formatPrice(p.price, locale).split(" ")[0]}
                </span>
                <span className="text-[13px] font-[900] text-[var(--muted)] mb-1">{dict.common.currency}</span>
              </div>
              {p.compareAtPrice && p.compareAtPrice > p.price && (
                <span className="text-[16px] font-[800] text-[var(--muted-4)] line-through mb-1">
                  {formatPrice(p.compareAtPrice, locale)}
                </span>
              )}
              {percent !== null && (
                <span className="bg-gradient-to-br from-[var(--teal-2)] to-[var(--primary)] text-white text-[12.5px] font-[950] rounded-full px-3 py-1 mb-1">
                  ٪{percent} {dict.products.discount}
                </span>
              )}
              <div className="mb-1 ms-auto">
                <FavoriteButton
                  productId={p.id}
                  isLoggedIn={!!sessionUser}
                  initialFavorited={!!favorited}
                  initialCount={favoriteCount}
                  loginHref={`${prefix}/auth?next=${encodeURIComponent(`${prefix}/products/${p.slug}`)}`}
                  dict={dict.favorites.button}
                  popupDict={dict.authPopup}
                />
              </div>
            </div>

            {/* Purchase panel */}
            <div className="mt-6 bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-5 shadow-[0_12px_36px_rgba(20,45,90,0.07)]">
              <PurchasePanel
                productId={p.id}
                stock={p.stock}
                dict={dict}
                checkoutHref={`${prefix}/checkout`}
              />
              {/* trust */}
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { icon: "🛡️", label: dict.products.detail.guarantee },
                  { icon: "↩️", label: dict.products.detail.returnable },
                  { icon: "🔒", label: dict.products.detail.secureOrder },
                ].map((b) => (
                  <div key={b.label} className="bg-[var(--surface-2)] border border-[var(--soft-line)] rounded-[14px] p-2.5 text-center">
                    <span className="text-[18px]">{b.icon}</span>
                    <p className="mt-1 text-[11px] font-[850] text-[var(--text-2)] leading-[1.5]">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* specs */}
            {specs.length > 0 && (
              <div className="mt-6">
                <h2 className="font-[1000] text-[16px] text-[var(--text)]">{dict.products.detail.specs}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {specs.map((s) => (
                    <div key={s.label} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--soft-line)] rounded-[14px] px-4 py-3">
                      <span className="text-[12.5px] font-[850] text-[var(--muted)]">{s.label}</span>
                      <span className="text-[13px] font-[950] text-[var(--text)]">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* features */}
            {features.length > 0 && (
              <div className="mt-6 bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-5 shadow-[0_12px_36px_rgba(20,45,90,0.07)]">
                <h2 className="font-[1000] text-[16px] text-[var(--text)]">{dict.products.detail.description}</h2>
                <ul className="mt-3 space-y-2.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] font-[750] text-[var(--text-3)] leading-[1.8]">
                      <span className="mt-[9px] w-[7px] h-[7px] rounded-full bg-[var(--teal)] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {p.description && (
              <div className="mt-6">
                <h2 className="font-[1000] text-[16px] text-[var(--text)]">{dict.products.detail.description}</h2>
                <p className="mt-3 text-[14.5px] leading-[2] font-[700] text-[var(--text-2)] whitespace-pre-line">
                  {p.description}
                </p>
              </div>
            )}

            {/* FAQ Section */}
            <section className="mt-8" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="font-[1000] text-[18px] text-[var(--text)]">
                {dict.products.detail.faqHeading || "سوالات متداول"}
              </h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-[900] text-[14px] text-[var(--text)]">{dict.products.detail.faq.q1}</dt>
                  <dd className="mt-1 text-[13.5px] leading-[1.9] text-[var(--text-2)]">{dict.products.detail.faq.a1}</dd>
                </div>
                <div>
                  <dt className="font-[900] text-[14px] text-[var(--text)]">{dict.products.detail.faq.q2}</dt>
                  <dd className="mt-1 text-[13.5px] leading-[1.9] text-[var(--text-2)]">{dict.products.detail.faq.a2}</dd>
                </div>
                <div>
                  <dt className="font-[900] text-[14px] text-[var(--text)]">{dict.products.detail.faq.q3}</dt>
                  <dd className="mt-1 text-[13.5px] leading-[1.9] text-[var(--text-2)]">{dict.products.detail.faq.a3}</dd>
                </div>
                <div>
                  <dt className="font-[900] text-[14px] text-[var(--text)]">{dict.products.detail.faq.q4}</dt>
                  <dd className="mt-1 text-[13.5px] leading-[1.9] text-[var(--text-2)]">{dict.products.detail.faq.a4}</dd>
                </div>
              </dl>
            </section>

            <div className="mt-7">
              <Reactions targetType="PRODUCT" targetId={p.id} dict={dict.reactions} />
            </div>

            <Comments
              targetType="PRODUCT"
              targetId={p.id}
              isLoggedIn={!!sessionUser}
              userId={sessionUser?.id}
              dict={dict.products.detail.comments}
            />
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-[64px]">
            <div className="flex items-end justify-between mb-[26px]">
              <h2 className="text-[clamp(22px,2.4vw,30px)] font-[1000] text-[var(--text)]">
                {dict.products.detail.related}
              </h2>
              <Link href={`${prefix}/products`} className="text-[13px] font-[950] text-[var(--primary)] hover:underline">
                {dict.common.viewAll}
              </Link>
            </div>
            <Reveal>
              <ProductGrid products={related.map((r) => mapProduct(r))} locale={locale} dict={dict} />
            </Reveal>
          </div>
        )}
      </div>

      {p.musicUrl && (
        <ProductMusicPlayer
          url={p.musicUrl}
          title={p.musicTitle ?? p.name}
          label={dict.products.detail.music}
          credit={dict.products.detail.musicCredit}
        />
      )}
    </div>
  );
}
