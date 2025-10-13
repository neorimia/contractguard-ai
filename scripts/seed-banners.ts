// scripts/seed-banners.ts
/**
 * Seed initial banner data for ContractGuard AI
 * Run with: npm run seed:banners
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

async function seedBanners() {
  // Dynamic import after env vars are loaded
  const { db } = await import("@/db");
  const { banners } = await import("@/db/schema");

  type NewBanner = typeof banners.$inferInsert;

  const initialBanners: NewBanner[] = [
    // 1. Crypto.com Affiliate Banner (Top Leaderboard - Before Scanning)
    {
      name: "crypto_com_affiliate",
      type: "partner_ad",
      category: "partnership",
      placement: "top_leaderboard",
      priority: 9,
      targetUserType: "all",
      minScans: 0,
      maxScans: 0,
      targetTier: "free",
      headline: "🔒 Secure Your Crypto Assets with Crypto.com",
      body: "Get up to $50 USD in crypto when you sign up. Trusted by millions worldwide.",
      ctaText: "Claim Bonus →",
      ctaUrl: "https://crypto.com/app/2v82rmuz3z",
      format: "static",
      backgroundColor: "#002D74",
      textColor: "#FFFFFF",
      isExternal: true,
      partnerName: "Crypto.com",
      isActive: true,
      metadata: {
        frequencyCap: 2,
        dismissible: true,
        notes: "Show to free/anonymous users before scanning",
      },
    },

    // 2. Power User Upgrade Banner (Top Leaderboard)
    {
      name: "power_user_upgrade",
      type: "internal_upgrade",
      category: "upgrade",
      placement: "top_leaderboard",
      priority: 10,
      targetUserType: "power_user",
      minScans: 10,
      targetTier: "free",
      headline: "You've scanned over 10 contracts! 🚀",
      body: "Upgrade to Pro for unlimited scans and advanced security features.",
      ctaText: "Try Pro - €29/mo",
      ctaUrl: "/pricing",
      format: "static",
      backgroundColor: "#3B82F6",
      textColor: "#FFFFFF",
      isActive: true,
      metadata: {
        frequencyCap: 3,
        dismissible: true,
        notes: "Target users who have performed 10+ scans",
      },
    },

    // 2. Free vs Pro Comparison (Sidebar Rectangle)
    {
      name: "comparison_chart",
      type: "internal_upgrade",
      category: "upgrade",
      placement: "sidebar_rectangle",
      priority: 8,
      targetUserType: "free",
      minScans: 3,
      targetTier: "free",
      headline: "Free vs Pro",
      body: "Free: 3 scans/day • Pro: Unlimited scans + AI deep dive + PDF reports",
      ctaText: "Upgrade Now",
      ctaUrl: "/pricing",
      format: "static",
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
      isActive: true,
      metadata: {
        frequencyCap: 5,
        dismissible: true,
        notes: "Show comparison after 3+ scans",
      },
    },

    // 3. Social Proof Banner (Sidebar Rectangle)
    {
      name: "social_proof_stats",
      type: "social_proof",
      category: "educational",
      placement: "sidebar_rectangle",
      priority: 6,
      targetUserType: "all",
      minScans: 0,
      targetTier: "all",
      headline: "Trusted by Traders",
      body: "✅ 10,000+ contracts analyzed\n✅ $5.6B in scams detected\n✅ 10-second analysis",
      ctaText: "Upgrade to Pro",
      ctaUrl: "/pricing",
      format: "static",
      backgroundColor: "#10B981",
      textColor: "#FFFFFF",
      isActive: true,
      metadata: {
        frequencyCap: 5,
        dismissible: true,
        notes: "Build trust with social proof",
      },
    },

    // 4. Limit Warning (Bottom Sticky - Mobile)
    {
      name: "limit_warning_mobile",
      type: "urgency",
      category: "paywall",
      placement: "bottom_sticky",
      priority: 9,
      targetUserType: "free",
      minScans: 2,
      maxScans: 3,
      targetTier: "free",
      headline: "⚠️ 1 scan left today",
      body: "Upgrade for unlimited",
      ctaText: "Go Pro",
      ctaUrl: "/pricing",
      format: "static",
      backgroundColor: "#F59E0B",
      textColor: "#000000",
      isActive: true,
      metadata: {
        frequencyCap: 2,
        dismissible: true,
        notes: "Show when user has 1 scan remaining",
      },
    },

    // 5. Anonymous Signup Prompt (Top Leaderboard)
    {
      name: "anonymous_signup_education",
      type: "feature_education",
      category: "educational",
      placement: "top_leaderboard",
      priority: 7,
      targetUserType: "anonymous",
      minScans: 1,
      targetTier: "all",
      headline: "🔍 Get 3 free scans daily with a free account",
      body: "Sign up in 10 seconds to unlock your daily scans.",
      ctaText: "Sign Up Free",
      ctaUrl: "/pricing",
      format: "static",
      backgroundColor: "#8B5CF6",
      textColor: "#FFFFFF",
      isActive: true,
      metadata: {
        frequencyCap: 3,
        dismissible: true,
        notes: "Convert anonymous users to soft signup",
      },
    },
  ];

  try {
    console.log("🌱 Seeding banner data...");

    // Insert banners
    for (const banner of initialBanners) {
      await db.insert(banners).values(banner);
      console.log(`✅ Created banner: ${banner.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${initialBanners.length} banners!`);
    console.log("\nBanner Summary:");
    console.log("- Top Leaderboard: 3 banners (1 Crypto.com affiliate)");
    console.log("- Sidebar Rectangle: 2 banners");
    console.log("- Bottom Sticky: 1 banner");
    console.log("\nNext steps:");
    console.log("1. Update Crypto.com affiliate link in seed-banners.ts");
    console.log("2. Run 'npm run db:push' to sync schema");
    console.log("3. Test banners at http://localhost:3000");
    console.log("4. Monitor analytics in PostHog dashboard");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed banners:", error);
    process.exit(1);
  }
}

seedBanners();
