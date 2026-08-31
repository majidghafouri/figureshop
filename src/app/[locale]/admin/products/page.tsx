import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import prisma from "@/lib/db";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import FavoriteColumn from "@/components/admin/FavoriteColumn";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const prefix = localePrefix(locale);
  const dict = getDictionary(locale);
  const p = dict.admin.products;

  const products = await prisma.product.findMany({
    include: {
      translations: { where: { locale } },
      category: { include: { translations: { where: { locale } } } },
      favorites: {
        select: {
          createdAt: true,
          user: { select: { name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-[18px] font-[1000] text-[var(--text)]">{p.title} ({products.length})</h2>
        <Link
          href={`${prefix}/admin/products/new`}
          className="rounded-[14px] text-white font-[950] px-5 py-2.5 text-[13px] shadow-[0_10px_26px_rgba(var(--primary-rgb),0.25)] transition-all hover:-translate-y-0.5"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          + {p.new}
        </Link>
      </div>

      <div className="mt-4 bg-[var(--surface)] border border-[var(--line)] rounded-[18px] overflow-x-auto">
        <table className="w-full text-[13px] min-w-[860px]">
          <thead>
            <tr className="text-right border-b border-[var(--surface-3)] text-[var(--muted)] font-[900]">
              <th className="px-4 py-3">{p.product}</th>
              <th className="px-4 py-3">{p.category}</th>
              <th className="px-4 py-3">{p.brand}</th>
              <th className="px-4 py-3">{p.price}</th>
              <th className="px-4 py-3">{p.stock}</th>
              <th className="px-4 py-3">{p.favorites}</th>
              <th className="px-4 py-3">{p.active}</th>
              <th className="px-4 py-3">{p.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-3)]">
            {products.map((prod) => (
              <tr key={prod.id} className="font-[850] text-[var(--text-3)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-[44px] h-[44px] rounded-[10px] overflow-hidden product-img-bg border border-[var(--soft-line)] shrink-0">
                      {prod.images[0] && (
                        <Image
                          src={prod.images[0]}
                          alt=""
                          fill
                          sizes="44px"
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-[950] text-[var(--text)] line-clamp-1">{prod.translations[0]?.name ?? prod.slug}</p>
                      <p className="text-[11px] font-[850] text-[var(--muted)]" dir="ltr">{prod.slug}</p>
                      {prod.musicUrl && (
                        <p className="text-[11px] font-[850] text-[var(--primary)] truncate" dir="ltr">
                          ♫ {prod.musicTitle ?? prod.musicUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{prod.category?.translations[0]?.name ?? "—"}</td>
                <td className="px-4 py-3">{prod.brand ?? "—"}</td>
                <td className="px-4 py-3" dir="ltr">
                  {prod.price.toLocaleString("en-US")}
                  {prod.compareAtPrice && (
                    <span className="block text-[11px] text-[var(--muted-4)] line-through">{prod.compareAtPrice.toLocaleString("en-US")}</span>
                  )}
                  {prod.hasDiscount && prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                    <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10.5px] font-[950] bg-[var(--danger-soft)] text-[var(--danger)]">
                      {Math.round(((prod.compareAtPrice - prod.price) / prod.compareAtPrice) * 100)}% OFF
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-[950] ${prod.stock > 0 ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--neutral-soft)] text-[var(--muted-3)]"}`}>
                    {prod.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FavoriteColumn
                    users={prod.favorites}
                    dict={{
                      favorites: p.favorites,
                      noFavorites: p.noFavorites,
                      favoritesList: p.favoritesList,
                      close: p.close,
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-[950] ${prod.isActive ? "bg-[var(--soft)] text-[var(--primary)]" : "bg-[var(--neutral-soft)] text-[var(--muted-3)]"}`}>
                    {prod.isActive ? p.yes : p.no}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`${prefix}/admin/products/${prod.id}/edit`} className="text-[12px] font-[950] text-[var(--primary)] hover:underline">
                      {p.edit}
                    </Link>
                    <DeleteProductButton id={prod.id} name={prod.translations[0]?.name ?? prod.slug} dict={{ label: p.delete, confirm: p.deleteConfirm }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
