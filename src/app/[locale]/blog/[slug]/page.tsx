import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale, formatDate } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata, buildArticleJsonLd, buildBreadcrumbJsonLd, buildAuthorJsonLd, SITE_URL } from "@/lib/seo";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import BlogBody from "@/components/BlogBody";
import Reactions from "@/components/Reactions";
import Comments from "@/components/Comments";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import TableOfContents from "@/components/TableOfContents";
import { extractHeadings } from "@/lib/toc";

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const prefix = localePrefix(locale);
  const post = await getPostBySlug(locale, params.slug);
  if (!post) return { title: "Not Found" };
  const image = post.coverImage;
  return buildMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    path: `${prefix}/blog/${post.slug}`,
    locale,
    type: "article",
    images: image ? [image] : undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const post = await getPostBySlug(locale, params.slug);
  if (!post) notFound();

  const related = await getRelatedPosts(locale, post.slug, 3);
  
  const tocHeadings = extractHeadings(post.body);

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_90%_6%,rgba(var(--primary-rgb),0.07),transparent_30%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      {post.coverImage && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt=""
            className="w-full h-full object-cover scale-125 blur-[64px] opacity-40"
            style={{
              maskImage: "linear-gradient(to bottom, black 5%, transparent 92%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 5%, transparent 92%)",
            }}
          />
        </div>
      )}
      <JsonLd data={JSON.parse(buildArticleJsonLd({
        title: post.title,
        description: post.excerpt || "",
        image: post.coverImage || "",
        datePublished: post.publishedAt?.toISOString() ?? new Date().toISOString(),
        dateModified: post.publishedAt?.toISOString() ?? new Date().toISOString(),
        author: "Figureforge",
        authorUrl: `${SITE_URL}/about`,
        locale,
      }))} />
      <JsonLd data={JSON.parse(buildAuthorJsonLd({
        name: "Figureforge",
        url: `${SITE_URL}/about`,
        jobTitle: "Content Author",
        sameAs: [
          "https://instagram.com/figureforge",
          "https://twitter.com/figureforge",
          "https://www.linkedin.com/company/figureforge",
        ],
      }))} />
      <JsonLd data={JSON.parse(buildBreadcrumbJsonLd([
        { name: dict.nav.home, url: prefix },
        { name: dict.nav.blog, url: `${prefix}/blog` },
        { name: post.title, url: "" },
      ], locale))} />
      <div className="container-page max-w-[820px] relative z-10">
        <nav className="flex flex-wrap items-center gap-2 text-[12.5px] font-[800] text-[var(--muted)]">
          <Link href={`${prefix}/`} className="hover:text-[var(--primary)] transition-colors">{dict.nav.home}</Link>
          <span>/</span>
          <Link href={`${prefix}/blog`} className="hover:text-[var(--primary)] transition-colors">{dict.nav.blog}</Link>
          <span>/</span>
          <span className="text-[var(--primary)] line-clamp-1">{post.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8 mt-6">
          <div>
            <Reveal>
              <article className="mt-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {post.sourceType === "RSS" && (
                    <span className="bg-[var(--teal-soft)] text-[var(--teal)] border border-[var(--teal-soft-3)] rounded-full px-3 py-1 text-[11.5px] font-[950]">
                      {dict.blog.fromTheWeb}
                    </span>
                  )}
                  {post.tag && (
                    <span className="bg-[var(--soft)] text-[var(--primary)] border border-[var(--line-4)] rounded-full px-3 py-1 text-[11.5px] font-[950]">
                      {post.tag}
                    </span>
                  )}
                  {post.isTrending && (
                    <span className="bg-gradient-to-br from-[var(--teal-2)] to-[var(--primary)] text-white text-[11.5px] font-[950] rounded-full px-3 py-1">
                      {dict.blog.trending}
                    </span>
                  )}
                  {post.readingTime ? (
                    <span className="text-[12px] font-[800] text-[var(--muted-3)]">
                      {post.readingTime} {dict.blog.minRead}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 text-[clamp(24px,3.4vw,40px)] leading-[1.45] font-[1000] text-[var(--text)]">
                  {post.title}
                </h1>

                <div className="mt-4 flex items-center gap-2 text-[13px] font-[800] text-[var(--muted-4)]">
                  {post.sourceType === "RSS" && post.sourceUrl ? (
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--teal-soft)] text-[var(--teal)] text-[13px] font-[1000]">
                        {post.sourceSiteName?.[0]?.toUpperCase() || "W"}
                      </span>
                      <span className="font-[950] text-[var(--text-2)]">{post.sourceAuthor || post.sourceSiteName || dict.blog.sourceArticle}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></svg>
                    </a>
                  ) : (
                    <>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--soft)] text-[var(--primary)] text-[13px] font-[1000]">
                        F
                      </span>
                      <span className="font-[950] text-[var(--text-2)]">Figureforge</span>
                    </>
                  )}
                  {post.publishedAt && (
                    <>
                      <span className="opacity-60">•</span>
                      <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt, locale)}</time>
                    </>
                  )}
                </div>

                {post.coverImage && (
                  <figure className="relative mt-6 rounded-[24px] overflow-hidden border border-[var(--soft-line)] shadow-[0_16px_40px_rgba(20,45,90,0.10)] aspect-[16/10]">
                    <Image src={post.coverImage} alt={post.title} fill sizes="(max-width:1024px) 100vw, 820px" width={1200} height={630} className="object-cover" />
                    <figcaption className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-medium">
                      {post.title}
                    </figcaption>
                  </figure>
                )}

                {post.excerpt && (
                  <p className="mt-7 text-[16px] leading-[2] font-[850] text-[var(--primary)]">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-7">
                  <BlogBody body={post.body} />
                </div>

                <div className="mt-9">
                  <Reactions targetType="ARTICLE" targetId={post.id} dict={dict.reactions} />
                </div>

                <Comments
                  targetType="ARTICLE"
                  targetId={post.id}
                  isLoggedIn={false}
                  userId={undefined}
                  dict={dict.products.detail.comments}
                />

                <Link
                  href={`${prefix}/blog`}
                  className="mt-10 inline-flex items-center gap-2 rounded-[14px] border border-[var(--line-2)] bg-[var(--surface)] px-5 py-3 text-[13.5px] font-[950] text-[var(--primary)] hover:bg-[var(--soft)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
                  {dict.blog.backToBlog}
                </Link>
              </article>
            </Reveal>
          </div>

          {tocHeadings.length > 0 && (
            <aside className="hidden lg:block">
              <TableOfContents headings={tocHeadings} tocTitle={dict.blog.tocTitle} />
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-[64px] border-t border-[var(--line-4)] pt-[40px]">
            <h2 className="text-[clamp(20px,2.4vw,26px)] font-[1000] text-[var(--text)] mb-[24px]">
              {dict.blog.related}
            </h2>
            <Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`${prefix}/blog/${r.slug}`}
                    className="group bg-[var(--surface)] border border-[var(--line)] rounded-[18px] overflow-hidden hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(20,45,90,0.10)] transition-all duration-300"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden product-img-bg">
                      <Image
                        src={r.coverImage ?? ""}
                        alt={r.title}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                        width={400}
                        height={225}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[13.5px] leading-[1.7] font-[950] text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
