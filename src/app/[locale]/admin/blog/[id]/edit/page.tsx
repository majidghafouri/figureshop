import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata } from "@/lib/seo";
import prisma from "@/lib/db";
import BlogPostForm from "@/components/admin/BlogPostForm";

export async function generateMetadata({ params }: { params: { locale: string; id: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  return buildMetadata({ title: dict.admin.blog.edit, path: `/${locale}/admin/blog/${params.id}/edit`, locale });
}

export default async function EditBlogPostPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
    include: { translations: true },
  });
  if (!post) notFound();

  const initial = {
    slug: post.slug,
    coverImage: post.coverImage,
    category: post.category ?? "",
    readingTime: post.readingTime ?? 3,
    isPublished: post.isPublished,
    isTrending: post.isTrending,
    sourceType: post.sourceType,
    translations: post.translations.map((t) => ({
      locale: t.locale,
      tag: t.tag ?? "",
      title: t.title,
      excerpt: t.excerpt ?? "",
      body: t.body,
    })),
  };

  return (
    <div>
      <h2 className="text-[clamp(18px,2.5vw,24px)] font-[1000] text-[var(--text)] mb-6">
        ✏️ {dict.admin.blog.edit}
      </h2>
      <BlogPostForm
        isEdit={true}
        dict={dict.admin.blog}
        prefix={prefix}
        postId={post.id}
        initial={initial}
      />
    </div>
  );
}
