import { Metadata } from "next";
import { locales, localePrefix, Locale } from "@/lib/i18n";
import { Dictionary } from "@/lib/i18n-dictionaries";

export const SITE_NAME = "فیگرفورج | Figureforge";

export function siteNameFor(locale?: Locale): string {
  switch (locale) {
    case "en":
      return "Figureforge";
    case "ar":
      return "فيجرفورج";
    default:
      return "فیگرفورج";
  }
}
export const SITE_URL = process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export interface SeoOptions {
  title?: string;
  description?: string;
  path?: string;
  locale?: Locale;
  dict?: Dictionary;
  images?: string[];
  noindex?: boolean;
  type?: "website" | "article";
  authors?: string[];
  keywords?: string[];
}

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

function localizedUrl(path: string, locale: Locale): string {
  const prefix = localePrefix(locale);
  if (path === "/" || path === "") return prefix ? `${SITE_URL}${prefix}` : SITE_URL;
  return `${SITE_URL}${prefix}${path}`;
}

export function buildHreflangAlternates(
  path: string,
  locale?: Locale,
): { canonical: string; languages: Record<string, string> } {
  const resolved = locale || "fa";
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const code = loc === "fa" ? "fa" : loc === "en" ? "en-US" : "ar";
    languages[code] = localizedUrl(path, loc as Locale);
  }
  languages["x-default"] = localizedUrl(path, "fa");
  return {
    canonical: localizedUrl(path, resolved),
    languages,
  };
}

export function buildMetadata(opts: SeoOptions): Metadata {
  const {
    title,
    description,
    path = "",
    locale: loc,
    dict,
    images,
    noindex = false,
    type = "website",
    authors,
    keywords,
  } = opts;

  const resolvedLocale = loc || "fa";
  const resolvedTitle = title;
  const resolvedDescription = description;

  const url = path ? `${SITE_URL}${path}` : SITE_URL;

  const ogImages: OgImage[] = (images || []).map((img) => ({
    url: img.startsWith("http") ? img : `${SITE_URL}${img}`,
    width: 1200,
    height: 630,
    alt: resolvedTitle || SITE_NAME,
  }));

  if (!ogImages.length) {
    ogImages.push({
      url: `${SITE_URL}/logo.svg`,
      width: 1200,
      height: 630,
      alt: resolvedTitle || SITE_NAME,
    });
  }

  const { canonical, languages } = buildHreflangAlternates(path, resolvedLocale);
  const metadata: Metadata = {
    title: {
      default: resolvedTitle || (dict?.meta?.title ?? siteNameFor(resolvedLocale)),
      template: `%s — ${siteNameFor(resolvedLocale)}`,
    },
    description: resolvedDescription || dict?.meta?.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: resolvedTitle || (dict?.meta?.title ?? siteNameFor(resolvedLocale)),
      description: resolvedDescription || dict?.meta?.description,
      type,
      url,
      siteName: siteNameFor(resolvedLocale),
      locale: resolvedLocale === "fa" ? "fa_IR" : resolvedLocale === "ar" ? "ar" : "en_US",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle || (dict?.meta?.title ?? SITE_NAME),
      description: resolvedDescription || dict?.meta?.description,
      images: ogImages.map((i) => i.url),
    },
  };

  if (keywords && keywords.length > 0) {
    metadata.keywords = keywords;
  }

  if (authors && authors.length > 0) {
    metadata.authors = authors.map((a) => ({ name: a }));
  }

  if (noindex) {
    metadata.robots = { index: false, follow: false };
  } else {
    metadata.robots = {
      index: true,
      follow: true,
      "max-image-preview": "large",
    } as Metadata["robots"];
  }

  return metadata;
}

export function buildOrganizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "فیگرفورج | Figureforge",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-icon.svg`,
    description: "فیگرفورج — فروشگاه تخصصی فیگور و اکشن فیگور اورجینال | Figureforge — Original Figure & Action Figure Store",
    areaServed: ["IR", "AE", "SA"],
    sameAs: [
      "https://instagram.com/figureforge",
      "https://twitter.com/figureforge",
      "https://www.linkedin.com/company/figureforge",
      "https://www.wikidata.org/wiki/Q12345678",
      "https://en.wikipedia.org/wiki/Figureforge",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+98-21-9100-5599",
        email: "info@figureforge.ir",
        contactType: "customer service",
        availableLanguage: ["fa", "en", "ar"],
      },
    ],
    brand: {
      "@type": "Brand",
      name: "فیگرفورج",
      logo: `${SITE_URL}/logo-icon.svg`,
    },
  });
}

export function buildWebsiteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "فیگرفورج | Figureforge",
    url: SITE_URL,
    inLanguage: "fa",
  });
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[], locale: Locale = "fa"): string {
  const localeBase = localePrefix(locale);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${localeBase}${item.url}`,
    })),
  });
}

export function buildProductJsonLd(opts: {
  name: string;
  description: string;
  image: string;
  brand: string | null;
  sku: string | null;
  offers: {
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  locale?: Locale;
}): string {
  const product: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    image: opts.image.startsWith("http") ? opts.image : `${SITE_URL}${opts.image}`,
    brand: opts.brand ? { "@type": "Brand", name: opts.brand } : undefined,
    sku: opts.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: opts.offers.priceCurrency,
      price: opts.offers.price,
      availability: opts.offers.availability,
      url: `${SITE_URL}${opts.offers.url}`,
      seller: {
        "@type": "Organization",
        name: "فیگرفورج | Figureforge",
      },
    },
  };
  if (opts.aggregateRating) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: opts.aggregateRating.ratingValue,
      reviewCount: opts.aggregateRating.reviewCount,
    };
  }
  return JSON.stringify(product);
}

export function buildArticleJsonLd(opts: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
  authorUrl?: string;
  locale?: Locale;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    image: opts.image.startsWith("http") ? opts.image : `${SITE_URL}${opts.image}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      "@type": "Person",
      name: opts.author,
      url: opts.authorUrl || `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "فیگرفورج | Figureforge",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-icon.svg`,
      },
    },
  });
}

export function buildAuthorJsonLd(opts: {
  name: string;
  url?: string;
  sameAs?: string[];
  jobTitle?: string;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    url: opts.url || `${SITE_URL}/about`,
    jobTitle: opts.jobTitle || "Content Author",
    worksFor: {
      "@type": "Organization",
      name: "فیگرفورج | Figureforge",
      url: SITE_URL,
    },
    ...(opts.sameAs && opts.sameAs.length > 0 ? { sameAs: opts.sameAs } : {}),
  });
}

export function buildFaqJsonLd(items: { q: string; a: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  });
}
