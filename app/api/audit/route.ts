// app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { audits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ContractService } from "@/lib/services/contract.service";
import { AIAnalysisService } from "@/lib/services/ai.service";
import { AuthService } from "@/lib/services/auth.service";
import { ReferralService } from "@/lib/services/referral.service";
import { getClientInfo } from "@/lib/utils/client-info";
import { Redis } from "@upstash/redis";
import { stackServerApp } from "@/stack/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const contractService = new ContractService();
const aiService = new AIAnalysisService();
const authService = new AuthService();

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check - Get user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to scan contracts",
          status: "error",
        },
        { status: 401 }
      );
    }

    // Validate that user has an email
    if (!stackUser.primaryEmail) {
      return NextResponse.json(
        {
          error: "Invalid user account",
          message:
            "Your account is missing an email address. Please contact support.",
          status: "error",
        },
        { status: 400 }
      );
    }

    // 2. Get or create app user in our database
    let appUser;
    try {
      appUser = await authService.getUserByStackId(stackUser.id);

      if (!appUser) {
        // First time user - create in our database
        const nameParts = stackUser.displayName?.split(" ") || [];
        console.log("Creating new user:", {
          stackUserId: stackUser.id,
          email: stackUser.primaryEmail,
          displayName: stackUser.displayName,
        });

        appUser = await authService.syncUser(
          stackUser.id,
          stackUser.primaryEmail, // We've already validated this exists above
          {
            displayName: stackUser.displayName || undefined,
            avatarUrl: stackUser.profileImageUrl || undefined,
          }
        );
      }
    } catch (syncError: any) {
      console.error("Detailed sync error:", {
        message: syncError.message,
        stack: syncError.stack,
        stackUser: {
          id: stackUser.id,
          email: stackUser.primaryEmail,
          displayName: stackUser.displayName,
        },
      });

      return NextResponse.json(
        {
          error: "Failed to sync user account",
          details: syncError.message,
          status: "error",
        },
        { status: 500 }
      );
    }

    // 3. Rate limit check
    const { allowed, scansRemaining, resetAt } =
      await authService.checkScanLimit(appUser.id);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Scan limit exceeded",
          message: `You've used all your scans for today. ${appUser.tier === "free" ? "Upgrade to Pro for 100 scans per day!" : "Your limit will reset soon."}`,
          scansRemaining: 0,
          resetAt: resetAt.toISOString(),
          upgradeUrl: "/pricing",
          status: "error",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetAt.toISOString(),
          },
        }
      );
    }

    const { contractAddress, chain = "ethereum" } = await req.json();

    // Validate address
    if (!contractService.validateAddress(contractAddress)) {
      return NextResponse.json(
        { error: "Invalid contract address" },
        { status: 400 }
      );
    }

    const normalizedAddress = contractAddress.toLowerCase();

    // 1. Check Redis cache first (5 minute TTL)
    const cacheKey = `audit:${chain}:${normalizedAddress}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("Cache hit");
      return NextResponse.json(cached);
    }

    // 2. Check database cache (24 hour TTL)
    const existing = await db.query.audits.findFirst({
      where: eq(audits.contractAddress, normalizedAddress),
    });

    if (existing && isRecent(existing.createdAt, 24 * 60 * 60 * 1000)) {
      // Update view count
      await db
        .update(audits)
        .set({ views: (existing.views || 0) + 1 })
        .where(eq(audits.contractAddress, normalizedAddress));

      await redis.set(cacheKey, existing, { ex: 300 }); // 5 min cache
      return NextResponse.json(existing);
    }

    // 3. Fetch fresh data
    console.log("Fetching fresh analysis...");

    const contractData = await contractService.fetchContract(
      normalizedAddress,
      chain
    );

    if (!contractData.isVerified) {
      return NextResponse.json(
        {
          error: "Contract not verified",
          message:
            "This contract source code is not verified on the blockchain explorer. Cannot perform security analysis.",
        },
        { status: 400 }
      );
    }

    // 4. Get enrichment data
    const enrichmentData = await contractService.getEnrichmentData(
      normalizedAddress,
      chain
    );

    // 5. AI Analysis
    const analysis = await aiService.analyzeContract(
      contractData.sourceCode,
      contractData.contractName,
      enrichmentData
    );

    // 6. Add pattern-based detection
    const patternIssues = aiService.detectKnownPatterns(
      contractData.sourceCode
    );

    // Merge AI and pattern-based issues
    const allIssues = [...analysis.issues, ...patternIssues];

    // Recalculate risk score if patterns found
    const finalRiskScore =
      patternIssues.length > 0
        ? Math.max(
            analysis.riskScore,
            patternIssues.some((i) => i.severity === "CRITICAL") ? 90 : 70
          )
        : analysis.riskScore;

    // 7. Save to database
    const auditData = {
      contractAddress: normalizedAddress,
      chain,
      sourceCode: contractData.sourceCode.slice(0, 10000), // Store partial
      isVerified: contractData.isVerified,
      riskScore: finalRiskScore,
      summary: analysis.summary,
      issues: allIssues,
      recommendation: analysis.recommendation,
      holderCount: enrichmentData.holderCount,
      liquidity: enrichmentData.liquidity,
      ownerBalance: enrichmentData.ownerBalance,
      views: 1,
      shares: 0,
    };

    let result;
    if (existing) {
      const [updated] = await db
        .update(audits)
        .set({ ...auditData, updatedAt: new Date() })
        .where(eq(audits.contractAddress, normalizedAddress))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(audits).values(auditData).returning();
      result = inserted;
    }

    // 8. Cache in Redis
    await redis.set(cacheKey, result, { ex: 300 });

    // 9. Increment user scan count
    await authService.incrementScanCount(appUser.id);

    // ============================================================
    // REFERRAL SYSTEM INTEGRATION
    // Confirm referral on first audit completion
    // ============================================================
    try {
      // Fetch updated user to get current scan count
      const updatedUser = await authService.getUserById(appUser.id);

      // Check if this is the user's first audit (scansToday === 1)
      if (updatedUser && updatedUser.scansToday === 1) {
        console.log(
          `First audit detected for user ${updatedUser.id}, checking for referral confirmation`
        );

        const referralService = new ReferralService();
        const clientInfo = await getClientInfo(req);

        const referralResult = await referralService.confirmReferral({
          referredUserId: updatedUser.id,
          trigger: "first_audit_complete",
          metadata: clientInfo,
        });

        if (referralResult.success) {
          console.log(`Referral confirmed for user ${updatedUser.id}`);

          if (referralResult.reward) {
            console.log(
              `Referrer rewarded: ${referralResult.reward.type} x${referralResult.reward.amount}`
            );
          }
        } else if (referralResult.error === "no_pending_referral") {
          // User wasn't referred - this is normal, no action needed
          console.log(`No pending referral found for user ${updatedUser.id}`);
        } else {
          console.warn(
            `Referral confirmation failed for user ${updatedUser.id}: ${referralResult.error}`
          );
        }
      }
    } catch (referralError) {
      // Log referral errors but don't fail the audit
      console.error("Error confirming referral on first audit:", referralError);
    }
    // ============================================================

    // Return with rate limit headers
    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": Math.max(0, scansRemaining - 1).toString(),
        "X-RateLimit-Reset": resetAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Audit API error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error.message },
      { status: 500 }
    );
  }
}

// Helper to check if timestamp is recent
function isRecent(timestamp: Date | null, maxAge: number): boolean {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() < maxAge;
}

// GET endpoint for retrieving existing audits
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const audit = await db.query.audits.findFirst({
    where: eq(audits.contractAddress, address.toLowerCase()),
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  return NextResponse.json(audit);
}
