import { siteConfig } from "@/config/site";
import { MetadataRoute } from "next";
import { db } from "@/db";
import { cryptoAudits } from "@/db/schema";
import { desc, gt } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.siteUrl.toString();

  // Tier 1: Critical conversion pages (Priority 1.0, Daily)
  const criticalRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/audit`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Tier 2: High-value marketing pages (Priority 0.9, Weekly)
  const highValueRoutes: MetadataRoute.Sitemap = [
    "/features",
    "/pricing",
    "/how-it-works",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Tier 3: Supporting pages (Priority 0.7, Weekly)
  const supportingRoutes: MetadataRoute.Sitemap = [
    "/faq",
    "/support",
    "/feedback",
    "/sign-up",
    "/sign-in",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Tier 4: Legal & compliance pages (Priority 0.5, Monthly)
  const legalRoutes: MetadataRoute.Sitemap = [
    "/privacy",
    "/terms",
    "/cookies",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Tier 5: Dynamic contract audit pages (Priority 0.8, Weekly)
  let dynamicAuditRoutes: MetadataRoute.Sitemap = [];

  try {
    // Fetch top 50 most-viewed/recent audits for SEO
    const topAudits = await db
      .select({
        contractAddress: cryptoAudits.contractAddress,
        chain: cryptoAudits.chain,
        createdAt: cryptoAudits.createdAt,
      })
      .from(cryptoAudits)
      .where(gt(cryptoAudits.views, 0))
      .orderBy(desc(cryptoAudits.views), desc(cryptoAudits.createdAt))
      .limit(50);

    dynamicAuditRoutes = topAudits.map((audit) => ({
      url: `${baseUrl}/audit/${audit.chain}/${audit.contractAddress}`,
      lastModified: audit.createdAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error fetching dynamic audit routes for sitemap:", error);
    // Continue without dynamic routes if database unavailable
  }

  return [
    ...criticalRoutes,
    ...highValueRoutes,
    ...supportingRoutes,
    ...legalRoutes,
    ...dynamicAuditRoutes,
  ];
}
