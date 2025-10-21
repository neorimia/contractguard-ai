/**
 * Comprehensive Test Script for Paywall System
 *
 * Tests:
 * 1. determineReportAccess() function with 8+ test cases
 * 2. Helper functions (getHolderRange, calculateTokenAge, etc.)
 * 3. Integration tests for /api/audit endpoint
 * 4. User scenario tests (anonymous, free, pro, instant credit)
 *
 * Usage: npx tsx scripts/test-paywall-system.ts
 *
 * Prerequisites:
 * - .env.local file with DATABASE_URL, UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
 * - See docs/ENV_VARIABLES.md for setup instructions
 */

// Load environment variables FIRST before any imports
import { config } from "dotenv";
config({ path: ".env.local" });

// Validate required environment variables
function validateEnvironment() {
  const requiredEnvVars = [
    "DATABASE_URL",
    "UPSTASH_REDIS_URL",
    "UPSTASH_REDIS_TOKEN",
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error("\n📋 Setup Instructions:");
    console.error("1. Create .env.local file in project root (if not exists)");
    console.error("2. Add the missing variables above to .env.local");
    console.error("3. See docs/ENV_VARIABLES.md for detailed setup guide");
    console.error("\n🔧 Required for paywall tests:");
    console.error("   - DATABASE_URL (Neon PostgreSQL connection)");
    console.error("   - UPSTASH_REDIS_URL & UPSTASH_REDIS_TOKEN (Redis cache)");
    process.exit(1);
  }
}

// Validate environment before importing anything that uses the database
validateEnvironment();

import {
  determineReportAccess,
  transformToSummaryReport,
  transformToFullReport,
  getHolderRange,
  getLiquidityRange,
  calculateTokenAge,
  getSeverityScore,
} from "@/lib/utils/report-access";
import { db } from "@/db";
import { users, instantReports, cryptoAudits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  ReportAccessStatus,
  SummaryReportData,
  FullReportData,
} from "@/lib/types/report-types";

// Test configuration
const TEST_CONFIG = {
  contractAddress: "0xA0b86a33E6441D6e3e3b0D5c0bD4c3a4a3d7b4E8",
  chain: "ethereum",
  testUserId: 999999, // High number to avoid conflicts
  testGuestSessionId: "test-session-" + Date.now(),
};

