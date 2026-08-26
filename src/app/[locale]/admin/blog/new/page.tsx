import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata } from "@/lib/seo";
import BlogPostForm from "@/components/admin/BlogPostForm";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  return buildMetadata({ title: dict.admin.blog.new, path: `/${locale}/admin/blog/new`, locale });
}

export default async function NewBlogPostPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  return (
    <div>
      <h2 className="text-[clamp(18px,2.5vw,24px)] font-[1000] text-[var(--text)] mb-6">
        + {dict.admin.blog.new}
      </h2>
      <BlogPostForm
        isEdit={false}
        dict={dict.admin.blog}
        prefix={prefix}
      />
    </div>
  );
}
