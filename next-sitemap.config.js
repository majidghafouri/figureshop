/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.APP_URL || "http://localhost:3000",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    "/fa/admin/**",
    "/en/admin/**",
    "/ar/admin/**",
    "/api/*",
    "/docs",
    "/_next/*",
  ],
  alternateRefs: [
    {
      href: process.env.APP_URL || "http://localhost:3000",
      hrefZeroLocale: true,
    },
    {
      href: `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/en`,
    },
    {
      href: `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/ar`,
    },
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.APP_URL || "http://localhost:3000"}/sitemap.xml`,
    ],
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/docs"],
      },
    ],
    additionalRobotsTxtRules: (rules) => {
      const indexNowKey = process.env.INDEXNOW_KEY || "figureforge-indexnow-key";
      return `${rules}\n# IndexNow\nIndexNow: https://www.bing.com/indexnow?url=${encodeURIComponent(`${process.env.APP_URL || "https://figureforge.ir"}/sitemap.xml`)}&key=${indexNowKey}`;
    },
  },
  transform: async (config, path) => {
    const priority =
      path === "/" ? 1.0 :
      path.includes("/products/") ? 0.8 :
      path.includes("/blog/") ? 0.7 :
      path.includes("/category/") ? 0.7 :
      path.includes("/about") ? 0.6 :
      path.includes("/contact") ? 0.6 :
      0.5;
    const changefreq =
      path === "/" ? "daily" :
      path.includes("/blog/") ? "weekly" :
      path.includes("/products/") ? "weekly" :
      "monthly";
    return {
      loc: path,
      changefreq,
      priority,
    };
  },
};
