import { isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { notFound } from "next/navigation";
import CommentManager from "@/components/admin/CommentManager";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale as "fa" | "en" | "ar");

  return <CommentManager dict={dict.admin.comments} />;
}
