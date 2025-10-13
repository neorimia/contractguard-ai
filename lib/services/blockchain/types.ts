// lib/services/blockchain/types.ts
export interface ContractSource {
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  abi: any[];
  isVerified: boolean;
}

export interface ContractMetadata {
  deployer: string;
  deployDate: string;
  txCount?: number;
  sourceCode?: string;
  compiler?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

export interface HolderData {
  holderCount: number;
  topHolderConcentration: number; // Percentage (0-100)
  topHolders: Array<{
    address: string;
    balance: string;
    percentage: number;
  }>;
}

export interface LiquidityData {
  totalLiquidityUsd: string;
  liquidityPairs: Array<{
    dex: string;
    pair: string;
    liquidityUsd: string;
  }>;
}

// Rate Limiter class
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillInterval: number; // ms

  constructor(requestsPerSecond: number, intervalMs: number = 1000) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillInterval = intervalMs;
    this.lastRefill = Date.now();
  }

  async wait(): Promise<void> {
    return new Promise((resolve) => {
      const now = Date.now();
      const timePassed = now - this.lastRefill;

      if (timePassed >= this.refillInterval) {
        this.tokens = this.maxTokens;
        this.lastRefill = now;
      }

      if (this.tokens > 0) {
        this.tokens--;
        resolve();
      } else {
        const waitTime = this.refillInterval - timePassed;
        setTimeout(() => {
          this.tokens = this.maxTokens - 1;
          this.lastRefill = Date.now();
          resolve();
        }, waitTime);
      }
    });
  }
}
