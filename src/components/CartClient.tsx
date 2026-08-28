"use client";

import Link from "next/link";
import Image from "next/image";
import { Dictionary } from "@/lib/i18n-dictionaries";
import { useCart } from "@/components/CartProvider";

export default function CartClient({
  dict,
  prefix,
}: {
  dict: Dictionary;
  prefix: string;
}) {
  const { items, subtotal, loading, updateQuantity, removeItem } = useCart();

  const savings = items.reduce((s, i) => {
    if (i.product.compareAtPrice && i.product.compareAtPrice > i.product.price) {
      return s + (i.product.compareAtPrice - i.product.price) * i.quantity;
    }
    return s;
  }, 0);

  const total = subtotal;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--muted)] font-[850]">
        {dict.common.loading}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[28px] p-16 text-center">
        <div className="text-[52px]">🛒</div>
        <h1 className="mt-4 text-[22px] font-[1000] text-[var(--text)]">{dict.cart.empty}</h1>
        <p className="mt-2 text-[14px] font-[750] text-[var(--muted)]">{dict.cart.emptyDesc}</p>
        <Link
          href={`${prefix}/products`}
          className="inline-flex mt-6 rounded-[16px] text-white font-[950] px-7 py-3.5 text-[14.5px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-0.5 transition-all duration-300"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          {dict.cart.goShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-[20px] items-start">
      {/* items */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-5 shadow-[0_12px_36px_rgba(20,45,90,0.06)]">
        <h1 className="px-2 pb-4 border-b border-[var(--surface-3)] text-[clamp(20px,2.4vw,26px)] font-[1000] text-[var(--text)]">
          {dict.cart.title}{" "}
          <span className="text-[13.5px] font-[900] text-[var(--muted)]">
            ({items.reduce((s, i) => s + i.quantity, 0)})
          </span>
        </h1>

        <div className="mt-2 divide-y divide-[var(--surface-3)]">
          {items.map((item) => (
            <div key={item.id} className="py-5 flex gap-4 items-center">
              <Link
                href={`${prefix}/products/${item.product.slug}`}
                className="shrink-0 w-[84px] h-[84px] rounded-[16px] overflow-hidden border border-[var(--soft-line)] product-img-bg relative block"
              >
                {item.product.images[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} fill sizes="84px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--line-6)]">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="4" width="10" height="16" rx="2.5"/></svg>
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`${prefix}/products/${item.product.slug}`}
                  className="block text-[14.5px] font-[950] text-[var(--text)] hover:text-[var(--primary)] transition-colors line-clamp-1"
                >
                  {item.product.name}
                </Link>
                {item.product.brand && (
                  <span className="mt-0.5 inline-block text-[11.5px] font-[850] text-[var(--muted)]">
                    {item.product.brand}
                  </span>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[14.5px] font-[1000] text-[var(--primary)]" dir="ltr">
                    {item.product.price.toLocaleString("en-US")} {dict.common.currency}
                  </span>
                  {item.product.compareAtPrice && item.product.compareAtPrice > item.product.price && (
                    <span className="text-[12px] font-[800] text-[var(--muted-4)] line-through">
                      {item.product.compareAtPrice.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center border border-[var(--line-2)] rounded-full">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-9 h-9 rounded-full text-[var(--primary)] font-[1000] text-[15px] hover:bg-[var(--soft)] transition-colors"
                  >
                    +
                  </button>
                  <span className="w-8 text-center font-[1000] text-[var(--text)] text-[13.5px]">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-9 h-9 rounded-full text-[var(--primary)] font-[1000] text-[15px] hover:bg-[var(--soft)] transition-colors"
                  >
                    −
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-[11.5px] font-[900] text-[var(--danger)] hover:underline"
                >
                  {dict.cart.remove}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[var(--surface-3)]">
          <Link href={`${prefix}/products`} className="text-[13px] font-[950] text-[var(--primary)] hover:underline">
            ← {dict.cart.continueShopping}
          </Link>
        </div>
      </div>

      {/* summary */}
      <div className="lg:sticky lg:top-[96px] bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-6 shadow-[0_12px_36px_rgba(20,45,90,0.06)]">
        <h2 className="text-[17px] font-[1000] text-[var(--text)]">{dict.cart.summary}</h2>
        <div className="mt-5 space-y-3 text-[13.5px] font-[850]">
          <div className="flex items-center justify-between text-[var(--text-2)]">
            <span>{dict.cart.subtotal}</span>
            <span className="text-[var(--text)]" dir="ltr">{subtotal.toLocaleString("en-US")} {dict.common.currency}</span>
          </div>
          {savings > 0 && (
            <div className="flex items-center justify-between text-[var(--teal-2)]">
              <span>{dict.cart.discount}</span>
              <span dir="ltr">− {savings.toLocaleString("en-US")} {dict.common.currency}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[var(--text-2)]">
            <span>{dict.cart.shipping}</span>
            <span className="text-[var(--teal-2)] font-[950]">{dict.cart.shippingFree}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--surface-3)] flex items-center justify-between">
          <span className="text-[14px] font-[1000] text-[var(--text)]">{dict.cart.total}</span>
          <span className="text-[20px] font-[1000] text-[var(--primary)]" dir="ltr">
            {total.toLocaleString("en-US")} {dict.common.currency}
          </span>
        </div>
        <Link
          href={`${prefix}/checkout`}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-[16px] text-white font-[950] py-4 text-[15px] shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] hover:-translate-y-0.5 transition-all duration-300"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          {dict.cart.checkout}
        </Link>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11.5px] font-[850] text-[var(--muted)]">
          <span>🔒</span>
          {dict.products.detail.secureOrder}
        </div>
      </div>
    </div>
  );
}
