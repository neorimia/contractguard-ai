/**
 * Test Moralis Holder Data Integration
 *
 * This script tests the Moralis API integration for fetching token holder data.
 * Run with: npm run test:moralis
 */

import "dotenv/config";

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

if (!MORALIS_API_KEY) {
  console.error("❌ MORALIS_API_KEY not set in environment variables");
  console.log("\nPlease add to .env.local:");
  console.log("MORALIS_API_KEY=your_moralis_api_key_here");
  console.log("\nGet your API key from: https://admin.moralis.io/web3apis");
  process.exit(1);
}

// Test contracts on different chains
const testCases = [
  {
    name: "BNB Token (Ethereum)",
    address: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
    chain: "eth",
    expectedHolders: "> 100,000",
  },
  {
    name: "USDT (Ethereum)",
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    chain: "eth",
    expectedHolders: "> 5,000,000",
  },
  {
    name: "WETH (Ethereum)",
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    chain: "eth",
    expectedHolders: "> 500,000",
  },
];

async function testMoralisHolderAPI(
  address: string,
  chain: string
): Promise<void> {
  const url = `https://deep-index.moralis.io/api/v2.2/erc20/${address}/owners?chain=${chain}&limit=100&order=DESC`;

  console.log(`\n🔍 Fetching holders for ${address} on ${chain}...`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-Key": MORALIS_API_KEY!,
    },
  });

  if (!response.ok) {
    console.error(`❌ Error: ${response.status} ${response.statusText}`);
    const errorData = await response.text();
    console.error("Response:", errorData);
    return;
  }

  const data = await response.json();

  console.log("✅ Success!");
  console.log(`   Total holders: ${data.total?.toLocaleString() || "unknown"}`);
  console.log(`   Returned: ${data.result?.length || 0} holders`);

  if (data.result && data.result.length > 0) {
    console.log(`\n   Top 3 holders:`);
    data.result.slice(0, 3).forEach((holder: any, idx: number) => {
      const balance = BigInt(holder.balance || "0");
      const percentage = holder.percentage_relative_to_total_supply || 0;

      console.log(`   ${idx + 1}. ${holder.owner_address}`);
      console.log(`      Balance: ${balance.toString()}`);
      console.log(`      Percentage: ${percentage.toFixed(4)}%`);
    });

    // Calculate concentration
    const top10 = data.result.slice(0, 10);
    const concentration = top10.reduce(
      (sum: number, h: any) =>
        sum + (h.percentage_relative_to_total_supply || 0),
      0
    );
    console.log(`\n   Top 10 concentration: ${concentration.toFixed(2)}%`);
  }
}

async function runTests() {
  console.log("🧪 Testing Moralis Holder Data API Integration");
  console.log("=".repeat(60));

  for (const testCase of testCases) {
    console.log(`\n📊 ${testCase.name}`);
    console.log(`   Expected holders: ${testCase.expectedHolders}`);

    try {
      await testMoralisHolderAPI(testCase.address, testCase.chain);
    } catch (error) {
      console.error(`❌ Test failed:`, error);
    }

    // Rate limiting: wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests complete!");
  console.log("\nIf all tests passed, holder distribution is ready to use.");
}

runTests().catch(console.error);
