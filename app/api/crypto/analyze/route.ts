// app/api/crypto/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cryptoAudits } from "@/db/schema";
import { redis } from "@/lib/redis";
import { BlockchainServiceFactory } from "@/lib/services/blockchain/factory";
import { RiskScoringService } from "@/lib/services/crypto/risk-scoring.service";
import { ContractAnalysisData } from "@/lib/services/crypto/types";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { address, chain = "ethereum" } = await request.json();

    // Validate input
    if (!address) {
      return NextResponse.json(
        { error: "Contract address is required", status: "error" },
        { status: 400 }
      );
    }

    const blockchainService = BlockchainServiceFactory.getService(chain);

    if (!blockchainService.validateAddress(address)) {
      return NextResponse.json(
        { error: "Invalid contract address format", status: "error" },
        { status: 400 }
      );
    }

    // Check Redis cache (5 min TTL)
    const cacheKey = `crypto:${chain}:${address.toLowerCase()}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("Cache hit (Redis):", cacheKey);
      return NextResponse.json({
        data: cached, // Upstash Redis auto-deserializes JSON
        status: "success",
        cached: true,
      });
    }

    // Check database cache (24 hour TTL)
    const dbCached = await db
      .select()
      .from(cryptoAudits)
      .where(
        and(
          eq(cryptoAudits.contractAddress, address.toLowerCase()),
          eq(cryptoAudits.chain, chain)
        )
      )
      .limit(1);

    if (
      dbCached.length > 0 &&
      dbCached[0].expiresAt &&
      new Date() < dbCached[0].expiresAt
    ) {
      console.log("Cache hit (Database):", cacheKey);

      // Refresh Redis cache (Upstash Redis auto-serializes JSON)
      await redis.setex(cacheKey, 300, dbCached[0]); // 5 min

      return NextResponse.json({
        data: dbCached[0],
        status: "success",
        cached: true,
      });
    }

    // Fetch fresh data (parallel requests)
    const [sourceCode, metadata, holderData, liquidityData] =
      await Promise.allSettled([
        blockchainService.fetchContractSource(address),
        blockchainService.fetchContractMetadata(address),
        blockchainService.fetchHolderDistribution(address),
        blockchainService.fetchLiquidityData(address),
      ]);

    // Build analysis data
    const analysisData: ContractAnalysisData = {
      address: address.toLowerCase(),
      chain,
      sourceCode:
        sourceCode.status === "fulfilled" ? sourceCode.value : undefined,
      metadata: metadata.status === "fulfilled" ? metadata.value : undefined,
      holderData:
        holderData.status === "fulfilled" ? holderData.value : undefined,
      liquidityData:
        liquidityData.status === "fulfilled" ? liquidityData.value : undefined,
    };

    // Run risk analysis
    const riskScoringService = new RiskScoringService();
    const assessment =
      await riskScoringService.calculateRiskScore(analysisData);

    // Prepare audit record
    const auditRecord = {
      contractAddress: address.toLowerCase(),
      chain,
      riskScore: assessment.riskScore,
      riskCategory: assessment.riskCategory,
      flags: assessment.flags,
      metadata: analysisData.metadata,
      confidence: assessment.confidence,
      holderCount: analysisData.holderData?.holderCount,
      topHolderConcentration: analysisData.holderData?.topHolderConcentration,
      liquidityUsd: analysisData.liquidityData?.totalLiquidityUsd,
      isVerified: analysisData.sourceCode?.isVerified ?? false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    // Save to database
    const [saved] = await db
      .insert(cryptoAudits)
      .values(auditRecord)
      .onConflictDoUpdate({
        target: [cryptoAudits.contractAddress, cryptoAudits.chain],
        set: auditRecord,
      })
      .returning();

    // Prepare extended response with Phase 2 data
    const extendedResponse = {
      ...saved,
      recommendation: assessment.recommendation,
      heuristicResults: assessment.heuristicResults,
      // Phase 2: Extended holder data for visualizations
      holderData: analysisData.holderData,
      // Phase 2: Extended liquidity data (placeholder for events)
      liquidityData: {
        ...analysisData.liquidityData,
        events: [], // To be implemented with historical data fetching
        isLocked: false, // To be implemented with lock contract checking
        poolCount: analysisData.liquidityData?.liquidityPairs?.length || 0,
      },
    };

    // Cache in Redis (5 min - Upstash Redis auto-serializes JSON)
    await redis.setex(cacheKey, 300, extendedResponse);

    return NextResponse.json({
      data: extendedResponse,
      status: "success",
      cached: false,
    });
  } catch (error) {
    console.error("Crypto analysis error:", error);

    return NextResponse.json(
      {
        error: "Failed to analyze contract",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const chain = searchParams.get("chain") || "ethereum";

    if (!address) {
      return NextResponse.json(
        { error: "Contract address is required", status: "error" },
        { status: 400 }
      );
    }

    // Check Redis cache first
    const cacheKey = `crypto:${chain}:${address.toLowerCase()}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        data: cached, // Upstash Redis auto-deserializes JSON
        status: "success",
        cached: true,
      });
    }

    // Check database
    const result = await db
      .select()
      .from(cryptoAudits)
      .where(
        and(
          eq(cryptoAudits.contractAddress, address.toLowerCase()),
          eq(cryptoAudits.chain, chain)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Analysis not found", status: "error" },
        { status: 404 }
      );
    }

    // Refresh Redis cache (Upstash Redis auto-serializes JSON)
    await redis.setex(cacheKey, 300, result[0]);

    return NextResponse.json({
      data: result[0],
      status: "success",
      cached: false,
    });
  } catch (error) {
    console.error("Crypto retrieval error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve analysis",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}
