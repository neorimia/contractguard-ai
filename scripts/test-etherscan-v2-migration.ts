#!/usr/bin/env ts-node
/**
 * Test Script: Etherscan V2 API Migration
 *
 * This script tests the new EtherscanV2Service to ensure it works
 * correctly across multiple chains with a single API key.
 *
 * Usage:
 *   npm run test:etherscan-v2
 *   # or
 *   ts-node scripts/test-etherscan-v2-migration.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

// Try to load .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { BlockchainServiceFactory } from "../lib/services/blockchain";
import {
  getChainId,
  getSupportedEVMChains,
} from "../lib/services/blockchain/chain-config";

// Test contract addresses (verified contracts on different chains)
const TEST_CONTRACTS = {
  ethereum: "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT on Ethereum
  bsc: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
  polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
  arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
};

async function testChain(chain: string, contractAddress: string) {
  console.log(`\n🔍 Testing ${chain.toUpperCase()}...`);
  console.log(`   Chain ID: ${getChainId(chain)}`);
  console.log(`   Contract: ${contractAddress}`);

  try {
    const service = BlockchainServiceFactory.getService(chain);

    // Test 1: Fetch contract source
    console.log(`   ✓ Service instance created`);

    const source = await service.fetchContractSource(contractAddress);
    console.log(`   ✓ Contract verified: ${source.isVerified}`);
    console.log(`   ✓ Contract name: ${source.contractName}`);
    console.log(`   ✓ Compiler: ${source.compilerVersion}`);

    // Test 2: Fetch metadata
    const metadata = await service.fetchContractMetadata(contractAddress);
    console.log(`   ✓ Deployer: ${metadata.deployer.slice(0, 10)}...`);
    console.log(`   ✓ Deploy date: ${metadata.deployDate.slice(0, 10)}`);

    // Test 3: Validate address
    const isValid = service.validateAddress(contractAddress);
    console.log(`   ✓ Address validation: ${isValid}`);

    console.log(`   ✅ ${chain.toUpperCase()} - ALL TESTS PASSED`);
    return true;
  } catch (error) {
    console.error(
      `   ❌ ${chain.toUpperCase()} - FAILED:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

async function testV2Migration() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║   Etherscan V2 API Migration Test                        ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  console.log(`\n🔧 API Version: V2 (Unified) - V1 services removed`);

  // Display supported chains
  console.log("\n📋 Supported EVM Chains:");
  const supportedChains = getSupportedEVMChains();
  supportedChains.forEach((chain) => {
    console.log(
      `   ${chain.icon || "•"} ${chain.name} (${chain.id}) - Chain ID: ${chain.chainId}`
    );
  });

  // Check environment variables
  console.log("\n🔑 Environment Variables:");
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  const alchemyKey = process.env.ALCHEMY_API_KEY;

  if (!etherscanKey) {
    console.error("   ❌ ETHERSCAN_API_KEY not found!");
    console.log("\n💡 Set ETHERSCAN_API_KEY in .env.local to run tests");
    process.exit(1);
  }

  console.log(`   ✓ ETHERSCAN_API_KEY: ${etherscanKey.slice(0, 8)}...`);
  console.log(
    `   ${alchemyKey ? "✓" : "⚠️"} ALCHEMY_API_KEY: ${alchemyKey ? alchemyKey.slice(0, 8) + "..." : "Not set (optional)"}`
  );

  // Run tests for each chain
  console.log("\n🧪 Running Chain Tests...");
  const results: Record<string, boolean> = {};

  for (const [chain, address] of Object.entries(TEST_CONTRACTS)) {
    results[chain] = await testChain(chain, address);
    // Add delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log("\n" + "═".repeat(63));
  console.log("📊 Test Summary:");
  console.log("═".repeat(63));

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.values(results).length;

  Object.entries(results).forEach(([chain, passed]) => {
    const icon = passed ? "✅" : "❌";
    console.log(
      `   ${icon} ${chain.toUpperCase().padEnd(12)} - ${passed ? "PASSED" : "FAILED"}`
    );
  });

  console.log("\n" + "─".repeat(63));
  console.log(`   Total: ${passed}/${total} chains tested successfully`);
  console.log("═".repeat(63));

  if (passed === total) {
    console.log("\n🎉 SUCCESS! Etherscan V2 migration is working correctly!");
    console.log("\n✅ Benefits of V2:");
    console.log("   • Single API key for all EVM chains");
    console.log("   • Simplified configuration");
    console.log("   • Easy to add new chains");
    console.log("   • Unified rate limiting");
    process.exit(0);
  } else {
    console.log("\n⚠️  PARTIAL SUCCESS: Some chains failed.");
    console.log("   Check error messages above for details.");
    process.exit(1);
  }
}

// Run the test
testV2Migration().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
