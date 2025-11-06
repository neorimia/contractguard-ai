// app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  cryptoAudits,
  anonymousScans,
  Issue,
  type RiskFlag,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ContractService } from "@/lib/services/contract.service";
import { AIAnalysisService } from "@/lib/services/ai.service";
import { AuthService } from "@/lib/services/auth.service";
import { BlockchainServiceFactory } from "@/lib/services/blockchain/factory";
import { RiskScoringService } from "@/lib/services/crypto/risk-scoring.service";
import { ContractAnalysisData } from "@/lib/services/crypto/types";
import { ReferralService } from "@/lib/services/referral.service";
import { accessValidationService } from "@/lib/services/access-validation.service";
import { getClientInfo } from "@/lib/utils/server-client-info";
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
import { ErrorFactory, createErrorResponse } from "@/lib/utils/error-handler";
import {
  determineReportAccess,
  transformToSummaryReport,
  transformToFullReport,
} from "@/lib/utils/report-access";
import { getAnonymousSessionFromRequest } from "@/lib/middleware/session-tracking";
import type { ReportResponse } from "@/lib/types/report-types";
import { TIER_AI_PROVIDERS } from "@/lib/constants/scan-limits";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const contractService = new ContractService();
const aiService = new AIAnalysisService();
const authService = new AuthService();

// ============================================================================
// DATA TRANSFORMATION HELPERS - Old audits schema → New cryptoAudits schema
// ============================================================================

/**
 * Transform Issue objects to RiskFlag objects
 */
function mapIssueToRiskFlag(issue: Issue, confidence: number): RiskFlag {
  return {
    type: issue.type,
    severity: issue.severity.toUpperCase() as
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "CRITICAL",
    title: issue.type,
    description: issue.description,
    evidence: `${issue.impact}${issue.code ? `\n\nCode:\n${issue.code}` : ""}`,
    confidence,
  };
}

/**
 * Calculate risk category from risk score
 */
function getRiskCategory(riskScore: number): string {
  if (riskScore >= 80) return "critical";
  if (riskScore >= 60) return "high";
  if (riskScore >= 40) return "medium";
  if (riskScore >= 20) return "low";
  return "very_low";
}

/**
 * Parse liquidity string to numeric value
 * Handles formats like "$1,234.56" or "1234.56"
 */
