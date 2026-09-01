import { SITE_URL } from "@/lib/seo";

const HOUR = 60 * 60;

function generateLlmstxt(): string {
  return [
    "# Figureforge",
    "",
    "> Figureforge is a specialized online store for original anime, gaming, movie and Disney figures and action figures, shipping across the Middle East with authenticity guarantees.",
    "",
    "## Key facts",
    "- Original, licensed figures from brands such as NECA, Hot Toys, Bandai, Funko and more",
    "- Secure online payments (Zarinpal, SnappPay, cash on delivery)",
    "- Fast shipping and 7-day returns within Iran",
    "- Support languages: Persian (فارسی), English, Arabic (العربية)",
    "",
    "## Core pages",
    `- [Homepage](${SITE_URL}/)`,
    `- [Products](${SITE_URL}/products)`,
    `- [Blog / Magazine](${SITE_URL}/blog)`,
    `- [About](${SITE_URL}/about)`,
    `- [FAQ](${SITE_URL}/faq)`,
    `- [Contact](${SITE_URL}/contact)`,
    "",
    "## Contact",
    "- Email: info@figureforge.ir",
    "- Support hours: Sat-Thu, 09:00-18:00 (UTC+3:30)",
    "",
  ].join("\n");
}

export const runtime = "nodejs";

export function GET() {
  return new Response(generateLlmstxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

export const revalidate = HOUR;