"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/admin/ImageUploader";
import AudioUploader from "@/components/admin/AudioUploader";
import SingleImageUploader from "@/components/admin/SingleImageUploader";
import { formatThousands, stripNonDigits } from "@/lib/format";

const LOCALES = ["fa", "en", "ar"] as const;

type ProductData = {
  slug: string;
  sku?: string;
  brand?: string;
  price: string;
  compareAtPrice?: string;
  stock: string;
  isActive: boolean;
  isDeactivated: boolean;
  isFeatured: boolean;
  isSpecial: boolean;
  heightCm?: string;
  material?: string;
  weightGrams?: string;
  images: string[];
  musicUrl?: string;
  musicTitle?: string;
  bgImage?: string;
  bgOpacity?: string;
  bgBlur?: string;
  cursorUrl?: string;
  cursorName?: string;
  categorySlug?: string;
  name: Record<string, string>;
  shortDescription: Record<string, string>;
  description: Record<string, string>;
};

type CategoryOption = { slug: string; name: string };

export type ProductFormDict = {
  basics: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  priceToman: string;
  compareAt: string;
  discountPct: string;
  stock: string;
  height: string;
  material: string;
  weight: string;
  activeLabel: string;
  deactivatedLabel: string;
  featured: string;
  special: string;
  images: string;
  imageUpload: string;
  imageUploading: string;
  imageRemove: string;
  imageMoveUp: string;
  imageMoveDown: string;
  music: string;
  musicUrl: string;
  musicUpload: string;
  musicUploading: string;
  musicRemove: string;
  musicTitle: string;
  background: string;
  bgImage: string;
  bgOpacity: string;
  bgBlur: string;
  bgReset: string;
  bgPreview: string;
  cursor: string;
  cursorUpload: string;
  cursorUploading: string;
  cursorRemove: string;
  cursorName: string;
  cursorDefault: string;
  translations: string;
  name: string;
  shortDesc: string;
  description: string;
  none: string;
  create: string;
  saveChanges: string;
  saving: string;
  error: string;
  unknown: string;
  required: string;
};

