import { describe, it, expect } from "vitest";
import {
  scrapeArticle,
  translateArticle,
  discoverCandidates,
  isWrongLanguage,
  evaluateContentQuality,
} from "@/lib/web-articles";

describe("evaluateContentQuality", () => {
  it("accepts a normal prose article", () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) =>
      `Paragraph ${i} explains a real aspect of resin printing with useful detail and complete sentences for readers.`
    ).join("\n\n");
    const md = `## Guide\n\n${paragraphs}\n\n[Source](https://example.com)`;
    expect(evaluateContentQuality(md)).toEqual({ ok: true });
  });

  it("rejects pages that are mostly link lists (nav/sidebar junk)", () => {
    const items = Array.from({ length: 30 }, (_, i) =>
      `### [Some Other Rather Long Article Title That Keeps Going Number ${i}](https://example.com/article-${i})`
    ).join("\n\n");
    expect(evaluateContentQuality(items)).toMatchObject({ ok: false, reason: "link_list_page" });
  });

  it("rejects pages with too little prose", () => {
    expect(evaluateContentQuality("### How would you rate this episode?\n\nShort bit."))
      .toMatchObject({ ok: false, reason: "low_content" });
  });

  it("ignores image syntax when judging content", () => {
    const images = Array.from({ length: 5 }, () => "![alt](https://example.com/img.jpg)").join("\n\n");
    expect(evaluateContentQuality(images)).toMatchObject({ ok: false, reason: "low_content" });
  });
});

describe("isWrongLanguage", () => {
  it("flags Cyrillic contamination inside Arabic text", () => {
    expect(isWrongLanguage("كيفية تلوين Миниятурат الرزين المطبوعة")).toBe(true);
  });

  it("flags untranslated English text as wrong fa/ar content", () => {
    expect(isWrongLanguage("How to Paint 3D Printed Resin Miniatures: From Wash to Highlight")).toBe(true);
    expect(isWrongLanguage("A step-by-step painting guide built specifically for beginners.")).toBe(true);
  });

  it("accepts properly translated Persian text", () => {
    expect(isWrongLanguage("نحوه رنگ‌آمیزی مینیاتورهای رزینی چاپ سه‌بعدی: از شستشو تا هایلایت")).toBe(false);
  });

  it("accepts properly translated Arabic text", () => {
    expect(isWrongLanguage("كيفية تلوين المينياتورات الرزين المطبوعة ثلاثية الأبعاد")).toBe(false);
  });

  it("ignores brand names, URLs and markdown syntax around translated text", () => {
    const body = "## رزین در مقابل FDM\n\n**Bambu Lab A1 Mini**\n\nبهترین پرینتر برای شروع است.\n\n[منبع](https://example.com/article)";
    expect(isWrongLanguage(body)).toBe(false);
  });

  it("treats empty or whitespace-only text as fine", () => {
    expect(isWrongLanguage(null)).toBe(false);
    expect(isWrongLanguage(undefined)).toBe(false);
    expect(isWrongLanguage("   ")).toBe(false);
  });
});

describe("scrapeArticle", () => {
  it("extracts title and markdown from an HTML page", async () => {
    const result = await scrapeArticle(
      "https://im-a-collector.com/en/collecting-differently/how-to-start-an-anime-figure-collection-beginners-guide/"
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.markdown).toBeTruthy();
    expect(result!.markdown.length).toBeGreaterThan(200);
    expect(result!.siteName).toBeTruthy();
  }, 30000);

  it("returns null for unreachable URLs", async () => {
    const result = await scrapeArticle("https://nonexistent-domain-12345.invalid/article");
    expect(result).toBeNull();
  }, 15000);
});

describe("translateArticle", () => {
  it("translates English text to Farsi", async () => {
    const result = await translateArticle(
      { title: "Hello World", excerpt: "A test article", body: "This is a test paragraph." },
      "fa"
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.title).not.toBe("Hello World");
    expect(isWrongLanguage(result!.title)).toBe(false);
  }, 20000);

  it("translates English text to Arabic", async () => {
    const result = await translateArticle(
      { title: "Hello World", excerpt: "A test article", body: "This is a test paragraph." },
      "ar"
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.title).not.toBe("Hello World");
    expect(isWrongLanguage(result!.title)).toBe(false);
  }, 20000);
});

describe("discoverCandidates", () => {
  it("returns at least one candidate", async () => {
    const candidates = await discoverCandidates();
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].url).toBeTruthy();
    expect(candidates[0].title).toBeTruthy();
  }, 30000);
});
