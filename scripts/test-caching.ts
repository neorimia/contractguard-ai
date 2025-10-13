/**
 * Caching Test Script
 *
 * Tests Redis and Database caching functionality
 *
 * Usage: npx tsx scripts/test-caching.ts
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const TEST_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT

// Import database modules dynamically after env is loaded
let db: any;
let cryptoAudits: any;

async function initDb() {
  const dbModule = await import("@/db");
  const schemaModule = await import("@/db/schema");
  db = dbModule.db;
  cryptoAudits = schemaModule.cryptoAudits;
}

async function testRedisCache() {
  console.log("\n🧪 Testing Redis Cache...\n");

  try {
    const cacheKey = `audit:ethereum:${TEST_ADDRESS}`;
    const testData = {
      contractAddress: TEST_ADDRESS,
      riskScore: 25,
      summary: "Test cache data",
      createdAt: new Date(),
    };

    // Test 1: Write to cache
    console.log("✓ Test 1: Writing to Redis cache");
    await redis.set(cacheKey, testData, { ex: 60 }); // 60 second TTL
    console.log("  - Data written successfully");

    // Test 2: Read from cache
    console.log("\n✓ Test 2: Reading from Redis cache");
    const cached = await redis.get(cacheKey);
    console.log("  - Data retrieved:", cached ? "✓" : "✗");

    if (!cached) {
      throw new Error("Failed to retrieve cached data");
    }

    // Test 3: TTL check
    console.log("\n✓ Test 3: Checking TTL");
    const ttl = await redis.ttl(cacheKey);
    console.log(`  - TTL: ${ttl} seconds`);

    if (ttl <= 0 || ttl > 60) {
      throw new Error("Invalid TTL");
    }

    // Test 4: Delete cache
    console.log("\n✓ Test 4: Deleting cache entry");
    await redis.del(cacheKey);
    const deletedCheck = await redis.get(cacheKey);
    console.log("  - Cache deleted:", deletedCheck === null ? "✓" : "✗");

    console.log("\n✅ Redis cache tests passed!");
    return true;
  } catch (error) {
    console.error("\n❌ Redis cache test failed:", error);
    return false;
  }
}

async function testDatabaseCache() {
  console.log("\n🧪 Testing Database Cache...\n");

  try {
    const testAddress = `test_${Date.now()}`.toLowerCase();

    // Test 1: Insert audit
    console.log("✓ Test 1: Inserting audit record");
    const auditData = {
      contractAddress: testAddress,
      chain: "ethereum",
      riskScore: 30,
      riskCategory: "low",
      flags: [
        {
          type: "test",
          severity: "low" as const,
          title: "Test Flag",
          description: "Test description",
          evidence: "Test evidence",
          confidence: 85,
        },
      ],
      metadata: {
        deployer: "Test",
        deployDate: new Date().toISOString(),
        sourceCode: "test code",
        compiler: "0.8.0",
        txCount: 100,
      },
      confidence: 85,
      holderCount: 100,
      topHolderConcentration: null,
      liquidityUsd: "100000",
      isVerified: true,
      views: 1,
      shares: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    await db.insert(cryptoAudits).values(auditData);
    console.log("  - Audit inserted successfully");

    // Test 2: Query audit
    console.log("\n✓ Test 2: Querying audit record");
    const { and: andFn } = await import("drizzle-orm");
    const result = await db.query.cryptoAudits.findFirst({
      where: andFn(
        eq(cryptoAudits.contractAddress, testAddress),
        eq(cryptoAudits.chain, "ethereum")
      ),
    });

    console.log("  - Audit found:", result ? "✓" : "✗");

    if (!result) {
      throw new Error("Failed to retrieve audit from database");
    }

    console.log(`  - Risk Score: ${result.riskScore}`);
    console.log(`  - Risk Category: ${result.riskCategory}`);

    // Test 3: Update audit (views)
    console.log("\n✓ Test 3: Updating audit views");
    await db
      .update(cryptoAudits)
      .set({ views: (result.views || 0) + 1 })
      .where(
        andFn(
          eq(cryptoAudits.contractAddress, testAddress),
          eq(cryptoAudits.chain, "ethereum")
        )
      );

    const updated = await db.query.cryptoAudits.findFirst({
      where: andFn(
        eq(cryptoAudits.contractAddress, testAddress),
        eq(cryptoAudits.chain, "ethereum")
      ),
    });

    console.log(`  - Views before: ${result.views}, after: ${updated?.views}`);

    if (updated?.views !== (result.views || 0) + 1) {
      throw new Error("Failed to update views");
    }

    // Test 4: Clean up
    console.log("\n✓ Test 4: Cleaning up test data");
    // Note: We'll leave the test data for manual verification
    // In production, you'd want to delete it
    console.log("  - Test data left in database for verification");
    console.log(`  - Contract Address: ${testAddress}`);

    console.log("\n✅ Database cache tests passed!");
    return true;
  } catch (error) {
    console.error("\n❌ Database cache test failed:", error);
    return false;
  }
}

async function runCachingTests() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║   Caching System Test Suite                               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Initialize database connection after env is loaded
  await initDb();

  const results = {
    redis: false,
    database: false,
  };

  results.redis = await testRedisCache();
  results.database = await testDatabaseCache();

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║   Test Summary                                             ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  console.log(`Redis Cache:      ${results.redis ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Database Cache:   ${results.database ? "✅ PASS" : "❌ FAIL"}`);

  const allPassed = Object.values(results).every((r) => r);

  if (allPassed) {
    console.log("\n🎉 All caching tests passed!\n");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed. Check configuration.\n");
    process.exit(1);
  }
}

runCachingTests().catch((error) => {
  console.error("\n💥 Test suite crashed:", error);
  process.exit(1);
});
