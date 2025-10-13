#!/usr/bin/env ts-node
/**
 * Test script for CryptoGuard API endpoint
 * Tests the /api/crypto/analyze endpoint with known contracts
 */

const KNOWN_CONTRACTS = {
  // USDT on Ethereum - should be low risk
  usdt: {
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    chain: "ethereum",
    expectedRisk: "low",
  },
  // WETH on Ethereum - should be low risk
  weth: {
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    chain: "ethereum",
    expectedRisk: "low",
  },
};

async function testContract(
  name: string,
  address: string,
  chain: string,
  baseUrl: string
) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`   Address: ${address}`);
  console.log(`   Chain: ${chain}`);

  try {
    const response = await fetch(`${baseUrl}/api/crypto/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, chain }),
    });

    const result = await response.json();

    if (response.ok && result.status === "success") {
      console.log(`   ✅ Success!`);
      console.log(`   Risk Score: ${result.data.riskScore}/100`);
      console.log(`   Risk Category: ${result.data.riskCategory}`);
      console.log(`   Confidence: ${result.data.confidence}%`);
      console.log(`   Verified: ${result.data.isVerified}`);
      console.log(`   Flags: ${result.data.flags?.length || 0}`);
      console.log(`   Cached: ${result.cached}`);

      if (result.data.flags && result.data.flags.length > 0) {
        console.log(`\n   🚩 Red Flags:`);
        result.data.flags.forEach((flag: any) => {
          console.log(`      - [${flag.severity.toUpperCase()}] ${flag.title}`);
        });
      }

      console.log(`\n   💡 ${result.data.recommendation}`);

      return true;
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      console.log(`   Details: ${result.details || "N/A"}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return false;
  }
}

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  console.log("🚀 CryptoGuard API Test Suite");
  console.log(`📍 Testing against: ${baseUrl}`);
  console.log("=".repeat(60));

  let successCount = 0;
  let totalTests = 0;

  for (const [name, config] of Object.entries(KNOWN_CONTRACTS)) {
    totalTests++;
    const success = await testContract(
      name.toUpperCase(),
      config.address,
      config.chain,
      baseUrl
    );
    if (success) successCount++;

    // Wait 2 seconds between tests to avoid rate limiting
    if (totalTests < Object.keys(KNOWN_CONTRACTS).length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Results: ${successCount}/${totalTests} tests passed`);

  if (successCount === totalTests) {
    console.log("✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed");
    process.exit(1);
  }
}

main();