export default function ProductForm({
  categories,
  initial,
  isEdit,
  dict,
  redirectHref,
}: {
  categories: CategoryOption[];
  initial?: ProductData & { id?: string };
  isEdit?: boolean;
  dict: ProductFormDict;
  redirectHref: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductData>(
    initial ?? {
      slug: "",
      sku: "",
      brand: "",
      price: "",
      compareAtPrice: "",
      stock: "10",
      isActive: true,
      isDeactivated: false,
      isFeatured: false,
      isSpecial: false,
      heightCm: "",
      material: "",
      weightGrams: "",
      images: [],
      musicUrl: "",
      musicTitle: "",
      bgImage: "",
      bgOpacity: "0.15",
      bgBlur: "20",
      cursorUrl: "",
      cursorName: "",
      categorySlug: "",
      name: { fa: "", en: "", ar: "" },
      shortDescription: { fa: "", en: "", ar: "" },
      description: { fa: "", en: "", ar: "" },
    }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computePct = (price: string, compareAt: string): string => {
    const p = Number(price);
    const c = Number(compareAt);
    if (!p || !c || c <= p) return "";
    return String(Math.round(((c - p) / c) * 1000) / 10);
  };

  const computePrice = (pct: string, compareAt: string): string => {
    const c = Number(compareAt);
    const d = Number(pct);
    if (!c || !d) return compareAt;
    return String(Math.max(0, Math.round(c * (1 - d / 100))));
  };

  const [pct, setPct] = useState<string>(
    initial ? computePct(initial.price, initial.compareAtPrice ?? "") : ""
  );

  const set = (k: keyof ProductData, v: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setLoc = (k: "name" | "shortDescription" | "description", loc: string, v: string) =>
    setForm((f) => ({ ...f, [k]: { ...f[k], [loc]: v } }));

  const onChangePrice = (v: string) => {
    const raw = stripNonDigits(v);
    set("price", raw);
    setPct(computePct(raw, stripNonDigits(form.compareAtPrice ?? "")));
  };

  const onChangeCompareAt = (v: string) => {
    const raw = stripNonDigits(v);
    set("compareAtPrice", raw);
    setPct(computePct(stripNonDigits(form.price), raw));
  };

  const onChangePct = (v: string) => {
    setPct(v);
    set("price", computePrice(v, form.compareAtPrice ?? ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.slug.trim() || !form.name.fa.trim()) {
      setError(dict.required);
      return;
    }
    setBusy(true);

    const payload = {
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      sku: form.sku?.trim() || undefined,
      brand: form.brand?.trim() || undefined,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      stock: Number(form.stock) || 0,
      isActive: form.isActive,
      isDeactivated: form.isDeactivated,
      isFeatured: form.isFeatured,
      isSpecial: form.isSpecial,
      heightCm: form.heightCm?.trim() || undefined,
      material: form.material?.trim() || undefined,
      weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
      images: form.images.filter(Boolean),
      musicUrl: form.musicUrl?.trim() || undefined,
      musicTitle: form.musicTitle?.trim() || undefined,
      bgImage: form.bgImage?.trim() || undefined,
      bgOpacity: form.bgOpacity ? Number(form.bgOpacity) : undefined,
      bgBlur: form.bgBlur ? Number(form.bgBlur) : undefined,
      cursorUrl: form.cursorUrl?.trim() || undefined,
      cursorName: form.cursorName?.trim() || undefined,
      categorySlug: form.categorySlug || undefined,
      name: form.name,
      shortDescription: form.shortDescription,
      description: form.description,
    };

    const res = await fetch(
      isEdit ? `/api/admin/products/${initial?.id}` : "/api/admin/products",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      router.push(redirectHref);
      router.refresh();
    } else {
      setError(`${dict.error}: ${json.error ?? dict.unknown}`);
    }
  };

  const inputCls =
    "mt-1 w-full border border-[var(--line-2)] rounded-[12px] px-3 py-2.5 text-[13px] font-[850] text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
        <h3 className="text-[15px] font-[1000] text-[var(--text)]">{dict.basics}</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.slug} *</span>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="naruto-uzumaki" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.sku}</span>
            <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.brand}</span>
            <input value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} placeholder="Figuarts" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.category}</span>
            <select value={form.categorySlug ?? ""} onChange={(e) => set("categorySlug", e.target.value)} className={inputCls}>
              <option value="">{dict.none}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name} ({c.slug})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.priceToman} *</span>
            <input
              value={formatThousands(form.price)}
              onChange={(e) => onChangePrice(e.target.value)}
              type="text"
              inputMode="numeric"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.compareAt}</span>
            <input
              value={formatThousands(form.compareAtPrice ?? "")}
              onChange={(e) => onChangeCompareAt(e.target.value)}
              type="text"
              inputMode="numeric"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.discountPct}</span>
            <input
              value={pct}
              onChange={(e) => onChangePct(e.target.value)}
              type="number"
              step="0.1"
              min="0"
              max="100"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.stock}</span>
            <input value={form.stock} onChange={(e) => set("stock", e.target.value)} type="number" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.height}</span>
            <input value={form.heightCm ?? ""} onChange={(e) => set("heightCm", e.target.value)} placeholder="30 cm" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.material}</span>
            <input value={form.material ?? ""} onChange={(e) => set("material", e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.weight}</span>
            <input value={form.weightGrams ?? ""} onChange={(e) => set("weightGrams", e.target.value)} type="number" className={inputCls} />
          </label>
        </div>
        <div className="mt-3.5 flex gap-4">
          {[
            { k: "isActive" as const, label: dict.activeLabel },
            { k: "isDeactivated" as const, label: dict.deactivatedLabel },
            { k: "isFeatured" as const, label: dict.featured },
            { k: "isSpecial" as const, label: dict.special },
          ].map(({ k, label }) => (
            <label key={k} className="flex items-center gap-2 text-[13px] font-[900] text-[var(--text-3)] cursor-pointer">
              <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
        <h3 className="text-[15px] font-[1000] text-[var(--text)]">{dict.images}</h3>
        <ImageUploader
          value={form.images}
          onChange={(images) => set("images", images)}
          dict={dict}
        />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
        <h3 className="text-[15px] font-[1000] text-[var(--text)]">{dict.music}</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.musicUrl}</span>
            <AudioUploader
              value={form.musicUrl ?? ""}
              onChange={(url) => set("musicUrl", url)}
              dict={dict}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.musicTitle}</span>
            <input value={form.musicTitle ?? ""} onChange={(e) => set("musicTitle", e.target.value)} placeholder="Enchanted Valley" className={inputCls} />
          </label>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
        <h3 className="text-[15px] font-[1000] text-[var(--text)]">{dict.background}</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.bgImage}</span>
            <SingleImageUploader
              value={form.bgImage ?? ""}
              onChange={(url) => set("bgImage", url)}
              label={dict.imageUpload}
              uploadingLabel={dict.imageUploading}
              removeLabel={dict.imageRemove}
            />
          </div>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.bgOpacity} (0-1)</span>
            <input value={form.bgOpacity ?? "0.15"} onChange={(e) => set("bgOpacity", e.target.value)} type="number" step="0.05" min="0" max="1" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.bgBlur} (px)</span>
            <input value={form.bgBlur ?? "20"} onChange={(e) => set("bgBlur", e.target.value)} type="number" min="0" max="100" className={inputCls} />
          </label>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
        <h3 className="text-[15px] font-[1000] text-[var(--text)]">{dict.cursor}</h3>
        <div className="mt-3">
          <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.cursorUpload}</span>
          <SingleImageUploader
            value={form.cursorUrl ?? ""}
            onChange={(url) => set("cursorUrl", url)}
            label={dict.imageUpload}
            uploadingLabel={dict.cursorUploading}
            removeLabel={dict.cursorRemove}
            size="small"
            kind="cursor"
          />
          <p className="mt-1.5 text-[11px] font-[800] text-[var(--muted-3)]">{dict.cursorDefault}</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[18px] p-5">
        <h3 className="text-[15px] font-[1000] text-[var(--text)]">{dict.translations}</h3>
        <div className="mt-3 space-y-4">
          {LOCALES.map((l) => (
            <div key={l} className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 bg-[var(--surface-2)] border border-[var(--soft-line)] rounded-[14px]">
              <label className="block">
                <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.name} ({l})</span>
                <input value={form.name[l]} onChange={(e) => setLoc("name", l, e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.shortDesc} ({l})</span>
                <input value={form.shortDescription[l]} onChange={(e) => setLoc("shortDescription", l, e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-[12px] font-[900] text-[var(--text-2)]">{dict.description} ({l})</span>
                <textarea value={form.description[l]} onChange={(e) => setLoc("description", l, e.target.value)} rows={2} className={inputCls} />
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[13px] font-[850] text-[var(--danger)] bg-[var(--danger-softer)] border border-[var(--danger-soft)] rounded-[12px] px-3 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-[14px] text-white font-[950] px-6 py-3.5 text-[14px] shadow-[0_12px_30px_rgba(var(--primary-rgb),0.25)] disabled:opacity-50 hover:-translate-y-0.5 transition-all"
        style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
      >
        {busy ? dict.saving : isEdit ? dict.saveChanges : dict.create}
      </button>
    </form>
  );
}
