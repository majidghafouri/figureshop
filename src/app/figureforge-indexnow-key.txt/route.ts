export const dynamic = "force-static";

export function GET() {
  return new Response(process.env.INDEXNOW_KEY || "figureforge-indexnow-key", {
    headers: { "Content-Type": "text/plain" },
  });
}
