import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale, formatDate } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata } from "@/lib/seo";
import prisma from "@/lib/db";
import DeleteBlogPostButton from "@/components/admin/DeleteBlogPostButton";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  return buildMetadata({ title: dict.admin.blog.title, path: `/${locale}/admin/blog`, locale });
}

export default async function AdminBlogPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const posts = await prisma.blogPost.findMany({
    include: {
      translations: {
        where: { locale },
        select: { title: true, tag: true },
        take: 1,
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-[clamp(18px,2.5vw,24px)] font-[1000] text-[var(--text)]">
          📝 {dict.admin.blog.title}
        </h2>
        <Link
          href={`${prefix}/admin/blog/new`}
          className="px-5 py-2.5 rounded-[14px] text-white text-[13px] font-[950] shadow-lg hover:-translate-y-0.5 transition-all"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          + {dict.admin.blog.new}
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="mt-16 text-center text-[15px] font-[800] text-[var(--muted)]">
          {dict.admin.blog.noArticles}
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {posts.map((post) => {
            const title = post.translations[0]?.title ?? post.slug;
            return (
              <div
                key={post.id}
                className="flex items-center gap-4 bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-4 hover:shadow-md transition-shadow"
              >
                {post.coverImage && (
                  <div className="w-[80px] h-[50px] rounded-[10px] overflow-hidden flex-shrink-0 bg-[var(--soft)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`${prefix}/admin/blog/${post.id}/edit`}
                      className="text-[14px] font-[950] text-[var(--text)] hover:text-[var(--primary)] transition-colors line-clamp-1"
                    >
                      {title}
                    </Link>
                    {post.isPublished ? (
                      <span className="text-[10px] font-[950] px-2 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                        {dict.admin.blog.published}
                      </span>
                    ) : (
                      <span className="text-[10px] font-[950] px-2 py-0.5 rounded-full bg-[var(--soft)] text-[var(--muted)]">
                        {dict.admin.blog.draft}
                      </span>
                    )}
                    {post.isTrending && (
                      <span className="text-[10px] font-[950] px-2 py-0.5 rounded-full bg-gradient-to-br from-[var(--teal-2)] to-[var(--primary)] text-white">
                        {dict.admin.blog.trending}
                      </span>
                    )}
                    {post.translations[0]?.tag && (
                      <span className="text-[10px] font-[950] px-2 py-0.5 rounded-full bg-[var(--soft)] text-[var(--primary)]">
                        {post.translations[0].tag}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11.5px] font-[800] text-[var(--muted-3)]">
                    <span className="font-mono text-[var(--muted-4)]">{post.slug}</span>
                    <span>•</span>
                    <span>{post.sourceType}</span>
                    {post.publishedAt && (
                      <>
                        <span>•</span>
                        <span>{formatDate(post.publishedAt, locale)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.isPublished && (
                    <Link
                      href={`${prefix}/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-[10px] text-[11.5px] font-[900] text-[var(--primary)] bg-[var(--soft)] hover:bg-[var(--soft-2)] transition-colors"
                    >
                      {dict.admin.blog.viewLive} ↗
                    </Link>
                  )}
                  <Link
                    href={`${prefix}/admin/blog/${post.id}/edit`}
                    className="px-3 py-1.5 rounded-[10px] text-[11.5px] font-[900] text-[var(--primary)] bg-[var(--soft)] hover:bg-[var(--soft-2)] transition-colors"
                  >
                    {dict.admin.blog.editLabel}
                  </Link>
                  <DeleteBlogPostButton id={post.id} title={title} dict={dict.admin.blog} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