function parseLiquidity(liquidity: string | null | undefined): string | null {
  if (!liquidity) return null;
  try {
    const cleaned = liquidity.replace(/[$,]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Process audit response based on user access level
 * Returns summary report for free/anonymous users, full report for paid users
 */
async function processAuditResponse(
  auditData: any,
  userId: number | null,
  guestSessionId: string | null,
  contractAddress: string,
  chain: string
): Promise<ReportResponse> {
  // Determine access level
  const accessStatus = await determineReportAccess(
    userId,
    guestSessionId,
    contractAddress,
    chain
  );

  console.log("processAuditResponse - determineReportAccess result:", {
    userId,
    guestSessionId,
    contractAddress,
    chain,
    accessStatus,
  });

  // Transform based on access level
  if (accessStatus.accessLevel === "summary") {
    console.log("processAuditResponse - Returning summary report");
    return transformToSummaryReport(auditData);
  } else {
    console.log("processAuditResponse - Returning full report");
    return transformToFullReport(
      auditData,
      accessStatus.accessType as "pro" | "team" | "instant_credit"
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check - Get user from Stack Auth or create anonymous session
    const stackUser = await stackServerApp.getUser();

    // ANONYMOUS FLOW - User not logged in
    if (!stackUser) {
      return await handleAnonymousScan(req);
    }

    // Validate that user has an email
    if (!stackUser.primaryEmail) {
      throw ErrorFactory.invalidUserAccount(
        "User account is missing an email address"
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

      throw ErrorFactory.userSyncFailed(syncError.message);
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
            upgradeUrl: "/sign-in",
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

    // Debug logging for instant credits
    console.log("Access validation result:", {
      userId: appUser.id,
      hasAccess: accessStatus.hasAccess,
      accessType: accessStatus.accessType,
      instantCredits: accessStatus.instantCredits,
      scansRemaining: accessStatus.scansRemaining,
    });

    if (!accessStatus.hasAccess) {
      // Determine upgrade message based on current state
      let upgradeMessage = "Upgrade to Pro for unlimited scans!";
      if (accessStatus.accessType === "instant_credit") {
        upgradeMessage = "Buy more instant credits or upgrade to Pro.";
      }

      return NextResponse.json(
        {
          error: "Access limit exceeded",
          message:
            accessStatus.reason || `No scans available. ${upgradeMessage}`,
          accessType: accessStatus.accessType,
          scansRemaining: 0,
          instantCredits: accessStatus.instantCredits,
          resetAt: accessStatus.resetAt
            ? accessStatus.resetAt.toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day reset
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

    const {
      contractAddress,
      chain = "ethereum",
      aiProvider,
    } = await req.json();

    // Validate address
    if (!contractService.validateAddress(contractAddress)) {
      throw ErrorFactory.invalidAddress();
    }

    // SECURITY: Validate AI provider based on user tier
    const allowedProviders =
      TIER_AI_PROVIDERS[
        accessStatus.accessType as keyof typeof TIER_AI_PROVIDERS
      ] || TIER_AI_PROVIDERS.free;

    if (aiProvider && !allowedProviders.includes(aiProvider as any)) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid AI provider",
          message: `AI provider '${aiProvider}' is not available for ${accessStatus.accessType} tier. Upgrade to Pro for Claude access.`,
          allowedProviders,
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // Use validated AI provider or default to chatgpt
    const validatedAiProvider = allowedProviders.includes(aiProvider as any)
      ? aiProvider
      : "chatgpt";

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

      // Apply access control and transform response
      const processedResponse = await processAuditResponse(
        cached,
        appUser.id,
        null, // No guest session for authenticated users
        normalizedAddress,
        chain
      );

      return NextResponse.json(
        {
          data: processedResponse,
          status: "success",
          cached: true,
        },
        {
          headers: {
            "X-Access-Type": updatedAccessStatus.accessType,
            "X-Scans-Remaining": updatedAccessStatus.scansRemaining.toString(),
            "X-Instant-Credits": updatedAccessStatus.instantCredits.toString(),
            "X-Report-Access-Level": processedResponse.accessLevel,
          },
        }
      );
    }

    // 2. Check database cache (24 hour TTL)
    const existing = await db.query.cryptoAudits.findFirst({
      where: and(
        eq(cryptoAudits.contractAddress, normalizedAddress),
        eq(cryptoAudits.chain, chain)
      ),
    });

    if (existing && isRecent(existing.createdAt, 24 * 60 * 60 * 1000)) {
      console.log("Cache hit (Database)");

      // Update view count
      await db
        .update(cryptoAudits)
        .set({ views: (existing.views || 0) + 1 })
        .where(
          and(
            eq(cryptoAudits.contractAddress, normalizedAddress),
            eq(cryptoAudits.chain, chain)
          )
        );

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

      // Apply access control and transform response
      const processedResponse = await processAuditResponse(
        existing,
        appUser.id,
        null, // No guest session for authenticated users
        normalizedAddress,
        chain
      );

      return NextResponse.json(
        {
          data: processedResponse,
          status: "success",
          cached: true,
        },
        {
          headers: {
            "X-Access-Type": updatedAccessStatus.accessType,
            "X-Scans-Remaining": updatedAccessStatus.scansRemaining.toString(),
            "X-Instant-Credits": updatedAccessStatus.instantCredits.toString(),
            "X-Report-Access-Level": processedResponse.accessLevel,
          },
        }
      );
    }

    // 3. Fetch fresh data using Phase 2 architecture (BlockchainServiceFactory)
    console.log(`Fetching fresh analysis for ${chain}:${normalizedAddress}...`);

    const blockchainService = BlockchainServiceFactory.getService(chain);

    // Parallel data fetching for better performance
    const [
      sourceCodeResult,
      metadataResult,
      holderDataResult,
      liquidityDataResult,
    ] = await Promise.allSettled([
      blockchainService.fetchContractSource(normalizedAddress),
      blockchainService.fetchContractMetadata(normalizedAddress),
      blockchainService.fetchHolderDistribution(normalizedAddress),
      blockchainService.fetchLiquidityData(normalizedAddress),
    ]);

    // Build analysis data
    const analysisData: ContractAnalysisData = {
      address: normalizedAddress,
      chain,
      sourceCode:
        sourceCodeResult.status === "fulfilled"
          ? sourceCodeResult.value
          : undefined,
      metadata:
        metadataResult.status === "fulfilled"
          ? metadataResult.value
          : undefined,
      holderData:
        holderDataResult.status === "fulfilled"
          ? holderDataResult.value
          : undefined,
      liquidityData:
        liquidityDataResult.status === "fulfilled"
          ? liquidityDataResult.value
          : undefined,
    };

    // Check if contract is verified
    if (!analysisData.sourceCode?.isVerified) {
      throw ErrorFactory.contractNotVerified();
    }

    // 4. Hybrid Analysis - RiskScoringService (fast) + AI fallback (accurate)
    console.log("Running hybrid analysis (heuristics + AI)...");

    // Primary: Run heuristic analysis (fast, deterministic)
    const riskScoringService = new RiskScoringService();
    const heuristicAssessment =
      await riskScoringService.calculateRiskScore(analysisData);

    let finalAssessment = heuristicAssessment;
    let usedAI = false;

    // Fallback: Use AI only if heuristic confidence < 70% (hybrid approach)
    // Debug mode: Force AI analysis if aiProvider is specified and confidence < 90%
    const shouldUseAI =
      heuristicAssessment.confidence < 70 ||
      (validatedAiProvider && heuristicAssessment.confidence < 90);

    if (shouldUseAI) {
      console.log(
        `Running AI analysis... (confidence: ${heuristicAssessment.confidence}%, provider: ${validatedAiProvider || "default"})`
      );
      try {
        const aiAnalysis = await aiService.analyzeContract(
          analysisData.sourceCode?.sourceCode || "",
          analysisData.sourceCode?.contractName || "Unknown Contract",
          {
            holderCount: analysisData.holderData?.holderCount,
            liquidity: analysisData.liquidityData?.totalLiquidityUsd
              ? `$${analysisData.liquidityData.totalLiquidityUsd}`
              : "0",
            ownerBalance: "0",
          },
          validatedAiProvider // Use validated AI provider
        );

        // Merge heuristic and AI results
        const aiIssues = aiAnalysis.issues.map((issue) =>
          mapIssueToRiskFlag(issue, aiAnalysis.confidence)
        );
        finalAssessment = {
          riskScore: Math.round(
            (heuristicAssessment.riskScore + aiAnalysis.riskScore) / 2
          ),
          riskCategory: getRiskCategory(
            Math.round(
              (heuristicAssessment.riskScore + aiAnalysis.riskScore) / 2
            )
          ),
          confidence: Math.max(
            heuristicAssessment.confidence,
            aiAnalysis.confidence
          ),
          flags: [...heuristicAssessment.flags, ...aiIssues],
          heuristicResults: heuristicAssessment.heuristicResults,
          recommendation: heuristicAssessment.recommendation,
        };
        usedAI = true;
        console.log("AI analysis completed, merged with heuristics");
      } catch (aiError) {
        console.warn("AI analysis failed, using heuristics only:", aiError);
        // Continue with heuristic-only results
      }
    } else {
      console.log(
        `High confidence (${heuristicAssessment.confidence}%), skipping AI (cost savings!)`
      );
    }

    // 5. Transform and save to database
    const flags: RiskFlag[] = finalAssessment.flags;

    const auditData = {
      contractAddress: normalizedAddress,
      chain,
      riskScore: finalAssessment.riskScore,
      riskCategory: finalAssessment.riskCategory,
      userId: appUser.id, // Track which user created this audit
      flags,
      metadata: {
        deployer: analysisData.metadata?.deployer || "Unknown",
        deployDate:
          analysisData.metadata?.deployDate || new Date().toISOString(),
        sourceCode: analysisData.sourceCode?.sourceCode?.slice(0, 10000) || "", // Store partial
        compiler: analysisData.sourceCode?.compilerVersion || "Unknown",
        txCount: analysisData.metadata?.txCount || 0,
      },
      confidence: finalAssessment.confidence,
      holderCount: analysisData.holderData?.holderCount || 0,
      topHolderConcentration:
        (analysisData.holderData?.topHolderConcentration ?? null) !== null
          ? (
              analysisData.holderData?.topHolderConcentration ?? null
            )?.toString()
          : null,
      liquidityUsd: analysisData.liquidityData?.totalLiquidityUsd || null,
      isVerified: analysisData.sourceCode?.isVerified || false,
      views: 1,
      shares: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h cache TTL
    };

    let result;
    if (existing) {
      const [updated] = await db
        .update(cryptoAudits)
        .set(auditData)
        .where(
          and(
            eq(cryptoAudits.contractAddress, normalizedAddress),
            eq(cryptoAudits.chain, chain)
          )
        )
        .returning();
      result = updated;
    } else {
      const [inserted] = await db
        .insert(cryptoAudits)
        .values(auditData)
        .returning();
      result = inserted;
    }

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

    // Prepare extended response with additional analysis data
    const extendedResponse = {
      ...result,
      recommendation: finalAssessment.recommendation,
      heuristicResults: finalAssessment.heuristicResults,
      // Phase 2: Extended holder data for visualizations
      holderData: analysisData.holderData,
      // Phase 2: Extended liquidity data
      liquidityData: {
        ...analysisData.liquidityData,
        events: [], // To be implemented with historical data fetching
        isLocked: false, // To be implemented with lock contract checking
        poolCount: analysisData.liquidityData?.liquidityPairs?.length || 0,
      },
    };

    // Cache extended response in Redis for future requests
    await redis.set(cacheKey, extendedResponse, { ex: 300 });

    // Apply access control and transform response
    const processedResponse = await processAuditResponse(
      extendedResponse,
      appUser.id,
      null, // No guest session for authenticated users
      normalizedAddress,
      chain
    );

    // Return with access status headers
    return NextResponse.json(
      {
        data: processedResponse,
        status: "success",
        cached: false,
      },
      {
        headers: {
          "X-Access-Type": updatedAccessStatus.accessType,
          "X-Scans-Remaining": updatedAccessStatus.scansRemaining.toString(),
          "X-Instant-Credits": updatedAccessStatus.instantCredits.toString(),
          "X-Report-Access-Level": processedResponse.accessLevel,
        },
      }
    );
  } catch (error: any) {
    // Error logging handled by createErrorResponse
    return createErrorResponse(error, requestId);
  }
}

// Helper to check if timestamp is recent
function isRecent(timestamp: Date | null, maxAge: number): boolean {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() < maxAge;
}

// GET endpoint for retrieving existing audits
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const chain = searchParams.get("chain") || "ethereum";

    if (!address) {
      throw ErrorFactory.missingParameters(["address"]);
    }

    if (!contractService.validateAddress(address)) {
      throw ErrorFactory.invalidAddress();
    }

    const audit = await db.query.cryptoAudits.findFirst({
      where: and(
        eq(cryptoAudits.contractAddress, address.toLowerCase()),
        eq(cryptoAudits.chain, chain)
      ),
    });

    if (!audit) {
      return NextResponse.json(
        {
          status: "error",
          error: "Audit not found",
          message: "No audit found for this contract address",
        },
        { status: 404 }
      );
    }

    // Determine user context for access control
    const stackUser = await stackServerApp.getUser();
    let userId: number | null = null;
    let guestSessionId: string | null = null;

    if (stackUser) {
      try {
        const appUser = await authService.getUserByStackId(stackUser.id);
        userId = appUser?.id || null;
      } catch (error) {
        // User lookup failed, continue as anonymous
        console.warn("Failed to lookup user for GET request:", error);
      }
    } else {
      // Try to get anonymous session ID
      guestSessionId = getAnonymousSessionFromRequest(req);
    }

    // Apply access control and transform response
    const processedResponse = await processAuditResponse(
      audit,
      userId,
      guestSessionId,
      address.toLowerCase(),
      chain
    );

    return NextResponse.json({
      data: processedResponse,
      status: "success",
    });
  } catch (error: any) {
    // Error logging handled by createErrorResponse
    return createErrorResponse(error, requestId);
  }
}

/**
 * Handle anonymous user scans (no account required)
 * Allows up to 3 scans per session (24h cookie)
 */
async function handleAnonymousScan(req: NextRequest) {
  const requestId = crypto.randomUUID();

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

    const {
      contractAddress,
      chain = "ethereum",
      aiProvider,
    } = await req.json();

    // Validate address
    if (!contractService.validateAddress(contractAddress)) {
      throw ErrorFactory.invalidAddress();
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

      // Apply access control and transform response
      const processedResponse = await processAuditResponse(
        cached,
        null, // No user ID for anonymous users
        sessionId,
        normalizedAddress,
        chain
      );

      return NextResponse.json(
        {
          data: processedResponse,
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
            "X-Report-Access-Level": processedResponse.accessLevel,
          },
        }
      );
    }

    // Check database cache (24 hour TTL)
    const existing = await db.query.cryptoAudits.findFirst({
      where: and(
        eq(cryptoAudits.contractAddress, normalizedAddress),
        eq(cryptoAudits.chain, chain)
      ),
    });

    if (existing && isRecent(existing.createdAt, 24 * 60 * 60 * 1000)) {
      console.log("Cache hit (Database) - Anonymous user");

      // Update view count
      await db
        .update(cryptoAudits)
        .set({ views: (existing.views || 0) + 1 })
        .where(
          and(
            eq(cryptoAudits.contractAddress, normalizedAddress),
            eq(cryptoAudits.chain, chain)
          )
        );

      // Cache in Redis
      await redis.set(cacheKey, existing, { ex: 300 });

      // Increment scan count
      const newCount = await incrementAnonymousScanCount(sessionId);
      const remaining = await getRemainingAnonymousScans(sessionId);

      // Apply access control and transform response
      const processedResponse = await processAuditResponse(
        existing,
        null, // No user ID for anonymous users
        sessionId,
        normalizedAddress,
        chain
      );

      return NextResponse.json(
        {
          data: processedResponse,
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
            "X-Report-Access-Level": processedResponse.accessLevel,
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
      throw ErrorFactory.contractNotVerified();
    }

    // Get enrichment data and holder distribution data
    const blockchainService = BlockchainServiceFactory.getService(chain);
    const [enrichmentDataResult, holderDataResult] = await Promise.allSettled([
      contractService.getEnrichmentData(normalizedAddress, chain),
      blockchainService.fetchHolderDistribution(normalizedAddress),
    ]);

    const enrichmentData =
      enrichmentDataResult.status === "fulfilled"
        ? enrichmentDataResult.value
        : {
            holderCount: 0,
            liquidity: "0",
            ownerBalance: "0",
            recentTransactions: 0,
          };

    const holderData =
      holderDataResult.status === "fulfilled"
        ? holderDataResult.value
        : {
            holderCount: 0,
            topHolderConcentration: 0,
            topHolders: [],
          };

    // AI Analysis
    const analysis = await aiService.analyzeContract(
      contractData.sourceCode,
      contractData.contractName,
      enrichmentData,
      aiProvider // Pass AI provider preference
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

    // Also save to main crypto_audits table for caching
    const flags: RiskFlag[] = allIssues.map((issue) =>
      mapIssueToRiskFlag(issue, analysis.confidence)
    );

    const auditData = {
      contractAddress: normalizedAddress,
      chain,
      riskScore: finalRiskScore,
      riskCategory: getRiskCategory(finalRiskScore),
      userId: null, // Anonymous users have no user_id
      flags,
      metadata: {
        deployer: contractData.deployer || "Unknown",
        deployDate: contractData.deployDate || new Date().toISOString(),
        sourceCode: contractData.sourceCode.slice(0, 10000),
        compiler: contractData.compiler,
        txCount: enrichmentData.recentTransactions,
      },
      confidence: analysis.confidence,
      holderCount: holderData.holderCount || enrichmentData.holderCount,
      topHolderConcentration:
        (holderData.topHolderConcentration ?? null) !== null
          ? holderData.topHolderConcentration.toString()
          : null,
      liquidityUsd: parseLiquidity(enrichmentData.liquidity),
      isVerified: contractData.isVerified,
      views: 1,
      shares: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    let auditResult;
    const existingAudit = await db.query.cryptoAudits.findFirst({
      where: and(
        eq(cryptoAudits.contractAddress, normalizedAddress),
        eq(cryptoAudits.chain, chain)
      ),
    });

    if (existingAudit) {
      const [updated] = await db
        .update(cryptoAudits)
        .set(auditData)
        .where(
          and(
            eq(cryptoAudits.contractAddress, normalizedAddress),
            eq(cryptoAudits.chain, chain)
          )
        )
        .returning();
      auditResult = updated;
    } else {
      const [inserted] = await db
        .insert(cryptoAudits)
        .values(auditData)
        .returning();
      auditResult = inserted;
    }

    // Cache in Redis
    await redis.set(cacheKey, auditResult, { ex: 300 });

    // Increment scan count
    const newCount = await incrementAnonymousScanCount(sessionId);
    const remaining = await getRemainingAnonymousScans(sessionId);

    // Apply access control and transform response
    const processedResponse = await processAuditResponse(
      auditResult,
      null, // No user ID for anonymous users
      sessionId,
      normalizedAddress,
      chain
    );

    // Return result with metadata
    return NextResponse.json(
      {
        data: processedResponse,
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
          "X-Report-Access-Level": processedResponse.accessLevel,
        },
      }
    );
  } catch (error: any) {
    // Error logging handled by createErrorResponse
    return createErrorResponse(error, requestId);
  }
}
