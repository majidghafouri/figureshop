/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://trustseal.enamad.ir",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "figureforge.ir",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(robots.txt|sitemap.xml|llms.txt|rss.xml|security.txt|manifest.json|favicon.ico|logo-icon.svg|logo.svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=600, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "user-agent",
            value: "(.*GPTBot|.*OAI-SearchBot|.*ClaudeBot|.*perplexitybot|.*Google-Extended|.*CCBot|.*Bytespider|.*Amazonbot)(.*)",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
  webpack(config) {
    config.plugins = config.plugins.filter(
      (plugin) =>
        !(
          plugin &&
          plugin.constructor &&
          plugin.constructor.name === "CopyFilePlugin" &&
          typeof plugin.filePath === "string" &&
          plugin.filePath.includes("polyfill-nomodule")
        )
    );
    return config;
  },
};

export default nextConfig;
