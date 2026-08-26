"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";

const LOCALES = ["fa", "en", "ar"] as const;
const LOCALE_LABELS: Record<string, string> = { fa: "فارسی", en: "English", ar: "العربية" };

type Translation = { locale: string; tag: string; title: string; excerpt: string; body: string };

type Props = {
  isEdit: boolean;
  dict: Record<string, string>;
  prefix: string;
  postId?: string;
  initial?: {
    slug: string;
    coverImage: string | null;
    category: string;
    readingTime: number;
    isPublished: boolean;
    isTrending: boolean;
    sourceType: string;
    translations: Translation[];
  };
};

export default function BlogPostForm({ isEdit, dict, prefix, postId, initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [readingTime, setReadingTime] = useState(initial?.readingTime ?? 3);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isTrending, setIsTrending] = useState(initial?.isTrending ?? false);
  const [activeTab, setActiveTab] = useState("fa");
  const [previewTab, setPreviewTab] = useState<"write" | "preview">("write");

  const [translations, setTranslations] = useState<Record<string, Translation>>(() => {
    const map: Record<string, Translation> = {};
    for (const loc of LOCALES) {
      const t = initial?.translations?.find((x) => x.locale === loc);
      map[loc] = { locale: loc, tag: t?.tag ?? "", title: t?.title ?? "", excerpt: t?.excerpt ?? "", body: t?.body ?? "" };
    }
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const t = translations[activeTab];

  const updateTranslation = useCallback((field: keyof Translation, value: string) => {
    setTranslations((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: value } }));
  }, [activeTab]);

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json.ok && json.data.urls[0]) setCoverImage(json.data.urls[0]);
    } catch {} finally {
      setUploading(false);
    }
  }

  function handleCoverDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleCoverUpload(file);
  }

  async function handleSubmit(publish: boolean) {
    setError("");
    if (!slug || !translations.fa.title) {
      setError(dict.required);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug,
        coverImage: coverImage || null,
        category: category || null,
        readingTime,
        isPublished: publish,
        isTrending,
        translations: LOCALES.map((loc) => ({
          locale: loc,
          tag: translations[loc].tag || undefined,
          title: translations[loc].title,
          excerpt: translations[loc].excerpt || undefined,
          body: translations[loc].body,
        })),
      };

      const url = isEdit ? `/api/admin/blog/${postId}` : "/api/admin/blog";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`${prefix}/admin/blog`);
        router.refresh();
      } else {
        setError(json.error || dict.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[14px] bg-red-50 border border-red-200 text-red-600 text-[13px] font-[800] px-4 py-3">
          {error}
        </div>
      )}

      {/* Slug & Settings */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-[900] text-[var(--muted)] mb-1.5">{dict.slug}</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, "-").toLowerCase())}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13.5px] font-[850] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              dir="ltr"
              placeholder="my-article-slug"
            />
          </div>
          <div>
            <label className="block text-[12px] font-[900] text-[var(--muted)] mb-1.5">{dict.category}</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13.5px] font-[850] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder={dict.none}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--primary)]"
            />
            <span className="text-[13px] font-[900] text-[var(--text)]">{dict.published}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTrending}
              onChange={(e) => setIsTrending(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--primary)]"
            />
            <span className="text-[13px] font-[900] text-[var(--text)]">{dict.trending}</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-[900] text-[var(--muted)]">{dict.readingTime}</label>
            <input
              type="number"
              min={1}
              max={60}
              value={readingTime}
              onChange={(e) => setReadingTime(parseInt(e.target.value) || 3)}
              className="w-16 px-3 py-1.5 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13px] font-[850] text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <span className="text-[12px] font-[800] text-[var(--muted)]">{dict.minutes}</span>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-5">
        <label className="block text-[12px] font-[900] text-[var(--muted)] mb-3">{dict.cover}</label>
        {coverImage ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="" className="w-full max-h-[280px] object-cover rounded-[16px] border border-[var(--line)]" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[16px] flex items-center justify-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-[12px] bg-white text-black text-[12.5px] font-[950] hover:bg-gray-100 transition"
              >
                {dict.coverReplace}
              </button>
              <button
                onClick={() => setCoverImage("")}
                className="px-4 py-2 rounded-[12px] bg-red-500 text-white text-[12.5px] font-[950] hover:bg-red-600 transition"
              >
                {dict.coverRemove}
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCoverDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[var(--line-3)] rounded-[16px] py-12 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--soft)] transition-all"
          >
            {uploading ? (
              <span className="text-[13px] font-[900] text-[var(--muted)]">{dict.coverUploading}</span>
            ) : (
              <>
                <span className="text-[32px]">🖼️</span>
                <p className="mt-2 text-[13px] font-[900] text-[var(--muted)]">{dict.coverUpload}</p>
                <p className="mt-1 text-[11px] font-[800] text-[var(--muted-4)]">PNG, JPG, WebP — Max 25MB</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCoverUpload(file);
            e.target.value = "";
          }}
        />
      </section>

      {/* Translations */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[20px] overflow-hidden">
        {/* Locale Tabs */}
        <div className="flex border-b border-[var(--line)]">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => { setActiveTab(loc); setPreviewTab("write"); }}
              className={`flex-1 px-4 py-3 text-[13px] font-[950] transition-colors ${
                activeTab === loc
                  ? "text-[var(--primary)] bg-[var(--soft)] border-b-2 border-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Tag */}
          <div>
            <label className="block text-[12px] font-[900] text-[var(--muted)] mb-1.5">{dict.tag}</label>
            <input
              value={t.tag}
              onChange={(e) => updateTranslation("tag", e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13.5px] font-[850] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder={dict.none}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-[12px] font-[900] text-[var(--muted)] mb-1.5">{dict.title_field}</label>
            <input
              value={t.title}
              onChange={(e) => updateTranslation("title", e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[15px] font-[950] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-[12px] font-[900] text-[var(--muted)] mb-1.5">{dict.excerpt}</label>
            <textarea
              value={t.excerpt}
              onChange={(e) => updateTranslation("excerpt", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13.5px] font-[850] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
          </div>

          {/* Body with Write/Preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-[900] text-[var(--muted)]">{dict.body}</label>
              <div className="flex bg-[var(--bg)] rounded-[10px] border border-[var(--line)] p-0.5">
                <button
                  onClick={() => setPreviewTab("write")}
                  className={`px-3 py-1 rounded-[8px] text-[11.5px] font-[900] transition ${
                    previewTab === "write" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {dict.write}
                </button>
                <button
                  onClick={() => setPreviewTab("preview")}
                  className={`px-3 py-1 rounded-[8px] text-[11.5px] font-[900] transition ${
                    previewTab === "preview" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {dict.preview}
                </button>
              </div>
            </div>
            <p className="text-[11px] font-[800] text-[var(--muted-4)] mb-2">{dict.bodyHint}</p>
            {previewTab === "write" ? (
              <textarea
                value={t.body}
                onChange={(e) => updateTranslation("body", e.target.value)}
                rows={18}
                className="w-full px-4 py-3 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[13.5px] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y leading-relaxed"
                dir="ltr"
              />
            ) : (
              <div className="w-full min-h-[360px] px-4 py-3 rounded-[12px] border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-[14px] leading-[2] prose prose-sm max-w-none overflow-auto">
                {t.body ? (
                  <div className="whitespace-pre-wrap font-[850]">{t.body}</div>
                ) : (
                  <span className="text-[var(--muted-4)] italic">{dict.contentEmpty}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap pb-8">
        <button
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="px-6 py-3 rounded-[14px] text-white text-[13.5px] font-[950] shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
          style={{ backgroundImage: "linear-gradient(135deg,var(--primary),var(--sky))" }}
        >
          {saving ? dict.saving : isPublished ? dict.saveChanges : dict.publish}
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="px-6 py-3 rounded-[14px] text-[var(--text)] text-[13.5px] font-[950] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--soft)] transition-all disabled:opacity-50"
        >
          {dict.saveChanges}
        </button>
        <button
          onClick={() => router.push(`${prefix}/admin/blog`)}
          className="px-6 py-3 rounded-[14px] text-[var(--muted)] text-[13.5px] font-[900] hover:text-[var(--text)] transition-colors"
        >
          {dict.back}
        </button>
      </div>
    </div>
  );
}
