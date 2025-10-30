import { siteConfig } from "@/config/site";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          // API endpoints
          "/api/",

          // Admin & internal
          "/admin/",
          "/handler/",

          // Private user areas
          "/account/",
          "/billing/",
          "/watchlist/",
          "/referrals/",

          // Authentication flows
          "/auth/",
          "/verify-email-sent/",
          "/forgot-password/",

          // Referral tracking (contains dynamic codes)
          "/ref/",

          // Next.js internals
          "/_next/",
        ],
      },
      // Additional rules for aggressive crawlers
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteConfig.siteUrl).toString(),
  };
}