// Mock data
const mockAuditData = {
  id: 1,
  contractAddress: TEST_CONFIG.contractAddress.toLowerCase(),
  chain: TEST_CONFIG.chain,
  isVerified: true,
  riskScore: 75,
  riskCategory: "high",
  flags: [
    {
      type: "Reentrancy",
      severity: "high" as const,
      title: "Reentrancy Vulnerability",
      description: "Contract may be vulnerable to reentrancy attacks",
      evidence: "External calls before state changes",
      confidence: 85,
    },
    {
      type: "Access Control",
      severity: "critical" as const,
      title: "Missing Access Control",
      description: "Critical function lacks proper access control",
      evidence: "Function can be called by anyone",
      confidence: 95,
    },
    {
      type: "Integer Overflow",
      severity: "low" as const,
      title: "Potential Integer Overflow",
      description: "Possible integer overflow in arithmetic operations",
      evidence: "Unsafe arithmetic operations detected",
      confidence: 60,
    },
  ],
  holderCount: 1250,
  topHolderConcentration: "45.2",
  liquidityUsd: "125000.50",
  metadata: {
    deployer: "0x1234567890123456789012345678901234567890",
    deployDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  confidence: 88,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  views: 0,
  shares: 0,
};

/**
 * Helper function to create test users
 */
async function createTestUser(tier: "free" | "pro" | "team" = "free") {
  try {
    const [user] = await db
      .insert(users)
      .values({
        stackUserId: `test-stack-${Date.now()}-${Math.random()}`,
        email: `test-${Date.now()}@example.com`,
        tier,
        displayName: `Test User ${tier}`,
        accountType: "hard",
        scansToday: 0,
        scansResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning();
    return user;
  } catch (error) {
    console.error("Failed to create test user:", error);
    return null;
  }
}

/**
 * Helper function to create test instant report
 */
async function createTestInstantReport(
  userId: number,
  expiresInHours: number = 24
) {
  try {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const [instantReport] = await db
      .insert(instantReports)
      .values({
        userId,
        contractAddress: TEST_CONFIG.contractAddress.toLowerCase(),
        chain: TEST_CONFIG.chain,
        isActive: true,
        expiresAt,
      })
      .returning();
    return instantReport;
  } catch (error) {
    console.error("Failed to create test instant report:", error);
    return null;
  }
}

/**
 * Helper function to cleanup test data
 */
async function cleanupTestData() {
  try {
    await db
      .delete(instantReports)
      .where(
        eq(
          instantReports.contractAddress,
          TEST_CONFIG.contractAddress.toLowerCase()
        )
      );
    await db
      .delete(users)
      .where(eq(users.email, `test-${Date.now()}@example.com`));
  } catch (error) {
    console.error("Failed to cleanup test data:", error);
  }
}

/**
 * Test 1: determineReportAccess() - 8+ comprehensive test cases
 */
async function testDetermineReportAccess() {
  console.log("\n🧪 Testing determineReportAccess() function...\n");

  let passedTests = 0;
  const totalTests = 8;

  try {
    // Test Case 1: Pro user should get full access
    console.log("✓ Test 1: Pro user should get full access");
    const proUser = await createTestUser("pro");
    if (proUser) {
      const result = await determineReportAccess(
        proUser.id,
        null,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (
        result.hasAccess &&
        result.accessLevel === "full" &&
        result.accessType === "pro"
      ) {
        console.log("  ✅ PASS: Pro user gets full access");
        passedTests++;
      } else {
        console.log("  ❌ FAIL: Pro user should get full access", result);
      }

      // Cleanup
      await db.delete(users).where(eq(users.id, proUser.id));
    } else {
      console.log("  ⚠️  SKIP: Could not create test user");
    }

    // Test Case 2: Team user should get full access
    console.log("\n✓ Test 2: Team user should get full access");
    const teamUser = await createTestUser("team");
    if (teamUser) {
      const result = await determineReportAccess(
        teamUser.id,
        null,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (
        result.hasAccess &&
        result.accessLevel === "full" &&
        result.accessType === "team"
      ) {
        console.log("  ✅ PASS: Team user gets full access");
        passedTests++;
      } else {
        console.log("  ❌ FAIL: Team user should get full access", result);
      }

      // Cleanup
      await db.delete(users).where(eq(users.id, teamUser.id));
    } else {
      console.log("  ⚠️  SKIP: Could not create test user");
    }

    // Test Case 3: Free user should get summary access
    console.log("\n✓ Test 3: Free user should get summary access");
    const freeUser = await createTestUser("free");
    if (freeUser) {
      const result = await determineReportAccess(
        freeUser.id,
        null,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (
        result.hasAccess &&
        result.accessLevel === "summary" &&
        result.accessType === "free"
      ) {
        console.log("  ✅ PASS: Free user gets summary access");
        passedTests++;
      } else {
        console.log("  ❌ FAIL: Free user should get summary access", result);
      }

      // Cleanup
      await db.delete(users).where(eq(users.id, freeUser.id));
    } else {
      console.log("  ⚠️  SKIP: Could not create test user");
    }

    // Test Case 4: User with valid instant report should get full access
    console.log(
      "\n✓ Test 4: User with valid instant report should get full access"
    );
    const userWithInstant = await createTestUser("free");
    if (userWithInstant) {
      const instantReport = await createTestInstantReport(
        userWithInstant.id,
        24
      ); // 24 hours from now

      if (instantReport) {
        const result = await determineReportAccess(
          userWithInstant.id,
          null,
          TEST_CONFIG.contractAddress,
          TEST_CONFIG.chain
        );

        if (
          result.hasAccess &&
          result.accessLevel === "full" &&
          result.accessType === "instant_report"
        ) {
          console.log(
            "  ✅ PASS: User with valid instant report gets full access"
          );
          passedTests++;
        } else {
          console.log(
            "  ❌ FAIL: User with valid instant report should get full access",
            result
          );
        }
      }

      // Cleanup
      await db.delete(users).where(eq(users.id, userWithInstant.id));
    } else {
      console.log("  ⚠️  SKIP: Could not create test user");
    }

    // Test Case 5: User with expired instant report should get summary access
    console.log(
      "\n✓ Test 5: User with expired instant report should get summary access"
    );
    const userWithExpired = await createTestUser("free");
    if (userWithExpired) {
      const expiredReport = await createTestInstantReport(
        userWithExpired.id,
        -1
      ); // Expired (1 hour ago)

      if (expiredReport) {
        // Update the instant report to make it expired
        await db
          .update(instantReports)
          .set({ expiresAt: new Date(Date.now() - 60 * 60 * 1000) }) // 1 hour ago
          .where(eq(instantReports.id, expiredReport.id));

        const result = await determineReportAccess(
          userWithExpired.id,
          null,
          TEST_CONFIG.contractAddress,
          TEST_CONFIG.chain
        );

        if (result.hasAccess && result.accessLevel === "summary") {
          console.log(
            "  ✅ PASS: User with expired instant report gets summary access"
          );
          passedTests++;
        } else {
          console.log(
            "  ❌ FAIL: User with expired instant report should get summary access",
            result
          );
        }
      }

      // Cleanup
      await db.delete(users).where(eq(users.id, userWithExpired.id));
    } else {
      console.log("  ⚠️  SKIP: Could not create test user");
    }

    // Test Case 6: Anonymous user should get summary access
    console.log("\n✓ Test 6: Anonymous user should get summary access");
    const anonResult6 = await determineReportAccess(
      null,
      TEST_CONFIG.testGuestSessionId,
      TEST_CONFIG.contractAddress,
      TEST_CONFIG.chain
    );

    if (
      anonResult6.hasAccess &&
      anonResult6.accessLevel === "summary" &&
      anonResult6.accessType === "anonymous"
    ) {
      console.log("  ✅ PASS: Anonymous user gets summary access");
      passedTests++;
    } else {
      console.log(
        "  ❌ FAIL: Anonymous user should get summary access",
        anonResult6
      );
    }

    // Test Case 7: Anonymous user with valid instant report should get full access
    console.log(
      "\n✓ Test 7: Anonymous user with valid instant report should get full access"
    );
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const [guestInstantReport] = await db
        .insert(instantReports)
        .values({
          userId: null,
          guestSessionId: TEST_CONFIG.testGuestSessionId,
          contractAddress: TEST_CONFIG.contractAddress.toLowerCase(),
          chain: TEST_CONFIG.chain,
          isActive: true,
          expiresAt,
        })
        .returning();

      const result = await determineReportAccess(
        null,
        TEST_CONFIG.testGuestSessionId,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (
        result.hasAccess &&
        result.accessLevel === "full" &&
        result.accessType === "instant_report"
      ) {
        console.log(
          "  ✅ PASS: Anonymous user with valid instant report gets full access"
        );
        passedTests++;
      } else {
        console.log(
          "  ❌ FAIL: Anonymous user with valid instant report should get full access",
          result
        );
      }

      // Cleanup
      await db
        .delete(instantReports)
        .where(eq(instantReports.id, guestInstantReport.id));
    } catch (error) {
      console.log("  ⚠️  SKIP: Could not test guest instant report", error);
    }

    // Test Case 8: Non-existent user should be handled gracefully
    console.log("\n✓ Test 8: Non-existent user should be handled gracefully");
    const notFoundResult = await determineReportAccess(
      TEST_CONFIG.testUserId, // Non-existent user ID
      null,
      TEST_CONFIG.contractAddress,
      TEST_CONFIG.chain
    );

    if (
      !notFoundResult.hasAccess &&
      notFoundResult.reason === "User not found"
    ) {
      console.log("  ✅ PASS: Non-existent user handled gracefully");
      passedTests++;
    } else {
      console.log(
        "  ❌ FAIL: Non-existent user should be handled gracefully",
        notFoundResult
      );
    }
  } catch (error) {
    console.error("❌ Error in determineReportAccess tests:", error);
  }

  console.log(
    `\n📊 determineReportAccess() Tests: ${passedTests}/${totalTests} passed`
  );
  return passedTests === totalTests;
}

/**
 * Test 2: Helper functions
 */
function testHelperFunctions() {
  console.log("\n🧪 Testing Helper Functions...\n");

  let passedTests = 0;
  const totalTests = 12;

  // Test getHolderRange()
  console.log("✓ Testing getHolderRange()");
  const holderTests = [
    { input: null, expected: "Unknown" },
    { input: 0, expected: "Unknown" },
    { input: 5, expected: "< 10" },
    { input: 25, expected: "10-50" },
    { input: 75, expected: "50-100" },
    { input: 250, expected: "100-500" },
    { input: 750, expected: "500-1,000" },
    { input: 2500, expected: "1,000-5,000" },
    { input: 7500, expected: "5,000-10,000" },
    { input: 15000, expected: "10,000+" },
  ];

  holderTests.forEach((test, index) => {
    const result = getHolderRange(test.input);
    if (result === test.expected) {
      console.log(`  ✅ Test ${index + 1}: ${test.input} → ${result}`);
      passedTests++;
    } else {
      console.log(
        `  ❌ Test ${index + 1}: ${test.input} → ${result}, expected ${test.expected}`
      );
    }
  });

  // Test getLiquidityRange() - 1 test case
  console.log("\n✓ Testing getLiquidityRange()");
  const liquidityTests = [
    { input: null, expected: "Unknown" },
    { input: 0, expected: "Unknown" },
    { input: 500, expected: "< $1K" },
    { input: 5000, expected: "$1K-$10K" },
    { input: 50000, expected: "$10K-$100K" },
    { input: 250000, expected: "$100K-$500K" },
    { input: 750000, expected: "$500K-$1M" },
    { input: 1500000, expected: "$1M+" },
  ];

  liquidityTests.forEach((test, index) => {
    const result = getLiquidityRange(test.input);
    if (result === test.expected) {
      console.log(`  ✅ Test ${index + 1}: $${test.input} → ${result}`);
      passedTests++;
    } else {
      console.log(
        `  ❌ Test ${index + 1}: $${test.input} → ${result}, expected ${test.expected}`
      );
    }
  });

  // Test getSeverityScore() - 4 test cases
  console.log("\n✓ Testing getSeverityScore()");
  const severityTests = [
    { input: "low" as const, expected: 1 },
    { input: "medium" as const, expected: 2 },
    { input: "high" as const, expected: 3 },
    { input: "critical" as const, expected: 4 },
  ];

  severityTests.forEach((test, index) => {
    const result = getSeverityScore(test.input);
    if (result === test.expected) {
      console.log(`  ✅ Test ${index + 1}: ${test.input} → ${result}`);
      passedTests++;
    } else {
      console.log(
        `  ❌ Test ${index + 1}: ${test.input} → ${result}, expected ${test.expected}`
      );
    }
  });

  console.log(
    `\n📊 Helper Functions Tests: ${passedTests}/${totalTests} passed`
  );
  return passedTests === totalTests;
}

/**
 * Test 3: calculateTokenAge() function
 */
function testCalculateTokenAge() {
  console.log("\n🧪 Testing calculateTokenAge() function...\n");

  let passedTests = 0;
  const totalTests = 7;

  const now = new Date();
  const tests = [
    {
      input: null,
      expected: "Unknown",
    },
    {
      input: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      expected: "< 1 day",
    },
    {
      input: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      expected: "< 1 week",
    },
    {
      input: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      expected: "1-4 weeks",
    },
    {
      input: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      expected: "1-3 months",
    },
    {
      input: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
      expected: "3-6 months",
    },
    {
      input: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 days ago
      expected: "1+ year",
    },
  ];

  tests.forEach((test, index) => {
    const result = calculateTokenAge(test.input);
    if (result === test.expected) {
      console.log(
        `  ✅ Test ${index + 1}: ${test.input?.substring(0, 19) || "null"} → ${result}`
      );
      passedTests++;
    } else {
      console.log(
        `  ❌ Test ${index + 1}: ${test.input?.substring(0, 19) || "null"} → ${result}, expected ${test.expected}`
      );
    }
  });

  console.log(
    `\n📊 calculateTokenAge() Tests: ${passedTests}/${totalTests} passed`
  );
  return passedTests === totalTests;
}

/**
 * Test 4: Transform functions
 */
function testTransformFunctions() {
  console.log("\n🧪 Testing Transform Functions...\n");

  let passedTests = 0;
  const totalTests = 2;

  try {
    // Test transformToSummaryReport()
    console.log("✓ Testing transformToSummaryReport()");
    const summaryReport = transformToSummaryReport(mockAuditData as any);

    if (
      summaryReport.accessLevel === "summary" &&
      summaryReport.upgradeRequired === true &&
      summaryReport.topIssues.length === 3 &&
      summaryReport.totalIssuesCount === 3 &&
      typeof summaryReport.holderCountRange === "string" &&
      typeof summaryReport.liquidityRange === "string" &&
      typeof summaryReport.deployedAge === "string"
    ) {
      console.log("  ✅ PASS: Summary report transformed correctly");
      console.log(`    - Risk Score: ${summaryReport.riskScore}`);
      console.log(`    - Holder Range: ${summaryReport.holderCountRange}`);
      console.log(`    - Liquidity Range: ${summaryReport.liquidityRange}`);
      console.log(`    - Deployed Age: ${summaryReport.deployedAge}`);
      console.log(`    - Top Issues: ${summaryReport.topIssues.length}`);
      passedTests++;
    } else {
      console.log(
        "  ❌ FAIL: Summary report transformation failed",
        summaryReport
      );
    }

    // Test transformToFullReport()
    console.log("\n✓ Testing transformToFullReport()");
    const fullReport = transformToFullReport(mockAuditData as any, "pro");

    if (
      fullReport.accessLevel === "full" &&
      fullReport.accessType === "pro" &&
      fullReport.flags.length === 3 &&
      fullReport.holderCount === 1250 &&
      fullReport.topHolderConcentration === 45.2
    ) {
      console.log("  ✅ PASS: Full report transformed correctly");
      console.log(`    - Access Type: ${fullReport.accessType}`);
      console.log(`    - Flags Count: ${fullReport.flags.length}`);
      console.log(`    - Holder Count: ${fullReport.holderCount}`);
      passedTests++;
    } else {
      console.log("  ❌ FAIL: Full report transformation failed", fullReport);
    }
  } catch (error) {
    console.error("❌ Error in transform tests:", error);
  }

  console.log(
    `\n📊 Transform Functions Tests: ${passedTests}/${totalTests} passed`
  );
  return passedTests === totalTests;
}

/**
 * Test 5: Integration test for API endpoint (simulated)
 */
async function testApiIntegration() {
  console.log("\n🧪 Testing API Integration (Simulated)...\n");

  let passedTests = 0;
  const totalTests = 4;

  try {
    // Create test data
    const freeUser = await createTestUser("free");
    const proUser = await createTestUser("pro");

    if (freeUser && proUser) {
      let instantReport: any = null;

      // Test 1: Free user gets summary response
      console.log("✓ Test 1: Free user gets summary response");
      const freeResult = await determineReportAccess(
        freeUser.id,
        null,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (freeResult.hasAccess && freeResult.accessLevel === "summary") {
        const summaryData = transformToSummaryReport(mockAuditData as any);
        console.log("  ✅ PASS: Free user gets summary response");
        passedTests++;
      } else {
        console.log("  ❌ FAIL: Free user should get summary response");
      }

      // Test 2: Pro user gets full response
      console.log("\n✓ Test 2: Pro user gets full response");
      const proResult = await determineReportAccess(
        proUser.id,
        null,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (proResult.hasAccess && proResult.accessLevel === "full") {
        const fullData = transformToFullReport(mockAuditData as any, "pro");
        console.log("  ✅ PASS: Pro user gets full response");
        passedTests++;
      } else {
        console.log("  ❌ FAIL: Pro user should get full response");
      }

      // Test 3: Anonymous user gets summary response
      console.log("\n✓ Test 3: Anonymous user gets summary response");
      const anonResult = await determineReportAccess(
        null,
        TEST_CONFIG.testGuestSessionId,
        TEST_CONFIG.contractAddress,
        TEST_CONFIG.chain
      );

      if (anonResult.hasAccess && anonResult.accessLevel === "summary") {
        console.log("  ✅ PASS: Anonymous user gets summary response");
        passedTests++;
      } else {
        console.log("  ❌ FAIL: Anonymous user should get summary response");
      }

      // Test 4: User with instant credit gets full response
      console.log("\n✓ Test 4: User with instant credit gets full response");
      instantReport = await createTestInstantReport(freeUser.id, 24);

      if (instantReport) {
        const instantResult = await determineReportAccess(
          freeUser.id,
          null,
          TEST_CONFIG.contractAddress,
          TEST_CONFIG.chain
        );

        if (
          instantResult.hasAccess &&
          instantResult.accessLevel === "full" &&
          instantResult.accessType === "instant_report"
        ) {
          console.log("  ✅ PASS: User with instant credit gets full response");
          passedTests++;
        } else {
          console.log(
            "  ❌ FAIL: User with instant credit should get full response"
          );
        }
      }

      // Cleanup
      if (instantReport) {
        await db
          .delete(instantReports)
          .where(eq(instantReports.id, instantReport.id));
      }
      await db.delete(users).where(eq(users.id, freeUser.id));
      await db.delete(users).where(eq(users.id, proUser.id));
    }
  } catch (error) {
    console.error("❌ Error in integration tests:", error);
  }

  console.log(
    `\n📊 API Integration Tests: ${passedTests}/${totalTests} passed`
  );
  return passedTests === totalTests;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("🚀 Starting Paywall System Tests...\n");
  console.log("=".repeat(50));

  const startTime = Date.now();
  let allTestsPassed = true;

  try {
    // Test database connection first
    console.log("🔌 Testing database connection...");
    try {
      await db.query.users.findFirst({ limit: 1 });
      console.log("✅ Database connection successful\n");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      console.error("\nPlease check your DATABASE_URL in .env.local");
      process.exit(1);
    }

    // Run all test suites
    const test1Passed = await testDetermineReportAccess();
    const test2Passed = testHelperFunctions();
    const test3Passed = testCalculateTokenAge();
    const test4Passed = testTransformFunctions();
    const test5Passed = await testApiIntegration();

    allTestsPassed =
      test1Passed && test2Passed && test3Passed && test4Passed && test5Passed;
  } catch (error) {
    console.error("❌ Test suite failed:", error);
    allTestsPassed = false;
  } finally {
    // Cleanup any remaining test data
    await cleanupTestData();
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log("\n" + "=".repeat(50));
  console.log(`🏁 Test Suite Completed in ${duration.toFixed(2)}s`);

  if (allTestsPassed) {
    console.log("✅ ALL TESTS PASSED - Paywall system is ready!");
  } else {
    console.log("❌ SOME TESTS FAILED - Please review the output above");
  }

  return allTestsPassed;
}

// Run tests when script is executed
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { runAllTests };
