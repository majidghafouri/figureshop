import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale, formatDate } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import { getSessionUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  return buildMetadata({
    title: dict.blog.title,
    description: dict.blog.subtitle,
    path: `${localePrefix(locale)}/blog`,
    locale,
  });
}

export default async function BlogPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const posts = await getPublishedPosts(locale, 50);
  const sessionUser = await getSessionUser();

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_12%_8%,rgba(var(--teal-rgb),0.10),transparent_30%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.blog.kicker, url: "" },
      ], locale))} />
      <div className="container-page">
        <div className="text-center">
          <span className="inline-block bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-4 py-1.5 text-[12px] font-[950]">
            {dict.blog.kicker}
          </span>
          <h1 className="mt-4 text-[clamp(28px,4vw,44px)] font-[1000] text-[var(--text)]">{dict.blog.title}</h1>
          <p className="mt-2 text-[14px] font-[750] text-[var(--muted)]">{dict.blog.subtitle}</p>
        </div>

        <Reveal>
          {posts.length === 0 ? (
            <div className="mt-16 text-center text-[15px] font-[800] text-[var(--muted)]">
              {dict.blog.empty}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-[var(--surface)] border border-[var(--line)] rounded-[24px] overflow-hidden hover:shadow-[0_18px_48px_rgba(20,45,90,0.10)] hover:-translate-y-1 transition-all duration-300"
                >
                  <Link href={`${prefix}/blog/${post.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden product-img-bg">
                      <Image
                        src={post.coverImage ?? ""}
                        alt={post.title}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      {post.isTrending && (
                        <span className="absolute top-3 right-3 bg-gradient-to-br from-[var(--teal-2)] to-[var(--primary)] text-white text-[11px] font-[950] rounded-full px-3 py-1 shadow-lg">
                          {dict.blog.trending}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.sourceType === "RSS" && (
                          <span className="bg-[var(--teal-soft)] text-[var(--teal)] border border-[var(--teal-soft-3)] rounded-full px-3 py-1 text-[11px] font-[950]">
                            {dict.blog.fromTheWeb}
                          </span>
                        )}
                        {post.tag && (
                          <span className="bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-3 py-1 text-[11px] font-[950]">
                            {post.tag}
                          </span>
                        )}
                        {post.readingTime ? (
                          <span className="text-[11.5px] font-[800] text-[var(--muted-3)]">
                            {post.readingTime} {dict.blog.minRead}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-[16.5px] leading-[1.7] font-[1000] text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="mt-2 text-[13.5px] leading-[1.9] font-[750] text-[var(--muted)] line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-[950] text-[var(--primary)]">
                          {dict.blog.readMore}
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                        </span>
                        {post.publishedAt && (
                          <span className="text-[12px] font-[800] text-[var(--muted-4)]">
                            {formatDate(post.publishedAt, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </Reveal>

        {!sessionUser && (
          <div className="mt-12 text-center">
            <Link
              href={`${prefix}/products`}
              className="inline-flex rounded-[16px] text-white font-[950] px-8 py-4 text-[15px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-0.5 transition-all duration-300"
              style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
            >
              {dict.cta.button}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
