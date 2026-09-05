"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dictionary } from "@/lib/i18n-dictionaries";
import { useCart } from "@/components/CartProvider";

export default function PurchasePanel({
  productId,
  stock,
  deactivated,
  deactivatedLabel,
  dict,
  checkoutHref,
}: {
  productId: string;
  stock: number;
  deactivated: boolean;
  deactivatedLabel: string;
  dict: Dictionary;
  checkoutHref: string;
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const outOfStock = stock <= 0;
  const blocked = deactivated || outOfStock;

  const inc = () => setQty((q) => Math.min(q + 1, Math.max(1, stock)));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const handleAdd = async () => {
    if (blocked) return;
    setBusy(true);
    await addToCart(productId, qty);
    setBusy(false);
    router.refresh();
  };

  const handleBuyNow = async () => {
    if (blocked) return;
    setBusy(true);
    await addToCart(productId, qty);
    setBusy(false);
    router.push(checkoutHref);
  };

  if (deactivated) {
    return (
      <div className="flex items-center gap-2.5 justify-center rounded-[18px] border border-dashed border-[var(--warning-soft-3)] bg-[var(--warning-soft)] px-5 py-4 text-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning-strong)" strokeWidth="2" strokeLinecap="round"><path d="M18.4 6.6A9 9 0 1 0 20 12M22 22 2 2m13.5-1.5 1.5 1.5m0-3v2"/></svg>
        <span className="text-[13.5px] font-[950] text-[var(--warning-strong)]">{deactivatedLabel}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-[950] text-[var(--text-2)]">{dict.products.detail.quantity}:</span>
        <div className="flex items-center border border-[var(--line-2)] rounded-full bg-[var(--surface)]">
          <button type="button" onClick={inc} disabled={outOfStock} className="w-10 h-10 rounded-full text-[var(--primary)] font-[1000] text-[17px] hover:bg-[var(--soft)] transition-colors disabled:opacity-40">
            +
          </button>
          <span className="w-10 text-center font-[1000] text-[var(--text)]">{qty}</span>
          <button type="button" onClick={dec} disabled={outOfStock} className="w-10 h-10 rounded-full text-[var(--primary)] font-[1000] text-[17px] hover:bg-[var(--soft)] transition-colors disabled:opacity-40">
            −
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={busy || outOfStock}
          className="w-full flex items-center justify-center gap-2 rounded-[18px] text-white font-[950] py-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)]"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8h12l-1.2 11.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 8zM9 10V6a3 3 0 0 1 6 0v4"/></svg>
          {dict.products.detail.addToCart}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={busy || outOfStock}
          className="w-full flex items-center justify-center gap-2 rounded-[18px] font-[950] py-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 border border-[var(--line-2)] bg-[var(--surface)] text-[var(--primary)] hover:border-[var(--line-stronger)] hover:shadow-[0_14px_42px_rgba(27,54,115,0.1)]"
        >
          {dict.products.detail.buyNow}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
