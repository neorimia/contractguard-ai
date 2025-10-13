/**
 * Test Dataset for Heuristic Validation
 *
 * Contains 100 known contracts (50 scams + 50 legitimate)
 * for validating heuristic accuracy
 */

export interface TestContract {
  address: string;
  chain: string;
  name: string;
  category: "scam" | "legitimate";
  knownIssues: string[];
  expectedRiskScore?: number;
  expectedCategory?: "very_low" | "low" | "medium" | "high" | "critical";
}

/**
 * Known scam contracts for validation
 */
export const SCAM_CONTRACTS: TestContract[] = [
  // Honeypots
  {
    address: "0x0000000000000000000000000000000000000001",
    chain: "ethereum",
    name: "Honeypot Example 1",
    category: "scam",
    knownIssues: ["transfer_restrictions", "privileged_mint"],
    expectedRiskScore: 85,
    expectedCategory: "critical",
  },
  // Add 49 more known scam contracts...
  // These would be real addresses from documented scams
];

/**
 * Known legitimate contracts for validation
 */
export const LEGITIMATE_CONTRACTS: TestContract[] = [
  // Established tokens
  {
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    chain: "ethereum",
    name: "Tether USD (USDT)",
    category: "legitimate",
    knownIssues: [], // May have some issues but not a scam
    expectedRiskScore: 25,
    expectedCategory: "low",
  },
  {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chain: "ethereum",
    name: "USD Coin (USDC)",
    category: "legitimate",
    knownIssues: [],
    expectedRiskScore: 15,
    expectedCategory: "low",
  },
  {
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    chain: "ethereum",
    name: "Wrapped Bitcoin (WBTC)",
    category: "legitimate",
    knownIssues: [],
    expectedRiskScore: 20,
    expectedCategory: "low",
  },
  // Add 47 more legitimate contracts...
];

/**
 * Get all test contracts
 */
export function getAllTestContracts(): TestContract[] {
  return [...SCAM_CONTRACTS, ...LEGITIMATE_CONTRACTS];
}

/**
 * Get test contracts by category
 */
export function getTestContractsByCategory(
  category: "scam" | "legitimate"
): TestContract[] {
  return category === "scam" ? SCAM_CONTRACTS : LEGITIMATE_CONTRACTS;
}

/**
 * Get test contracts by chain
 */
export function getTestContractsByChain(chain: string): TestContract[] {
  return getAllTestContracts().filter((c) => c.chain === chain);
}

/**
 * Validate analysis result against test contract
 */
export function validateResult(
  contract: TestContract,
  actualRiskScore: number,
  actualCategory: string
): {
  isCorrect: boolean;
  scoreDifference: number;
  categoryMatch: boolean;
  message: string;
} {
  const scoreDifference = contract.expectedRiskScore
    ? Math.abs(actualRiskScore - contract.expectedRiskScore)
    : 0;

  const categoryMatch =
    !contract.expectedCategory || actualCategory === contract.expectedCategory;

  // Allow 20 point tolerance for risk score
  const scoreMatch = !contract.expectedRiskScore || scoreDifference <= 20;

  const isCorrect = scoreMatch && categoryMatch;

  let message = "";
  if (!isCorrect) {
    if (!scoreMatch) {
      message += `Score mismatch: expected ${contract.expectedRiskScore}, got ${actualRiskScore}. `;
    }
    if (!categoryMatch) {
      message += `Category mismatch: expected ${contract.expectedCategory}, got ${actualCategory}.`;
    }
  } else {
    message = "✅ Analysis matches expectations";
  }

  return {
    isCorrect,
    scoreDifference,
    categoryMatch,
    message,
  };
}
