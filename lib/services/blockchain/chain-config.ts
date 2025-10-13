// lib/services/blockchain/chain-config.ts

/**
 * Chain ID mappings for Etherscan V2 API
 * Reference: https://docs.etherscan.io/v/etherscan-v2/getting-started/supported-chains
 */
export const CHAIN_IDS = {
  // Mainnets
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  avalanche: 43114,
  fantom: 250,
  cronos: 25,
  gnosis: 100,

  // Testnets
  sepolia: 11155111,
  holesky: 17000,
  "bsc-testnet": 97,
  "polygon-mumbai": 80001,
  "polygon-amoy": 80002,
  "arbitrum-sepolia": 421614,
  "optimism-sepolia": 11155420,
  "base-sepolia": 84532,
  "avalanche-fuji": 43113,
} as const;

/**
 * Reverse mapping: Chain ID to chain name
 */
export const CHAIN_ID_TO_NAME: Record<number, string> = Object.entries(
  CHAIN_IDS
).reduce(
  (acc, [name, id]) => {
    acc[id] = name;
    return acc;
  },
  {} as Record<number, string>
);

/**
 * Chain aliases for flexible input
 */
export const CHAIN_ALIASES: Record<string, string> = {
  eth: "ethereum",
  bnb: "bsc",
  binance: "bsc",
  matic: "polygon",
  pol: "polygon",
  arb: "arbitrum",
  op: "optimism",
  avax: "avalanche",
  "avax-c": "avalanche",
  ftm: "fantom",
  cro: "cronos",
  gno: "gnosis",
  xdai: "gnosis",
};

/**
 * Alchemy network mappings for holder data
 */
export const ALCHEMY_NETWORKS: Record<string, string> = {
  ethereum: "eth-mainnet",
  polygon: "polygon-mainnet",
  arbitrum: "arb-mainnet",
  optimism: "opt-mainnet",
  base: "base-mainnet",
  sepolia: "eth-sepolia",
  "polygon-amoy": "polygon-amoy",
  "arbitrum-sepolia": "arb-sepolia",
  "optimism-sepolia": "opt-sepolia",
  "base-sepolia": "base-sepolia",
};

/**
 * DexScreener chain ID mappings
 */
export const DEXSCREENER_CHAIN_IDS: Record<string, string> = {
  ethereum: "ethereum",
  bsc: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanche",
  fantom: "fantom",
};

/**
 * Get chain ID from chain name or alias
 */
export function getChainId(chain: string): number {
  const normalizedChain = chain.toLowerCase();

  // Check if it's an alias first
  const resolvedChain = CHAIN_ALIASES[normalizedChain] || normalizedChain;

  // Get chain ID
  const chainId = CHAIN_IDS[resolvedChain as keyof typeof CHAIN_IDS];

  if (!chainId) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  return chainId;
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  const name = CHAIN_ID_TO_NAME[chainId];

  if (!name) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }

  return name;
}

/**
 * Get Alchemy network identifier
 */
export function getAlchemyNetwork(chain: string): string | undefined {
  const normalizedChain = chain.toLowerCase();
  const resolvedChain = CHAIN_ALIASES[normalizedChain] || normalizedChain;
  return ALCHEMY_NETWORKS[resolvedChain];
}

/**
 * Get DexScreener chain identifier
 */
export function getDexScreenerChainId(chain: string): string | undefined {
  const normalizedChain = chain.toLowerCase();
  const resolvedChain = CHAIN_ALIASES[normalizedChain] || normalizedChain;
  return DEXSCREENER_CHAIN_IDS[resolvedChain];
}

/**
 * Check if chain is EVM-compatible (supported by Etherscan V2)
 */
export function isEVMChain(chain: string): boolean {
  try {
    getChainId(chain);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all supported EVM chains
 */
export function getSupportedEVMChains(): Array<{
  id: string;
  name: string;
  chainId: number;
  aliases: string[];
  icon?: string;
}> {
  return [
    {
      id: "ethereum",
      name: "Ethereum",
      chainId: 1,
      aliases: ["eth"],
      icon: "⟠",
    },
    {
      id: "bsc",
      name: "BNB Chain",
      chainId: 56,
      aliases: ["binance", "bnb"],
      icon: "💎",
    },
    {
      id: "polygon",
      name: "Polygon",
      chainId: 137,
      aliases: ["matic", "pol"],
      icon: "⬡",
    },
    {
      id: "arbitrum",
      name: "Arbitrum",
      chainId: 42161,
      aliases: ["arb"],
      icon: "🔷",
    },
    {
      id: "optimism",
      name: "Optimism",
      chainId: 10,
      aliases: ["op"],
      icon: "🔴",
    },
    {
      id: "base",
      name: "Base",
      chainId: 8453,
      aliases: [],
      icon: "🔵",
    },
    {
      id: "avalanche",
      name: "Avalanche",
      chainId: 43114,
      aliases: ["avax", "avax-c"],
      icon: "🔺",
    },
  ];
}
