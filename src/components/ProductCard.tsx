import Link from "next/link";
import Image from "next/image";
import { Locale, localePrefix, formatPrice, formatDiscountPercent } from "@/lib/i18n";
import { Dictionary } from "@/lib/i18n-dictionaries";
import { ProductItem } from "@/lib/shop";
import AddToCartButton from "@/components/AddToCartButton";
import Marquee from "@/components/Marquee";

export default function ProductCard({
  product,
  locale,
  dict,
}: {
  product: ProductItem;
  locale: Locale;
  dict: Dictionary;
}) {
  const prefix = localePrefix(locale);
  const href = `${prefix}/products/${product.slug}`;
  const percent = formatDiscountPercent(product.price, product.compareAtPrice);
  const image = product.images[0];
  const isDiscount = product.hasDiscount || percent !== null;

  return (
    <div className="group relative bg-[var(--surface)] border border-[var(--line)] rounded-[24px] overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_48px_rgba(20,45,90,0.12)] hover:border-[var(--line-9)]">
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden product-img-bg">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              loading="lazy"
              width={400}
              height={400}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--line-6)]">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="4" width="10" height="16" rx="2.5"/><circle cx="12" cy="10" r="1.8"/><path d="M12 11.8v3.2M9.5 15h5"/></svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 rtl:right-3 ltr:left-3 flex flex-col gap-2 items-start">
            {isDiscount && (
              <span className="bg-gradient-to-br from-[var(--teal-2)] to-[var(--primary)] text-white text-[11.5px] font-[950] rounded-full px-2.5 py-1 shadow-[0_8px_20px_rgba(var(--teal-rgb),0.3)]">
                {percent !== null ? `٪${percent}` : dict.products.discount}
              </span>
            )}
            {product.isSpecial && (
              <span className="bg-white/95 border border-[var(--line-2)] text-[var(--primary)] text-[11.5px] font-[950] rounded-full px-2.5 py-1">
                {dict.products.special}
              </span>
            )}
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-[var(--inverse)] text-white text-[12.5px] font-[950] rounded-full px-4 py-2">
                {dict.products.outOfStock}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-1 flex-col">
        {product.brand && (
          <span className="text-[11.5px] font-[950] text-[var(--muted)] tracking-wide">
            {product.brand}
          </span>
        )}
        <Link href={href}>
          <h3 className="mt-1 text-[14.5px] font-[900] leading-[1.6] text-[var(--text)] line-clamp-2 min-h-[46px] hover:text-[var(--primary)] transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16.5px] font-[1000] text-[var(--primary)]">
                {formatPrice(product.price, locale).split(" ")[0]}
              </span>
              <span className="text-[11px] font-[900] text-[var(--muted)]">
                {dict.common.currency}
              </span>
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="text-[12px] font-[800] text-[var(--muted-4)] line-through">
                {formatPrice(product.compareAtPrice, locale)}
              </div>
            )}
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <Marquee
              maxWidth={116}
              className="text-[10.5px] font-[950] text-[var(--warning-strong)] bg-[var(--warning-soft)] border border-[var(--warning-soft-3)] rounded-full px-2 py-0.5"
            >
              {dict.products.lowStock}
            </Marquee>
          )}
        </div>

        <div className="mt-auto pt-3.5">
          <AddToCartButton
            productId={product.id}
            stock={product.stock}
            label={dict.products.addToCart}
            addedLabel={dict.products.addedToCart}
            variant="full"
            className="!rounded-full !py-2.5 !text-[13px]"
          />
        </div>
      </div>
    </div>
  );
}
