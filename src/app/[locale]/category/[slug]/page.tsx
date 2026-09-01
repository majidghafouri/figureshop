import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import prisma from "@/lib/db";
import { queryProducts, getProductBrands } from "@/lib/product-query";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import { trackEvent } from "@/lib/analytics";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const prefix = localePrefix(locale);
  const cat = await prisma.category.findFirst({
    where: { slug: params.slug, isActive: true },
    include: { translations: { where: { locale } } },
  });
  if (!cat) return { title: "Not Found" };
  const name = cat.translations[0]?.name ?? cat.slug;
  const description = cat.translations[0]?.name ?? "";
  return buildMetadata({
    title: name,
    description,
    path: `${prefix}/category/${cat.slug}`,
    locale,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { locale: string; slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const cat = await prisma.category.findFirst({
    where: { slug: params.slug, isActive: true },
    include: { translations: { where: { locale } } },
  });
  if (!cat) notFound();
  const name = cat.translations[0]?.name ?? cat.slug;

  await trackEvent({
    type: "CATEGORY_VIEW",
    categorySlug: cat.slug,
    path: `${prefix}/category/${cat.slug}`,
    locale,
  });

  const sp = searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const result = await queryProducts({
    locale,
    category: params.slug,
    brands: (get("brands") ?? "").split(",").filter(Boolean),
    minPrice: get("min") ? Number(get("min")) : undefined,
    maxPrice: get("max") ? Number(get("max")) : undefined,
    inStock: get("inStock") === "1",
    discounted: get("discount") === "1",
    search: get("search"),
    sort: get("sort") ?? "newest",
    page: get("page") ? Number(get("page")) : 1,
    perPage: 24,
  });

  const [brands] = await Promise.all([getProductBrands()]);

  const sortOptions = [
    { value: "newest", label: dict.products.sort.newest },
    { value: "popular", label: dict.products.sort.popular },
    { value: "price_asc", label: dict.products.sort.cheapest },
    { value: "price_desc", label: dict.products.sort.mostExpensive },
    { value: "discount", label: dict.products.sort.discount },
  ];

  const pageLinks: (number | "…")[] = [];
  for (let i = 1; i <= result.pages; i++) {
    if (i === 1 || i === result.pages || Math.abs(i - result.page) <= 1) {
      if (pageLinks.length && pageLinks[pageLinks.length - 1] !== "…" && i - (pageLinks[pageLinks.length - 1] as number) > 1) {
        pageLinks.push("…");
      }
      pageLinks.push(i);
    }
  }

  const mkPageHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k === "page") return;
      if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
      else if (v) params.set(k, v);
    });
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_12%_8%,rgba(var(--teal-rgb),0.10),transparent_30%), radial-gradient(circle_at_92%_12%,rgba(var(--primary-rgb),0.08),transparent_26%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.nav.allProducts, url: `${prefix}/products` },
        { name: name, url: "" },
      ], locale))} />
      <div className="container-page">
        <nav className="flex items-center gap-2 text-[12.5px] font-[800] text-[var(--muted)]">
          <Link href={`${prefix}/`} className="hover:text-[var(--primary)] transition-colors">{dict.nav.home}</Link>
          <span>/</span>
          <Link href={`${prefix}/products`} className="hover:text-[var(--primary)] transition-colors">{dict.nav.allProducts}</Link>
          <span>/</span>
          <span className="text-[var(--primary)]">{name}</span>
        </nav>

        {/* category hero */}
        <div className="mt-6 rounded-[28px] overflow-hidden relative border border-[var(--line)]">
          {cat.image ? (
            <Image
              src={cat.image}
              alt={name}
              fill
              sizes="100vw"
              width={1200}
              height={400}
              className="absolute inset-0 w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(120deg,var(--primary),var(--sky))" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-[var(--navy)]/80 via-[var(--navy)]/50 to-transparent" />
          <div className="relative p-10 max-sm:p-6 min-h-[180px] flex flex-col justify-center">
            <h1 className="text-[clamp(28px,4vw,44px)] font-[1000] text-white leading-[1.3]">{name}</h1>
            <p className="mt-2 text-[13.5px] font-[800] text-white/80">
              {result.total} {dict.products.kicker}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-[20px] items-start">
          <ProductFilters
            dict={dict}
            brands={brands}
            sort={get("sort") ?? "newest"}
            sortOptions={sortOptions}
          />

          <div>
            {result.products.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[28px] p-14 text-center">
                <div className="text-[44px]">🔍</div>
                <h2 className="mt-3 text-[17px] font-[1000] text-[var(--text)]">{dict.products.filters.noResults}</h2>
                <p className="mt-1.5 text-[13.5px] font-[750] text-[var(--muted)]">{dict.products.filters.noResultsDesc}</p>
              </div>
            ) : (
              <>
                <Reveal>
                  <ProductGrid products={result.products} locale={locale} dict={dict} />
                </Reveal>

                {result.pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {result.page > 1 && (
                      <Link href={mkPageHref(result.page - 1)} className="w-10 h-10 rounded-full border border-[var(--line-2)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-3)] font-[900] hover:border-[var(--line-strong)] hover:text-[var(--primary)] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="rtl:rotate-180"><path d="m9 6 6 6-6 6" /></svg>
                      </Link>
                    )}
                    {pageLinks.map((p, i) =>
                      p === "…" ? (
                        <span key={`e${i}`} className="text-[var(--muted-2)] font-[900] px-1">…</span>
                      ) : (
                        <Link
                          key={p}
                          href={mkPageHref(p)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-[13.5px] font-[950] transition-colors ${
                            p === result.page
                              ? "text-white shadow-[0_10px_26px_rgba(var(--primary-rgb),0.3)]"
                              : "border border-[var(--line-2)] bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--primary)] hover:border-[var(--line-strong)]"
                          }`}
                          style={p === result.page ? { backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" } : undefined}
                        >
                          {p}
                        </Link>
                      )
                    )}
                    {result.page < result.pages && (
                      <Link href={mkPageHref(result.page + 1)} className="w-10 h-10 rounded-full border border-[var(--line-2)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-3)] font-[900] hover:border-[var(--line-strong)] hover:text-[var(--primary)] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="rtl:rotate-180"><path d="m15 6-6 6 6 6" /></svg>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
