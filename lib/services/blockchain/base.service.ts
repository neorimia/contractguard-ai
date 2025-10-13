// lib/services/blockchain/base.service.ts
import {
  RateLimiter,
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "./types";

export abstract class BaseBlockchainService {
  protected apiKey: string;
  protected baseUrl: string;
  protected rateLimiter: RateLimiter;

  constructor(apiKey: string, baseUrl: string, requestsPerSecond: number = 5) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.rateLimiter = new RateLimiter(requestsPerSecond, 1000);
  }

  /**
   * Fetch contract source code and ABI
   */
  abstract fetchContractSource(address: string): Promise<ContractSource>;

  /**
   * Fetch contract metadata (deployer, deploy date, etc.)
   */
  abstract fetchContractMetadata(address: string): Promise<ContractMetadata>;

  /**
   * Fetch holder distribution data
   */
  abstract fetchHolderDistribution(address: string): Promise<HolderData>;

  /**
   * Fetch liquidity data
   */
  abstract fetchLiquidityData(address: string): Promise<LiquidityData>;

  /**
   * Validate address format
   */
  abstract validateAddress(address: string): boolean;

  /**
   * Helper method for retrying failed requests
   */
  protected async retryFetch<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }
}
