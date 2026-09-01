export function GET() {
  const txt = [
    "Contact: mailto:security@figureforge.ir",
    "Contact: mailto:info@figureforge.ir",
    "Expires: 2027-09-01T00:00:00.000Z",
    "Preferred-Languages: fa, en, ar",
    "Canonical: https://figureforge.ir/.well-known/security.txt",
    "Policy: https://figureforge.ir/terms",
    "",
  ].join("\n");
  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}