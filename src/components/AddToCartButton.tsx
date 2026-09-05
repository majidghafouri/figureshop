"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export default function AddToCartButton({
  productId,
  stock,
  label,
  addedLabel,
  variant = "solid",
  quantity = 1,
  className = "",
  disabled = false,
}: {
  productId: string;
  stock: number;
  label: string;
  addedLabel: string;
  variant?: "solid" | "outline" | "full";
  quantity?: number;
  className?: string;
  disabled?: boolean;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const outOfStock = stock <= 0;
  const blocked = disabled || outOfStock;

  const base =
    variant === "full"
      ? "w-full inline-flex items-center justify-center gap-2 rounded-[16px] font-[950] transition-all duration-300 py-3.5 text-[15px]"
      : "inline-flex items-center justify-center gap-2 rounded-full font-[950] transition-all duration-300";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (blocked || busy) return;
    setBusy(true);
    const ok = await addToCart(productId, quantity);
    setBusy(false);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  if (blocked) {
    return (
      <button
        type="button"
        disabled
        className={`${base} bg-[var(--neutral-soft)] text-[var(--muted-3)] cursor-not-allowed ${className}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8h12l-1.2 11.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 8zM9 10V6a3 3 0 0 1 6 0v4"/></svg>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`${base} ${
        variant === "outline"
          ? "border border-[var(--line-2)] bg-[var(--surface)] text-[var(--primary)] hover:border-[var(--line-stronger)] hover:shadow-[0_14px_42px_rgba(27,54,115,0.1)] hover:-translate-y-0.5"
          : "text-white hover:-translate-y-0.5"
      } ${variant === "solid" ? "shadow-[0_14px_34px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_18px_42px_rgba(var(--primary-rgb),0.33)]" : ""} ${className}`}
      style={
        variant === "solid" || variant === "full"
          ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--sky))" }
          : undefined
      }
    >
      {busy ? (
        <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
      ) : added ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" /></svg>
          {addedLabel}
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8h12l-1.2 11.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 8zM9 10V6a3 3 0 0 1 6 0v4"/></svg>
          {label}
        </>
      )}
    </button>
  );
}
