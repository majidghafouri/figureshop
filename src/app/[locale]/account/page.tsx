import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { buildMetadata } from "@/lib/seo";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { cancelExpiredOrders, getPaymentDeadline } from "@/lib/orders";
import LogoutButton from "@/components/LogoutButton";
import ProfileForm from "@/components/ProfileForm";
import SocialAccountsManager from "@/components/SocialAccountsManager";
import CancelOrderButton from "@/components/CancelOrderButton";
import PayOrderButton from "@/components/PayOrderButton";
import ReorderOrderButton from "@/components/ReorderOrderButton";
import MiniCountdown from "@/components/MiniCountdown";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? (params.locale as Locale) : "fa";
  const dict = getDictionary(locale);
  return buildMetadata({
    title: dict.account.title,
    description: dict.account.welcome,
    path: `${localePrefix(locale)}/account`,
    locale,
    noindex: true,
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--warning-soft)] text-[var(--warning-text)] border-[var(--warning-soft-2)]",
  PAID: "bg-[var(--soft)] text-[var(--sky)] border-[var(--line-4)]",
  PROCESSING: "bg-[var(--soft)] text-[var(--primary)] border-[var(--line-4)]",
  SHIPPED: "bg-[var(--soft)] text-[var(--primary)] border-[var(--line-4)]",
  DELIVERED: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-soft-3)]",
  CANCELLED: "bg-[var(--neutral-soft)] text-[var(--muted-3)] border-[var(--neutral-line)]",
};

export default async function AccountPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const prefix = localePrefix(locale);

  const user = await getSessionUser();
  if (!user) redirect(`${prefix}/auth?next=${encodeURIComponent(`${prefix}/account`)}`);

  await cancelExpiredOrders();

  const [socialAccounts] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { userId: user.id },
      select: { id: true, provider: true, name: true, email: true, avatar: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: { product: { include: { translations: { where: { locale } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="relative overflow-hidden py-[40px] max-sm:py-[28px]"
      style={{
        background:
          "radial-gradient(circle_at_12%_8%,rgba(var(--teal-rgb),0.10),transparent_30%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <div className="container-page">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[clamp(24px,3vw,34px)] font-[1000] text-[var(--text)]">
              {dict.account.welcome} 👋
            </h1>
            <p className="mt-1.5 text-[13.5px] font-[850] text-[var(--muted)]" dir="ltr">
              {dict.account.email}: {user.email}
            </p>
          </div>
          <LogoutButton dict={dict} prefix={prefix} />
        </div>

        <div className="mt-8">
          <h2 className="text-[18px] font-[1000] text-[var(--text)]">{dict.account.myOrders}</h2>

          <ProfileForm
            dict={dict}
            user={{
              name: user.name,
              phone: user.phone,
              email: user.email,
              emailVerified: user.emailVerified,
              phoneVerified: user.phoneVerified,
            }}
          />

          <SocialAccountsManager
            dict={dict.account}
            accounts={socialAccounts}
            user={{ name: user.name, email: user.email, phone: user.phone }}
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`${prefix}/terms`}
              className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(20,45,90,0.08)]"
            >
              <span className="w-[42px] h-[42px] shrink-0 rounded-[12px] product-img-bg border border-[var(--soft-line)] flex items-center justify-center text-[20px]">
                📜
              </span>
              <span>
                <span className="block text-[13.5px] font-[1000] text-[var(--text)]">
                  {dict.account.terms}
                </span>
                <span className="block mt-0.5 text-[11.5px] font-[800] text-[var(--muted)]">
                  {dict.account.termsHint}
                </span>
              </span>
            </a>
            <a
              href={`${prefix}/faq`}
              className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(20,45,90,0.08)]"
            >
              <span className="w-[42px] h-[42px] shrink-0 rounded-[12px] product-img-bg border border-[var(--soft-line)] flex items-center justify-center text-[20px]">
                💡
              </span>
              <span>
                <span className="block text-[13.5px] font-[1000] text-[var(--text)]">
                  {dict.faq.title}
                </span>
                <span className="block mt-0.5 text-[11.5px] font-[800] text-[var(--muted)]">
                  {dict.faq.kicker}
                </span>
              </span>
            </a>
          </div>

          {orders.length === 0 ? (
            <div className="mt-4 bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-14 text-center">
              <div className="text-[44px]">📦</div>
              <p className="mt-3 text-[15px] font-[900] text-[var(--muted)]">{dict.account.noOrders}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {orders.map((order) => {
                const isPending = order.status === "PENDING";
                const isCancelled = order.status === "CANCELLED";
                const deadline = getPaymentDeadline(order);
                const remainingMs = deadline.getTime() - now;
                const showDeadline = isPending && !order.paidAt && remainingMs > 0;
                return (
                <div key={order.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 shadow-[0_12px_36px_rgba(20,45,90,0.05)]">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[15px] font-[1000] text-[var(--primary)]" dir="ltr">#{order.orderNumber}</span>
                      <span
                        className={`border rounded-full px-3 py-1 text-[11.5px] font-[950] ${STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING}`}
                      >
                        {dict.account.statuses[order.status as keyof typeof dict.account.statuses] ?? order.status}
                      </span>
                      <span className="text-[12px] font-[850] text-[var(--muted)]">
                        {showDeadline ? (
                          <MiniCountdown
                            deadline={deadline.toISOString()}
                            expiredLabel={dict.account.countdownExpired}
                          />
                        ) : (
                          new Date(order.createdAt).toLocaleDateString(
                            locale === "en" ? "en-US" : "fa-IR"
                          )
                        )}
                      </span>
                    </div>
                    <span className="text-[15px] font-[1000] text-[var(--text)]" dir="ltr">
                      {order.total.toLocaleString("en-US")} {dict.common.currency}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-[var(--surface-2)] border border-[var(--soft-line)] rounded-[14px] p-3">
                        <div className="w-[46px] h-[46px] rounded-[10px] overflow-hidden product-img-bg border border-[var(--soft-line)] shrink-0">
                          {item.product.images[0] && (
                            <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-[950] text-[var(--text)] line-clamp-1">{item.product.translations?.[0]?.name ?? ""}</p>
                          <p className="text-[11px] font-[850] text-[var(--muted)]" dir="ltr">× {item.quantity} · {item.unitPrice.toLocaleString("en-US")}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3 flex-wrap">
                    {isPending && !order.paidAt && (
                      <PayOrderButton
                        orderId={order.id}
                        prefix={prefix}
                        dict={{
                          pay: dict.account.pay,
                          paying: dict.account.paying,
                          payFailed: dict.account.payFailed,
                        }}
                      />
                    )}
                    {isPending && (
                      <CancelOrderButton
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                        dict={{
                          cancel: dict.account.cancel,
                          canceling: dict.account.canceling,
                          cancelConfirm: dict.account.cancelConfirm,
                          cancelSuccess: dict.account.cancelSuccess,
                          cancelFailed: dict.account.cancelFailed,
                          cancelLimit: dict.account.cancelLimit,
                          cancelLimitGeneric: dict.account.cancelLimitGeneric,
                        }}
                      />
                    )}
                    {isCancelled && (
                      <ReorderOrderButton
                        orderId={order.id}
                        prefix={prefix}
                        dict={{
                          reorder: dict.account.reorder,
                          reordering: dict.account.reordering,
                          reorderFailed: dict.account.reorderFailed,
                          reorderPartial: dict.account.reorderPartial,
                        }}
                      />
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
