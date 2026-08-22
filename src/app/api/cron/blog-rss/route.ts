import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import { fetchAllFeeds, RssFeedConfig } from "@/lib/rss-aggregator";
import { repairRssTranslations } from "@/lib/web-articles";
import { getSetting } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return fail("Unauthorized", 401);
  }

  const raw = await getSetting("rss_feeds");
  if (!raw) return ok({ feeds: 0, results: [] });

  let feeds: RssFeedConfig[];
  try {
    feeds = JSON.parse(raw);
    if (!Array.isArray(feeds)) feeds = [];
  } catch {
    return fail("invalid_rss_feeds_config");
  }

  if (feeds.length === 0) return ok({ feeds: 0, results: [] });

  const results = await fetchAllFeeds(feeds);

  // Self-heal legacy RSS posts that were stored without proper translations.
  const repaired = await repairRssTranslations(2);

  const totalImported = results.reduce((s, r) => s + r.imported, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
  const errors = results.filter((r) => r.error);

  return ok({
    feeds: feeds.length,
    totalImported,
    totalSkipped,
    results,
    repaired,
    errors: errors.length > 0 ? errors : undefined,
  });
}
