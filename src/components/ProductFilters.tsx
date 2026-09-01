"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dictionary } from "@/lib/i18n-dictionaries";
import { trackClient } from "@/lib/client-analytics";

export default function ProductFilters({
  dict,
  brands,
  sort,
  sortOptions,
}: {
  dict: Dictionary;
  brands: { brand: string; count: number }[];
  sort: string;
  sortOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [min, setMin] = useState(searchParams.get("min") ?? "");
  const [max, setMax] = useState(searchParams.get("max") ?? "");

  const selectedBrands = (searchParams.get("brands") ?? "")
    .split(",")
    .filter(Boolean);
  const inStock = searchParams.get("inStock") === "1";
  const discounted = searchParams.get("discount") === "1";

  const buildParams = useCallback(
    (overrides: Record<string, string | null> = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      const apply = (key: string, value: string | null) => {
        if (value) params.set(key, value);
        else params.delete(key);
      };
      Object.entries(overrides).forEach(([k, v]) => apply(k, v));
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const push = useCallback(
    (query: string) => {
      router.push(`?${query}`);
    },
    [router]
  );

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    push(buildParams({ brands: next.length ? next.join(",") : null }));
  };

  const applyPrice = () => {
    push(buildParams({ min: min || null, max: max || null }));
  };

  const applySearch = () => {
    const q = search.trim();
    if (q) trackClient("SEARCH", { query: q });
    push(buildParams({ search: q || null }));
  };

  const clearAll = () => {
    router.push("?");
  };

  const hasActive =
    search || min || max || selectedBrands.length > 0 || inStock || discounted;

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-5 lg:sticky lg:top-[96px]">
      <div className="flex items-center justify-between">
        <h3 className="font-[1000] text-[15px] text-[var(--text)]">{dict.products.filters.title}</h3>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-[900] text-[var(--primary)] hover:underline"
          >
            {dict.products.filters.clear}
          </button>
        )}
      </div>

      {/* search */}
      <div className="mt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          placeholder={dict.products.filters.search}
          className="w-full border border-[var(--line-2)] rounded-[14px] px-3.5 py-2.5 text-[13px] font-[750] text-[var(--text)] outline-none focus:border-[var(--line-strong)] transition-colors placeholder:text-[var(--muted-2)]"
        />
      </div>

      {/* brands */}
      <div className="mt-5">
        <div className="text-[12.5px] font-[950] text-[var(--text-2)]">{dict.products.filters.brand}</div>
        <div className="mt-2.5 space-y-1.5 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
          {brands.map((b) => {
            const checked = selectedBrands.includes(b.brand);
            return (
              <label
                key={b.brand}
                className="flex items-center justify-between cursor-pointer px-2 py-1.5 rounded-[10px] hover:bg-[var(--bg-tint)] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBrand(b.brand)}
                    className="accent-[var(--primary)] w-4 h-4 rounded"
                  />
                  <span className={`text-[13px] font-[800] ${checked ? "text-[var(--primary)]" : "text-[var(--text-3)]"}`}>
                    {b.brand}
                  </span>
                </span>
                <span className="text-[11px] font-[900] text-[var(--muted-2)]">{b.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* price */}
      <div className="mt-5">
        <div className="text-[12.5px] font-[950] text-[var(--text-2)]">{dict.products.filters.price}</div>
        <div className="mt-2.5 flex items-center gap-2">
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            type="number"
            placeholder={dict.products.filters.min}
            className="w-full border border-[var(--line-2)] rounded-[12px] px-3 py-2 text-[12.5px] font-[750] outline-none focus:border-[var(--line-strong)]"
          />
          <span className="text-[var(--muted-2)]">-</span>
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            type="number"
            placeholder={dict.products.filters.max}
            className="w-full border border-[var(--line-2)] rounded-[12px] px-3 py-2 text-[12.5px] font-[750] outline-none focus:border-[var(--line-strong)]"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-2 w-full text-[12.5px] font-[950] text-white rounded-[12px] py-2 transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          {dict.products.filters.apply}
        </button>
      </div>

      {/* toggles */}
      <div className="mt-5 space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={() => push(buildParams({ inStock: inStock ? null : "1" }))}
            className="accent-[var(--teal)] w-4 h-4"
          />
          <span className="text-[13px] font-[800] text-[var(--text-3)]">{dict.products.filters.inStock}</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={discounted}
            onChange={() => push(buildParams({ discount: discounted ? null : "1" }))}
            className="accent-[var(--teal)] w-4 h-4"
          />
          <span className="text-[13px] font-[800] text-[var(--text-3)]">{dict.products.filters.discounted}</span>
        </label>
      </div>

      {/* sort (mobile only) */}
      <div className="mt-5 lg:hidden">
        <div className="text-[12.5px] font-[950] text-[var(--text-2)]">{dict.products.sort.label}</div>
        <select
          value={sort}
          onChange={(e) => push(buildParams({ sort: e.target.value }))}
          className="mt-2 w-full border border-[var(--line-2)] rounded-[12px] px-3 py-2.5 text-[13px] font-[800] outline-none bg-[var(--surface)]"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
