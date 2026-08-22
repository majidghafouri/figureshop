import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import {
  importWebArticles,
  retranslateBrokenImports,
  repairRssTranslations,
} from "@/lib/web-articles";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return fail("Unauthorized", 401);
  }

  // Repair any earlier imports whose translations silently fell back to English.
  const repaired = await retranslateBrokenImports(2);
  const rssRepaired = await repairRssTranslations(2);

  const results = await importWebArticles(2);

  const imported = results.filter((r) => r.status === "imported");
  const skipped = results.filter((r) => r.status === "skipped");
  const errors = results.filter((r) => r.status === "failed");

  return ok({
    repaired,
    rssRepaired,
    imported: imported.length,
    skipped: skipped.length,
    errors: errors.length > 0 ? errors : undefined,
    results,
  });
}
