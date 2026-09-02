"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductItem } from "@/lib/shop";
import { Dictionary } from "@/lib/i18n-dictionaries";

const ROTATE_MS = 5000;
const FLIP_MS = 800;

export default function SpotlightCarousel({
  products,
  dict,
  prefix,
}: {
  products: ProductItem[];
  dict: Dictionary;
  prefix: string;
}) {
  const count = products.length;
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const prevRef = useRef(0);

  useEffect(() => {
    prevRef.current = active;
  }, [active]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      setBusy(true);
      setActive((prev) => (prev + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  useEffect(() => {
    if (!busy) return;
    const id = setTimeout(() => setBusy(false), FLIP_MS);
    return () => clearTimeout(id);
  }, [busy]);

  const jumpTo = (i: number) => {
    if (i === active) return;
    setBusy(true);
    setActive(i);
  };

  return (
    <div
      className="relative bg-[var(--glass-92)] border border-[var(--line-7)] rounded-[34px] p-5 max-w-[520px] mx-auto"
      style={{ boxShadow: "0 22px 70px rgba(27,54,115,0.14)" }}
    >
      <div className="grid [perspective:1600px]">
        {products.map((product, i) => {
          const isFront = i === active;
          const turning =
            busy && (i === active || i === prevRef.current);
          return (
            <div
              key={product.id}
              className="[grid-area:1/1]"
              style={{
                transform: `rotateY(${isFront ? 0 : 180}deg)`,
                transitionProperty: "transform",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                transitionDuration: turning ? `${FLIP_MS}ms` : "0ms",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                pointerEvents: isFront ? "auto" : "none",
              }}
            >
              {/* header */}
              <div
                className="text-white rounded-[24px] p-[15px_17px] flex items-center justify-between"
                style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--teal))" }}
              >
                <div>
                  <p className="font-[950] text-[14.5px]">Figureforge</p>
                  <p className="text-[rgba(255,255,255,0.85)] font-[750] text-[12px] mt-0.5">
                    {dict.products.inStock} · {dict.products.detail.guarantee}
                  </p>
                </div>
                <span className="w-10 h-10 bg-white/17 border border-white/22 rounded-[15px] flex items-center justify-center text-[19px]">
                  🎁
                </span>
              </div>

              {/* product image */}
              <div className="mt-4 relative rounded-[24px] overflow-hidden product-img-bg aspect-square border border-[var(--line-5)] shadow-[0_14px_40px_rgba(24,54,100,0.12)]">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    title={product.name}
                    fill
                    sizes="(max-width:640px) 80vw, (max-width:1024px) 50vw, 30vw"
                    priority={i === 0}
                    width={600}
                    height={600}
                    className="object-cover"
                  />
                ) : null}
                <span className="absolute top-3 rtl:left-3 ltr:right-3 bg-[var(--success-soft)] text-[var(--success)] rounded-full text-[11px] font-[950] px-2.5 py-1">
                  Original
                </span>
              </div>

              {/* product info + stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-[var(--surface)] border border-[var(--line-5)] rounded-[18px] p-[12px] text-center">
                  <p className="text-[10.5px] font-[850] text-[var(--muted-5)]">{dict.common.search}</p>
                  <p className="text-[13px] font-[1000] text-[var(--text)] mt-1">500+</p>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--line-5)] rounded-[18px] p-[12px] text-center">
                  <p className="text-[10.5px] font-[850] text-[var(--muted-5)]">{dict.products.detail.fastDelivery}</p>
                  <p className="text-[13px] font-[1000] text-[var(--text)] mt-1">{dict.trustBar.shipping}</p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`${prefix}/products/${product.slug}`}
                className="mt-4 flex items-center justify-between w-full text-white rounded-[18px] p-[13px_16px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))", boxShadow: "0 14px 34px rgba(var(--primary-rgb),0.28)" }}
              >
                <span className="font-[950] text-[14px] truncate">{product.name}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180 shrink-0"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => jumpTo(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 26 : 8,
                background:
                  i === active
                    ? "linear-gradient(135deg,var(--primary),var(--teal))"
                    : "var(--line-stronger)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
