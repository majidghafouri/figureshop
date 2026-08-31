import { MetadataRoute } from "next";

const SITE_URL = (process.env.APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000") as string;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/docs", "/search", "/account", "/checkout", "/cart", "/auth", "/pay"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
