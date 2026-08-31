"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [];

  return (
    <div>
      <div className="relative rounded-[28px] overflow-hidden border border-[var(--line)] product-img-bg aspect-square shadow-[0_18px_52px_rgba(20,45,90,0.10)]">
        {list[active] ? (
          <Image
            src={list[active]}
            alt={name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 40vw"
            priority
            width={800}
            height={800}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--line-6)]">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="4" width="10" height="16" rx="2.5"/><circle cx="12" cy="10" r="1.8"/><path d="M12 11.8v3.2M9.5 15h5"/></svg>
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar">
          {list.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 w-[76px] h-[76px] rounded-[16px] overflow-hidden border-2 relative transition-all duration-200 ${
                i === active ? "border-[var(--primary)] shadow-[0_8px_20px_rgba(var(--primary-rgb),0.25)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"
              }`}
            >
              <Image src={img} alt={name} fill sizes="76px" width={76} height={76} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
