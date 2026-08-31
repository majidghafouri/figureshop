# SEO/AEO/GEO Fix Plan for figureforge.ir

## Overview
Based on the seoscore.tools audit (Score: 68/C), there are ~25 fixable issues across SEO, AEO, and GEO. This plan addresses all code-fixable issues. Content-level changes (adding named entities, source citations, comparison content, etc.) are noted but require manual content work.

---

## Phase 1: Critical SEO Fixes

### 1.1 Add canonical tag
**File:** `src/app/layout.tsx`
- Add `<link rel="canonical" href="...">` in `<head>`
- Next.js metadata API supports `alternates.canonical` — set it in `buildMetadata()`

**File:** `src/lib/seo.ts`
- Add `canonical` field to metadata output: `alternates: { canonical: url }`

### 1.2 Add favicon reference
**File:** `src/app/layout.tsx`
- Add `<link rel="icon" href="/favicon.ico" sizes="any" />`
- The file already exists at `public/favicon.ico` but is not referenced in HTML

### 1.3 Add apple-touch-icon
**File:** `src/app/layout.tsx`
- Add `<link rel="apple-touch-icon" href="/logo-icon.svg" />`

### 1.4 Add theme-color meta tag
**File:** `src/app/layout.tsx`
- Add `<meta name="theme-color" content="#3454d1" />`

### 1.5 Add max-image-preview to robots meta
**File:** `src/lib/seo.ts`
- Update robots metadata: `robots: { index: true, follow: true, maxImagePreview: "large" }`

### 1.6 Fix title separator
**File:** `src/lib/seo.ts`
- Change template from `%s | فیگرفورج` to `%s — فیگرفورج` (Google prefers em dash)

### 1.7 Add Web App Manifest
**File:** `public/manifest.json` (NEW)
- Create basic manifest with name, short_name, theme_color, icons

**File:** `src/app/layout.tsx`
- Add `<link rel="manifest" href="/manifest.json" />`

### 1.8 Fix target="_blank" security
**File:** `src/components/Footer.tsx:88`
- Add `rel="noopener noreferrer"` to the enamad link

**File:** `src/app/[locale]/admin/blog/page.tsx:111`
- Add `rel="noopener noreferrer"` to the blog preview link

### 1.9 Add sitemap.xml reference
- `next-sitemap` already generates this at build time. No code change needed — just ensure `next-sitemap` runs during build. The static `public/robots.txt` will be overwritten.

---

## Phase 2: AEO & GEO Schema Fixes

### 2.1 Add author schema
**File:** `src/lib/seo.ts`
- Add `buildAuthorJsonLd()` function returning Person schema with name, url, sameAs

### 2.2 Enhance Product schema
**File:** `src/lib/seo.ts`
- Add `aggregateRating` and `review` fields to `buildProductJsonLd()`
- Add `brand` as full object with `@type: Brand`
- Add `dateModified` field

### 2.3 Enhance Organization schema
**File:** `src/lib/seo.ts`
- Add `dateCreated`, `dateModified` fields
- Add `description` field
- Add more `sameAs` links (Wikipedia, Wikidata placeholder, LinkedIn)
- Add `areaServed`

### 2.4 Add Author JSON-LD to blog posts
**File:** `src/lib/seo.ts`
- Add author URL and sameAs to `buildArticleJsonLd()`

### 2.5 Add FAQ schema builder
**File:** `src/lib/seo.ts`
- Add `buildFaqJsonLd()` utility function (currently inline in faq/page.tsx)

---

## Phase 3: Technical SEO Headers

### 3.1 Security headers (already configured)
**File:** `next.config.mjs`
- X-Frame-Options: DENY ✓ (already set)
- X-Content-Type-Options: nosniff ✓ (already set)
- Referrer-Policy ✓ (already set)
- Permissions-Policy ✓ (already set)
- Content-Security-Policy ✓ (already set)
- HSTS ✓ (already set)

These are all already configured. The seoscore.tools scanner may not detect Vercel-configured headers if it's checking from a specific URL. No changes needed here.

### 3.2 Add dns-prefetch / preconnect hints
**File:** `src/app/layout.tsx`
- Add `<link rel="dns-prefetch" href="https://trustseal.enamad.ir" />`
- Add `<link rel="preconnect" href="https://figureforge.ir" crossorigin />` (for blob storage images)

### 3.3 Font preload
- Fonts are self-hosted via `@fontsource/vazirmatn` — no external preconnect needed
- Add `<link rel="preload" as="font" type="font/woff2" href="/fonts/vazirmatn-latin-400-normal.woff2" crossorigin />` if woff2 files are accessible in public. Otherwise skip since @fontsource bundles them via CSS.

### 3.4 RSS/Atom feed
**File:** `src/app/layout.tsx`
- Add `<link rel="alternate" type="application/rss+xml" title="Figureforge Blog" href="/feed.xml" />`
- **Requires creating a feed generation route** — skip for now since content is dynamic from DB

---

## Phase 4: Content Structure (Code-level)

### 4.1 Add `<time>` elements
- Product detail page already shows dates via `formatDate()` but doesn't use `<time>` tags
- **File:** `src/app/[locale]/products/[slug]/page.tsx` — wrap date in `<time datetime="...">`
- Blog post page — check if dates use `<time>` tags

### 4.2 Add Privacy Policy link
- **File:** `src/components/Footer.tsx` — add link to privacy policy page
- **Requires creating privacy policy page** — skip for now, just add a placeholder link

### 4.3 Title-H1 alignment
- Homepage title: "فیگرفورج | خرید فیگور و اکشن فیگور اورجینال | فیگرفورج"
- Homepage H1: from dict.hero.titleStart + titleHighlight + titleEnd
- These should share key terms. Content-level change — note for manual fix.

---

## Files to Modify (Summary)

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Add favicon, apple-touch-icon, theme-color, manifest link, canonical, dns-prefetch, RSS link, preload |
| `src/lib/seo.ts` | Add canonical to metadata, max-image-preview, author schema, enhanced product schema, enhanced org schema, FAQ schema builder, fix title separator |
| `src/components/Footer.tsx` | Fix rel="noopener noreferrer" on target="_blank" link |
| `src/app/[locale]/admin/blog/page.tsx` | Fix rel="noopener noreferrer" on target="_blank" link |
| `public/manifest.json` | Create Web App Manifest |

---

## Issues That Require Manual Content Work (NOT code changes)

- Add named entities / brand mentions in content
- Add question-style headings (How to..., What is...)
- Add source citations / data references
- Add comparison content (vs. sections)
- Add summary / TL;DR sections
- Add statistics with source references
- Add author credentials / about section
- Mention recent year in content
- Add video content
- Reduce hidden text (97 words in display:none)
- Add <figure>/<figcaption> wrappers for images
- Add specifications tables
- Add Table of Contents / jump links
- Diversify external source domains
