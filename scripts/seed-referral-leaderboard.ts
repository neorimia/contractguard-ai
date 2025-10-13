// scripts/seed-referral-leaderboard.ts
/**
 * Seed realistic referral leaderboard data for ContractGuard AI
 * Creates mock users with high referral counts for social proof and FOMO
 * Run with: npm run seed:referrals
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

async function seedReferralLeaderboard() {
  // Dynamic import after env vars are loaded
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");

  type NewUser = typeof users.$inferInsert;

  // Helper function to calculate tier based on referral count
  function getTier(referralCount: number, paidReferrals: number): string {
    if (referralCount >= 100 && paidReferrals >= 20) return "ambassador";
    if (referralCount >= 50 && paidReferrals >= 10) return "platinum";
    if (referralCount >= 25 && paidReferrals >= 5) return "gold";
    if (referralCount >= 10 && paidReferrals >= 2) return "silver";
    if (referralCount >= 5 && paidReferrals >= 1) return "iron";
    if (referralCount >= 3) return "bronze";
    return "none";
  }

  // Helper function to calculate earnings (5-10% of referred revenue)
  function calculateEarnings(
    referralCount: number,
    paidReferrals: number
  ): {
    totalReferralEarnings: number;
    lifetimeCommission: number;
    referredRevenue: number;
  } {
    // Average $29/month subscription × paid referrals × random months (1-12)
    const avgRevenue =
      paidReferrals * 2900 * (Math.floor(Math.random() * 12) + 1);
    const commissionRate = referralCount >= 100 ? 0.2 : 0.1; // 20% for ambassadors, 10% for others
    const totalCommission = Math.floor(avgRevenue * commissionRate);

    return {
      totalReferralEarnings: totalCommission,
      lifetimeCommission: totalCommission,
      referredRevenue: avgRevenue,
    };
  }

  // Generate dates within last 7 days
  function getRecentDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
  }

  const mockLeaderboardUsers: NewUser[] = [
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "cryptomihai@contractguard.example",
      displayName: "CryptoMihai",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-MIHAI1",
      referralCount: 487,
      paidReferrals: 97,
      referralTier: "ambassador",
      bonusScans: 0,
      ...calculateEarnings(487, 97),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(60),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "defiqueen@contractguard.example",
      displayName: "DeFiQueen",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-QUEEN1",
      referralCount: 394,
      paidReferrals: 79,
      referralTier: "ambassador",
      bonusScans: 0,
      ...calculateEarnings(394, 79),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(55),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "bogdan.blockchain@contractguard.example",
      displayName: "BlockchainBogdan",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-BOGDAN",
      referralCount: 341,
      paidReferrals: 68,
      referralTier: "ambassador",
      bonusScans: 0,
      ...calculateEarnings(341, 68),
      lastLoginAt: getRecentDate(1),
      createdAt: getRecentDate(50),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "rugpullhunter@contractguard.example",
      displayName: "RugPullHunter",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-HUNTER",
      referralCount: 318,
      paidReferrals: 64,
      referralTier: "ambassador",
      bonusScans: 0,
      ...calculateEarnings(318, 64),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(48),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "safety.dev@contractguard.example",
      displayName: "SafetyFirst_DEV",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-SAFETY",
      referralCount: 276,
      paidReferrals: 55,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(276, 55),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(45),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "web3.influencer@contractguard.example",
      displayName: "web3_influencer",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-WEB3IN",
      referralCount: 229,
      paidReferrals: 46,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(229, 46),
      lastLoginAt: getRecentDate(1),
      createdAt: getRecentDate(42),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "scamslayer@contractguard.example",
      displayName: "ScamSlayer",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-SLAYER",
      referralCount: 201,
      paidReferrals: 40,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(201, 40),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(40),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "aurelian.crypto@contractguard.example",
      displayName: "AurelianCrypto",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-AUREL",
      referralCount: 187,
      paidReferrals: 37,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(187, 37),
      lastLoginAt: getRecentDate(1),
      createdAt: getRecentDate(38),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "smartcontractsam@contractguard.example",
      displayName: "SmartContractSam",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-SAMSC",
      referralCount: 163,
      paidReferrals: 33,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(163, 33),
      lastLoginAt: getRecentDate(3),
      createdAt: getRecentDate(35),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "degen.detector@contractguard.example",
      displayName: "Degen_Detector",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-DEGEN",
      referralCount: 149,
      paidReferrals: 30,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(149, 30),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(32),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "token.sherlock@contractguard.example",
      displayName: "TokenSherlock",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-SHERLO",
      referralCount: 134,
      paidReferrals: 27,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(134, 27),
      lastLoginAt: getRecentDate(4),
      createdAt: getRecentDate(30),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "cryptonomad@contractguard.example",
      displayName: "CryptoNomad",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-NOMAD",
      referralCount: 118,
      paidReferrals: 24,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(118, 24),
      lastLoginAt: getRecentDate(2),
      createdAt: getRecentDate(28),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "safemoon.patrol@contractguard.example",
      displayName: "SafeMoonPatrol",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-PATROL",
      referralCount: 103,
      paidReferrals: 21,
      referralTier: "ambassador",
      bonusScans: 0,
      ...calculateEarnings(103, 21),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(25),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "honeypothawk@contractguard.example",
      displayName: "HoneypotHawk",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-HAWK",
      referralCount: 91,
      paidReferrals: 18,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(91, 18),
      lastLoginAt: getRecentDate(3),
      createdAt: getRecentDate(23),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "chain.guardian@contractguard.example",
      displayName: "ChainGuardian",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-GUARD",
      referralCount: 77,
      paidReferrals: 15,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(77, 15),
      lastLoginAt: getRecentDate(2),
      createdAt: getRecentDate(20),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "eth.safety@contractguard.example",
      displayName: "EthSafety",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-ETHSAF",
      referralCount: 68,
      paidReferrals: 14,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(68, 14),
      lastLoginAt: getRecentDate(4),
      createdAt: getRecentDate(18),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "scambuster99@contractguard.example",
      displayName: "ScamBuster99",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-BUST99",
      referralCount: 59,
      paidReferrals: 12,
      referralTier: "platinum",
      bonusScans: 0,
      ...calculateEarnings(59, 12),
      lastLoginAt: getRecentDate(3),
      createdAt: getRecentDate(16),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "contract.whisperer@contractguard.example",
      displayName: "ContractWhisperer",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-WHISP",
      referralCount: 47,
      paidReferrals: 9,
      referralTier: "gold",
      bonusScans: 0,
      ...calculateEarnings(47, 9),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(14),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "defi.defender@contractguard.example",
      displayName: "DefiDefender",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-DEFEND",
      referralCount: 38,
      paidReferrals: 8,
      referralTier: "gold",
      bonusScans: 0,
      ...calculateEarnings(38, 8),
      lastLoginAt: getRecentDate(5),
      createdAt: getRecentDate(12),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "memecoin.medic@contractguard.example",
      displayName: "MemeCoinMedic",
      emailVerified: true,
      tier: "pro",
      referralCode: "CG-MEDIC",
      referralCount: 31,
      paidReferrals: 6,
      referralTier: "gold",
      bonusScans: 0,
      ...calculateEarnings(31, 6),
      lastLoginAt: getRecentDate(2),
      createdAt: getRecentDate(10),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "rug.radar@contractguard.example",
      displayName: "RugRadar",
      emailVerified: true,
      tier: "free",
      referralCode: "CG-RADAR",
      referralCount: 24,
      paidReferrals: 5,
      referralTier: "silver",
      bonusScans: 140,
      ...calculateEarnings(24, 5),
      lastLoginAt: getRecentDate(3),
      createdAt: getRecentDate(8),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "token.tactician@contractguard.example",
      displayName: "TokenTactician",
      emailVerified: true,
      tier: "free",
      referralCode: "CG-TACTIC",
      referralCount: 19,
      paidReferrals: 4,
      referralTier: "silver",
      bonusScans: 120,
      ...calculateEarnings(19, 4),
      lastLoginAt: getRecentDate(4),
      createdAt: getRecentDate(7),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "smartchain.scout@contractguard.example",
      displayName: "SmartChainScout",
      emailVerified: true,
      tier: "free",
      referralCode: "CG-SCOUT",
      referralCount: 14,
      paidReferrals: 3,
      referralTier: "silver",
      bonusScans: 100,
      ...calculateEarnings(14, 3),
      lastLoginAt: getRecentDate(5),
      createdAt: getRecentDate(6),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "contract.cop@contractguard.example",
      displayName: "ContractCop",
      emailVerified: true,
      tier: "free",
      referralCode: "CG-COP",
      referralCount: 9,
      paidReferrals: 2,
      referralTier: "iron",
      bonusScans: 80,
      ...calculateEarnings(9, 2),
      lastLoginAt: getRecentDate(6),
      createdAt: getRecentDate(5),
    },
    {
      stackUserId: `mock_cg_${crypto.randomUUID()}`,
      email: "security.sultan@contractguard.example",
      displayName: "SecuritySultan",
      emailVerified: true,
      tier: "free",
      referralCode: "CG-SULTAN",
      referralCount: 6,
      paidReferrals: 1,
      referralTier: "iron",
      bonusScans: 60,
      ...calculateEarnings(6, 1),
      lastLoginAt: getRecentDate(0),
      createdAt: getRecentDate(4),
    },
  ];

  try {
    console.log("🌱 Seeding referral leaderboard data...");
    console.log(`📊 Creating ${mockLeaderboardUsers.length} mock users...\n`);

    // Insert mock users
    let count = 0;
    for (const user of mockLeaderboardUsers) {
      await db.insert(users).values(user);
      count++;
      console.log(
        `✅ #${count.toString().padStart(2)} ${user.displayName?.padEnd(20)} | ${user.referralCount.toString().padStart(3)} referrals | ${user.referralTier?.padEnd(12)} | $${((user.totalReferralEarnings || 0) / 100).toFixed(0).padStart(5)} earned`
      );
    }

    console.log(
      `\n🎉 Successfully seeded ${mockLeaderboardUsers.length} leaderboard users!`
    );
    console.log("\n📈 Leaderboard Summary:");
    console.log(
      `- Ambassador Tier: ${mockLeaderboardUsers.filter((u) => u.referralTier === "ambassador").length} users`
    );
    console.log(
      `- Platinum Tier: ${mockLeaderboardUsers.filter((u) => u.referralTier === "platinum").length} users`
    );
    console.log(
      `- Gold Tier: ${mockLeaderboardUsers.filter((u) => u.referralTier === "gold").length} users`
    );
    console.log(
      `- Silver Tier: ${mockLeaderboardUsers.filter((u) => u.referralTier === "silver").length} users`
    );
    console.log(
      `- Iron Tier: ${mockLeaderboardUsers.filter((u) => u.referralTier === "iron").length} users`
    );

    const totalReferrals = mockLeaderboardUsers.reduce(
      (sum, u) => sum + (u.referralCount || 0),
      0
    );
    const totalEarnings = mockLeaderboardUsers.reduce(
      (sum, u) => sum + (u.totalReferralEarnings || 0),
      0
    );

    console.log(`\n💰 Total Metrics:`);
    console.log(`- Total Referrals: ${totalReferrals.toLocaleString()}`);
    console.log(`- Total Earnings: $${(totalEarnings / 100).toLocaleString()}`);
    console.log(
      `- Top Referrer: ${mockLeaderboardUsers[0].displayName} with ${mockLeaderboardUsers[0].referralCount} referrals`
    );

    console.log("\n🔗 Next steps:");
    console.log("1. Visit /referrals to see the leaderboard");
    console.log("2. Check social proof stats on the homepage");
    console.log("3. Monitor viral growth in analytics");
    console.log(
      "\n💡 These are MOCK users for demo/social proof purposes only"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed referral leaderboard:", error);
    process.exit(1);
  }
}

seedReferralLeaderboard();
