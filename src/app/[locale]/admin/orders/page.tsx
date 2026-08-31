import { notFound } from "next/navigation";
import Image from "next/image";
import { Locale, isLocale, localePrefix } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import prisma from "@/lib/db";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrderStatusFilter from "@/components/admin/OrderStatusFilter";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const p = dict.admin.orders;
  const statuses = dict.account.statuses;
  const prefix = localePrefix(locale);

  const raw = searchParams.status;
  const selectedStatuses = (typeof raw === "string" ? raw.split(",") : [])
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is (typeof ORDER_STATUSES)[number] =>
      (ORDER_STATUSES as readonly string[]).includes(s)
    );

  const [orders, statusGroups] = await Promise.all([
    prisma.order.findMany({
      where: selectedStatuses.length ? { status: { in: selectedStatuses } } : undefined,
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));

  return (
    <div>
      <h2 className="text-[18px] font-[1000] text-[var(--text)]">{p.title} ({orders.length})</h2>

      <div className="mt-3">
        <OrderStatusFilter
          basePath={`${prefix}/admin/orders`}
          selected={selectedStatuses}
          counts={counts}
          labels={statuses}
          allLabel={p.filterAll}
        />
      </div>

      <div className="mt-4 space-y-3.5">
        {orders.length === 0 ? (
          <p className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-6 text-[13.5px] font-[850] text-[var(--muted)]">
            {p.noOrders}
          </p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[15px] font-[1000] text-[var(--primary)]" dir="ltr">#{o.orderNumber}</span>
                  <span className="text-[12.5px] font-[850] text-[var(--text-2)]" dir="ltr">{o.user.email}</span>
                  <span className="text-[12px] font-[850] text-[var(--muted)]">
                    {new Date(o.createdAt).toLocaleString(locale === "en" ? "en-US" : "fa-IR")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-[1000] text-[var(--text)]" dir="ltr">
                    {o.total.toLocaleString("en-US")} T
                  </span>
                  <OrderStatusSelect orderId={o.id} status={o.status} statuses={statuses} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {o.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 bg-[var(--surface-2)] border border-[var(--soft-line)] rounded-[12px] p-2.5">
                    <div className="w-[38px] h-[38px] rounded-[8px] overflow-hidden product-img-bg shrink-0">
                      {item.product.images[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt=""
                          fill
                          sizes="38px"
                          width={38}
                          height={38}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-[950] text-[var(--text)] line-clamp-1" dir="ltr">{item.product.slug}</p>
                      <p className="text-[11px] font-[850] text-[var(--muted)]" dir="ltr">× {item.quantity} · {item.unitPrice.toLocaleString("en-US")}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[12.5px] font-[850] text-[var(--text-2)]">
                <span dir="ltr">{o.fullName}</span> · <span dir="ltr">{o.address}</span>
                {o.note && <span className="text-[var(--muted)]"> · 📝 {o.note}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
