"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dictionary } from "@/lib/i18n-dictionaries";
import { useCart } from "@/components/CartProvider";
import { trackClient } from "@/lib/client-analytics";

export default function CheckoutClient({
  dict,
  prefix,
  isAuthed,
  userName,
  userPhone,
}: {
  dict: Dictionary;
  prefix: string;
  isAuthed: boolean;
  userName?: string;
  userPhone?: string;
}) {
  const router = useRouter();
  const { items, subtotal, loading } = useCart();
  const [form, setForm] = useState({
    fullName: userName ?? "",
    phone: userPhone ?? "",
    address: "",
    postalCode: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("VANDAR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderNumber: number } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<{ couponId: string; discountAmount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const savings = items.reduce((s, i) => {
    if (i.product.compareAtPrice && i.product.compareAtPrice > i.product.price) {
      return s + (i.product.compareAtPrice - i.product.price) * i.quantity;
    }
    return s;
  }, 0);
  const couponDiscount = couponData?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - couponDiscount);

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-[560px] bg-[var(--surface)] border border-[var(--line)] rounded-[28px] p-14 text-center shadow-[0_18px_54px_rgba(20,45,90,0.10)]">
        <div className="text-[52px]">🔐</div>
        <h1 className="mt-4 text-[22px] font-[1000] text-[var(--text)]">{dict.checkout.needLogin}</h1>
        <p className="mt-2 text-[14px] font-[750] text-[var(--muted)]">{dict.checkout.pleaseLogin}</p>
        <Link
          href={`${prefix}/auth?next=${encodeURIComponent(`${prefix}/checkout`)}`}
          className="inline-flex mt-6 rounded-[16px] text-white font-[950] px-8 py-4 text-[15px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-0.5 transition-all duration-300"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          {dict.checkout.loginNow}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-[560px] bg-[var(--surface)] border border-[var(--line)] rounded-[28px] p-14 text-center shadow-[0_18px_54px_rgba(20,45,90,0.10)]">
        <div className="mx-auto w-[72px] h-[72px] rounded-full bg-[var(--success-soft)] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--teal-2)" strokeWidth="2.6"><path d="m4.5 12.5 5 5"/><path d="m10 13.5 3 3"/><path d="m19.5 8.5L10 18l-1-1"/></svg>
        </div>
        <h1 className="mt-5 text-[22px] font-[1000] text-[var(--text)]">{dict.checkout.orderCreated}</h1>
        <p className="mt-2 text-[14px] font-[750] text-[var(--muted)]">{dict.checkout.cashOnDeliveryConfirm}</p>
        <p className="mt-4 text-[13.5px] font-[950] text-[var(--primary)]" dir="ltr">
          #{done.orderNumber}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href={`${prefix}/account`}
            className="rounded-[16px] text-white font-[950] px-6 py-3.5 text-[14px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] transition-all duration-300"
            style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
          >
            {dict.checkout.toAccount}
          </Link>
          <Link
            href={`${prefix}/products`}
            className="rounded-[16px] font-[950] px-6 py-3.5 text-[14px] border border-[var(--line-2)] bg-[var(--surface)] text-[var(--primary)] transition-all duration-300"
          >
            {dict.products.viewAll}
          </Link>
        </div>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponBusy(true);
    setCouponError(null);
    setCouponData(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const json = await res.json();
      if (json.ok) {
        setCouponData({ couponId: json.data.couponId, discountAmount: json.data.discountAmount });
      } else {
        let errMsg = dict.checkout.couponInvalid;
        if (json.error === "coupon_expired") errMsg = dict.checkout.couponExpired;
        else if (json.error === "coupon_not_for_you") errMsg = dict.checkout.couponNotForYou;
        else if (json.error === "coupon_min_order_not_met") errMsg = `${dict.checkout.couponMinOrder}: ${json.minOrderAmount?.toLocaleString("en-US")}`;
        setCouponError(errMsg);
      }
    } catch {
      setCouponError(dict.checkout.couponInvalid);
    } finally {
      setCouponBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError(dict.checkout.fillRequired);
      return;
    }
    setBusy(true);
    trackClient("CHECKOUT_START");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, paymentMethod, couponId: couponData?.couponId ?? null }),
      });
      const json = await res.json();
      if (!json.ok) {
        if (json.error === "empty_cart") setError(dict.cart.empty);
        else if (json.error === "stock_changed") setError(dict.checkout.stockChanged);
        else setError(dict.checkout.fillRequired);
        return;
      }
      const orderId = json.data.order.id;
      router.refresh();
      if (paymentMethod === "VANDAR") {
        router.push(`${prefix}/pay/${orderId}`);
      } else {
        setDone({ orderNumber: json.data.order.orderNumber });
      }
    } catch {
      setError(dict.checkout.fillRequired);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-[20px] items-start">
      <form onSubmit={submit} className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 shadow-[0_12px_36px_rgba(20,45,90,0.06)]">
        <h1 className="text-[clamp(20px,2.4vw,26px)] font-[1000] text-[var(--text)]">{dict.checkout.title}</h1>

        {/* shipping info */}
        <h2 className="mt-6 text-[15px] font-[1000] text-[var(--primary)]">{dict.checkout.shippingInfo}</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="block">
            <span className="text-[12.5px] font-[900] text-[var(--text-2)]">{dict.checkout.fullName} *</span>
            <input value={form.fullName} onChange={set("fullName")} className="mt-1.5 w-full border border-[var(--line-2)] rounded-[14px] px-4 py-3 text-[14.5px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-[900] text-[var(--text-2)]">{dict.checkout.phone} *</span>
            <input value={form.phone} onChange={set("phone")} dir="ltr" className="mt-1.5 w-full border border-[var(--line-2)] rounded-[14px] px-4 py-3 text-[14.5px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[12.5px] font-[900] text-[var(--text-2)]">{dict.checkout.address} *</span>
            <textarea value={form.address} onChange={set("address")} rows={2} className="mt-1.5 w-full border border-[var(--line-2)] rounded-[14px] px-4 py-3 text-[14.5px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all resize-none" />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-[900] text-[var(--text-2)]">{dict.checkout.postalCode}</span>
            <input value={form.postalCode} onChange={set("postalCode")} dir="ltr" className="mt-1.5 w-full border border-[var(--line-2)] rounded-[14px] px-4 py-3 text-[14.5px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-[900] text-[var(--text-2)]">{dict.checkout.note}</span>
            <input value={form.note} onChange={set("note")} className="mt-1.5 w-full border border-[var(--line-2)] rounded-[14px] px-4 py-3 text-[14.5px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" />
          </label>
        </div>

        {/* payment method */}
        <h2 className="mt-7 text-[15px] font-[1000] text-[var(--primary)]">{dict.checkout.paymentMethod}</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: "VANDAR",
              title: dict.checkout.paymentOnline,
              desc: dict.checkout.paymentOnlineDesc,
              icon: "💳",
            },
            {
              id: "CASH_ON_DELIVERY",
              title: dict.checkout.paymentCash,
              desc: dict.checkout.paymentCashDesc,
              icon: "💵",
            },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={`text-right rounded-[16px] border-2 p-4 transition-all duration-200 ${
                paymentMethod === m.id
                  ? "border-[var(--primary)] bg-[var(--bg-tint)]"
                  : "border-[var(--soft-line)] bg-[var(--surface)] hover:border-[var(--line-8)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[22px]">{m.icon}</span>
                <div>
                  <p className="text-[14px] font-[1000] text-[var(--text)]">{m.title}</p>
                  <p className="mt-0.5 text-[11.5px] font-[800] text-[var(--muted)]">{m.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-[13px] font-[850] text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)] rounded-[12px] px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || loading || items.length === 0}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-[16px] text-white font-[950] py-4 text-[15px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all duration-300"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          {busy ? dict.common.loading : dict.checkout.placeOrder}
        </button>
      </form>

      {/* summary */}
      <div className="lg:sticky lg:top-[96px] bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 shadow-[0_12px_36px_rgba(20,45,90,0.06)]">
        <h2 className="text-[17px] font-[1000] text-[var(--text)]">{dict.checkout.orderSummary}</h2>
        <div className="mt-4 space-y-3.5 max-h-[320px] overflow-auto no-scrollbar">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-[52px] h-[52px] rounded-[12px] overflow-hidden border border-[var(--soft-line)] product-img-bg shrink-0 relative">
                {item.product.images[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} fill sizes="52px" className="object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-[950] text-[var(--text)] line-clamp-1">{item.product.name}</p>
                <p className="text-[11.5px] font-[850] text-[var(--muted)]">× {item.quantity}</p>
              </div>
              <span className="text-[13px] font-[950] text-[var(--text)]" dir="ltr">
                {(item.product.price * item.quantity).toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--surface-3)] space-y-2.5 text-[13.5px] font-[850]">
          <div className="flex items-center justify-between text-[var(--text-2)]">
            <span>{dict.cart.subtotal}</span>
            <span dir="ltr">{subtotal.toLocaleString("en-US")} {dict.common.currency}</span>
          </div>
          {savings > 0 && (
            <div className="flex items-center justify-between text-[var(--teal-2)]">
              <span>{dict.cart.discount}</span>
              <span dir="ltr">− {savings.toLocaleString("en-US")} {dict.common.currency}</span>
            </div>
          )}

          {/* Coupon code */}
          {!couponData ? (
            <div className="flex items-center gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={dict.checkout.couponPlaceholder}
                className="flex-1 min-w-0 border border-[var(--line-2)] rounded-[10px] px-3 py-2 text-[12px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] transition-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponBusy || !couponCode.trim()}
                className="shrink-0 rounded-[10px] text-white font-[950] px-3 py-2 text-[12px] disabled:opacity-50"
                style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
              >
                {couponBusy ? dict.checkout.applyingCoupon : dict.checkout.applyCoupon}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[var(--teal-2)]">
              <span>{dict.checkout.couponDiscount}</span>
              <span dir="ltr">− {couponDiscount.toLocaleString("en-US")} {dict.common.currency}</span>
            </div>
          )}
          {couponError && <p className="text-[11px] font-[850] text-[var(--danger)]">{couponError}</p>}
          {couponData && (
            <button type="button" onClick={() => { setCouponData(null); setCouponCode(""); setCouponError(null); }} className="text-[11px] font-[850] text-[var(--muted)] hover:text-[var(--text)]">
              ✕ {couponCode.toUpperCase()}
            </button>
          )}

          <div className="flex items-center justify-between text-[var(--text-2)]">
            <span>{dict.cart.shipping}</span>
            <span className="text-[var(--teal-2)] font-[950]">{dict.cart.shippingFree}</span>
          </div>
        </div>
        <div className="mt-3 pt-4 border-t border-[var(--surface-3)] flex items-center justify-between">
          <span className="text-[14px] font-[1000] text-[var(--text)]">{dict.cart.total}</span>
          <span className="text-[20px] font-[1000] text-[var(--primary)]" dir="ltr">
            {total.toLocaleString("en-US")} {dict.common.currency}
          </span>
        </div>
      </div>
    </div>
  );
}
