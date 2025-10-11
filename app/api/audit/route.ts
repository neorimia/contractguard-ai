// app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { audits, anonymousScans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ContractService } from "@/lib/services/contract.service";
import { AIAnalysisService } from "@/lib/services/ai.service";
import { AuthService } from "@/lib/services/auth.service";
import { ReferralService } from "@/lib/services/referral.service";
import { accessValidationService } from "@/lib/services/access-validation.service";
import { getClientInfo } from "@/lib/utils/client-info";
import { Redis } from "@upstash/redis";
import { stackServerApp } from "@/stack/server";
import {
  getOrCreateAnonymousSession,
  getAnonymousScanCount,
  incrementAnonymousScanCount,
  hasReachedAnonymousLimit,
  getRemainingAnonymousScans,
  ANONYMOUS_SCAN_LIMITS,
} from "@/lib/middleware/session-tracking";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const contractService = new ContractService();
const aiService = new AIAnalysisService();
const authService = new AuthService();

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check - Get user from Stack Auth or create anonymous session
    const stackUser = await stackServerApp.getUser();

    // ANONYMOUS FLOW - User not logged in
    if (!stackUser) {
      return await handleAnonymousScan(req);
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

    // 3. Check if soft account needs upgrade
    if (appUser.accountType === "soft") {
      // Soft accounts follow free tier rules (3 scans/day)
      const now = new Date();
      const resetAt = appUser.scansResetAt
        ? new Date(appUser.scansResetAt)
        : null;

      // Check if reset needed
      const needsReset = !resetAt || now >= resetAt;
      const scansUsed = needsReset ? 0 : appUser.scansToday || 0;
      const scansRemaining = Math.max(0, 3 - scansUsed);

      if (!needsReset && scansRemaining === 0) {
        // Soft account hit free tier limit - require upgrade
        return NextResponse.json(
          {
            status: "error",
            error: "Account upgrade required",
            message: "Complete your account setup to continue scanning",
            action: "upgrade_required",
            accountType: "soft",
            scansRemaining: 0,
            upgradeUrl: "/handler/sign-up",
          },
          {
            status: 403,
            headers: {
              "X-Access-Type": "soft",
              "X-Scans-Remaining": "0",
            },
          }
        );
      }
    }

    // 4. Hybrid access validation (Pro/Team → Instant Credits → Free Tier)
    const accessStatus = await accessValidationService.validateAccess(
      appUser.id
    );

    if (!accessStatus.hasAccess) {
      // Determine upgrade message based on current state
      let upgradeMessage = "Upgrade to Pro for unlimited scans!";
      if (accessStatus.accessType === "instant_credit") {
        upgradeMessage = "Buy more instant reports or upgrade to Pro.";
      }

      return NextResponse.json(
        {
          error: "Access limit exceeded",
          message:
            accessStatus.reason || `No scans available. ${upgradeMessage}`,
          accessType: accessStatus.accessType,
          scansRemaining: 0,
          instantCredits: accessStatus.instantCredits,
          upgradeUrl: "/pricing",
          status: "error",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-Access-Type": accessStatus.accessType,
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
      console.log("Cache hit (Redis)");

      // Consume scan even for cached results
      await accessValidationService.consumeScan(
        appUser.id,
        accessStatus.accessType
      );

      // Get updated access status
      const updatedAccessStatus = await accessValidationService.getAccessStatus(
        appUser.id
      );

      return NextResponse.json(cached, {
        headers: {
          "X-Access-Type": updatedAccessStatus.accessType,
          "X-Scans-Remaining": updatedAccessStatus.scansRemaining.toString(),
          "X-Instant-Credits": updatedAccessStatus.instantCredits.toString(),
        },
      });
    }

    // 2. Check database cache (24 hour TTL)
    const existing = await db.query.audits.findFirst({
      where: eq(audits.contractAddress, normalizedAddress),
    });

    if (existing && isRecent(existing.createdAt, 24 * 60 * 60 * 1000)) {
      console.log("Cache hit (Database)");

      // Update view count
      await db
        .update(audits)
        .set({ views: (existing.views || 0) + 1 })
        .where(eq(audits.contractAddress, normalizedAddress));

      await redis.set(cacheKey, existing, { ex: 300 }); // 5 min cache

      // Consume scan for cached result
      await accessValidationService.consumeScan(
        appUser.id,
        accessStatus.accessType
      );

      // Get updated access status
      const updatedAccessStatus = await accessValidationService.getAccessStatus(
        appUser.id
      );

      return NextResponse.json(existing, {
        headers: {
          "X-Access-Type": updatedAccessStatus.accessType,
          "X-Scans-Remaining": updatedAccessStatus.scansRemaining.toString(),
          "X-Instant-Credits": updatedAccessStatus.instantCredits.toString(),
        },
      });
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

    // 9. Consume scan based on access type
    await accessValidationService.consumeScan(
      appUser.id,
      accessStatus.accessType
    );

    // 10. Get updated access status after consumption
    const updatedAccessStatus = await accessValidationService.getAccessStatus(
      appUser.id
    );

    // ============================================================
    // REFERRAL SYSTEM INTEGRATION
    // Confirm referral on first audit completion
    // ============================================================
    try {
      // Fetch updated user to get current scan count
      const updatedUser = await authService.getUserById(appUser.id);

      // Check if this is the user's first audit
      // For free tier: scansToday === 1
      // For instant credit: instantCreditsUsedToday === 1
      const isFirstAudit =
        updatedUser &&
        ((accessStatus.accessType === "free" && updatedUser.scansToday === 1) ||
          (accessStatus.accessType === "instant_credit" &&
            updatedUser.instantCreditsUsedToday === 1) ||
          (["pro", "team"].includes(accessStatus.accessType) &&
            updatedUser.scansToday === 1));

      if (updatedUser && isFirstAudit) {
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

    // Return with access status headers
    return NextResponse.json(result, {
      headers: {
        "X-Access-Type": updatedAccessStatus.accessType,
        "X-Scans-Remaining": updatedAccessStatus.scansRemaining.toString(),
        "X-Instant-Credits": updatedAccessStatus.instantCredits.toString(),
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

/**
 * Handle anonymous user scans (no account required)
 * Allows up to 3 scans per session (24h cookie)
 */
async function handleAnonymousScan(req: NextRequest) {
  try {
    // Get or create anonymous session
    const sessionId = await getOrCreateAnonymousSession(req);
    const currentScanCount = await getAnonymousScanCount(sessionId);

    // Check if limit reached
    if (await hasReachedAnonymousLimit(sessionId)) {
      return NextResponse.json(
        {
          error: "Anonymous scan limit reached",
          message:
            "Create a free account to continue scanning (3 free scans per day)",
          action: "signup_required",
          scansPerformed: currentScanCount,
          maxScans: ANONYMOUS_SCAN_LIMITS.MAX_SCANS,
          sessionId, // Include sessionId for soft signup drawer
          status: "error",
        },
        {
          status: 429,
          headers: {
            "X-Access-Type": "anonymous",
            "X-Scans-Remaining": "0",
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

    // Check Redis cache first (5 minute TTL)
    const cacheKey = `audit:${chain}:${normalizedAddress}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("Cache hit (Redis) - Anonymous user");

      // Increment scan count even for cached results
      const newCount = await incrementAnonymousScanCount(sessionId);
      const remaining = await getRemainingAnonymousScans(sessionId);

      return NextResponse.json(
        {
          ...cached,
          metadata: {
            accessType: "anonymous",
            scansRemaining: remaining,
            prompt: remaining <= 1 ? "Create account to save your scans" : null,
          },
        },
        {
          headers: {
            "X-Access-Type": "anonymous",
            "X-Scans-Remaining": remaining.toString(),
            "X-Session-Id": sessionId,
          },
        }
      );
    }

    // Check database cache (24 hour TTL)
    const existing = await db.query.audits.findFirst({
      where: eq(audits.contractAddress, normalizedAddress),
    });

    if (existing && isRecent(existing.createdAt, 24 * 60 * 60 * 1000)) {
      console.log("Cache hit (Database) - Anonymous user");

      // Update view count
      await db
        .update(audits)
        .set({ views: (existing.views || 0) + 1 })
        .where(eq(audits.contractAddress, normalizedAddress));

      // Cache in Redis
      await redis.set(cacheKey, existing, { ex: 300 });

      // Increment scan count
      const newCount = await incrementAnonymousScanCount(sessionId);
      const remaining = await getRemainingAnonymousScans(sessionId);

      return NextResponse.json(
        {
          ...existing,
          metadata: {
            accessType: "anonymous",
            scansRemaining: remaining,
            prompt: remaining <= 1 ? "Create account to save your scans" : null,
          },
        },
        {
          headers: {
            "X-Access-Type": "anonymous",
            "X-Scans-Remaining": remaining.toString(),
            "X-Session-Id": sessionId,
          },
        }
      );
    }

    // Fetch fresh analysis
    console.log("Fetching fresh analysis for anonymous user...");

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

    // Get enrichment data
    const enrichmentData = await contractService.getEnrichmentData(
      normalizedAddress,
      chain
    );

    // AI Analysis
    const analysis = await aiService.analyzeContract(
      contractData.sourceCode,
      contractData.contractName,
      enrichmentData
    );

    // Pattern-based detection
    const patternIssues = aiService.detectKnownPatterns(
      contractData.sourceCode
    );

    const allIssues = [...analysis.issues, ...patternIssues];

    const finalRiskScore =
      patternIssues.length > 0
        ? Math.max(
            analysis.riskScore,
            patternIssues.some((i) => i.severity === "CRITICAL") ? 90 : 70
          )
        : analysis.riskScore;

    // Save to anonymous_scans table (expires in 24h)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const anonymousScanData = {
      sessionId,
      contractAddress: normalizedAddress,
      chain,
      riskScore: finalRiskScore,
      summary: analysis.summary,
      issues: allIssues,
      recommendation: analysis.recommendation,
      expiresAt,
    };

    const [result] = await db
      .insert(anonymousScans)
      .values(anonymousScanData)
      .returning();

    // Also save to main audits table for caching
    const auditData = {
      contractAddress: normalizedAddress,
      chain,
      sourceCode: contractData.sourceCode.slice(0, 10000),
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

    let auditResult;
    const existingAudit = await db.query.audits.findFirst({
      where: eq(audits.contractAddress, normalizedAddress),
    });

    if (existingAudit) {
      const [updated] = await db
        .update(audits)
        .set({ ...auditData, updatedAt: new Date() })
        .where(eq(audits.contractAddress, normalizedAddress))
        .returning();
      auditResult = updated;
    } else {
      const [inserted] = await db.insert(audits).values(auditData).returning();
      auditResult = inserted;
    }

    // Cache in Redis
    await redis.set(cacheKey, auditResult, { ex: 300 });

    // Increment scan count
    const newCount = await incrementAnonymousScanCount(sessionId);
    const remaining = await getRemainingAnonymousScans(sessionId);

    // Return result with metadata
    return NextResponse.json(
      {
        ...auditResult,
        metadata: {
          accessType: "anonymous",
          scansRemaining: remaining,
          prompt:
            remaining <= 1
              ? "Create account to save your scans and continue"
              : remaining === 2
                ? "Sign up to track your scan history"
                : null,
          sessionId,
        },
      },
      {
        headers: {
          "X-Access-Type": "anonymous",
          "X-Scans-Remaining": remaining.toString(),
          "X-Session-Id": sessionId,
        },
      }
    );
  } catch (error: any) {
    console.error("Anonymous scan error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error.message },
      { status: 500 }
    );
  }
}
