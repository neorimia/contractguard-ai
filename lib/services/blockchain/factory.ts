// lib/services/blockchain/factory.ts
import { BaseBlockchainService } from "./base.service";
import { EtherscanService } from "./etherscan.service";
import { BscScanService } from "./bscscan.service";

export class BlockchainServiceFactory {
  private static instances: Map<string, BaseBlockchainService> = new Map();

  /**
   * Get blockchain service for a specific chain
   * Uses singleton pattern to reuse service instances
   */
  static getService(chain: string): BaseBlockchainService {
    const normalizedChain = chain.toLowerCase();

    // Return cached instance if exists
    if (this.instances.has(normalizedChain)) {
      return this.instances.get(normalizedChain)!;
    }

    // Create new instance
    let service: BaseBlockchainService;

    switch (normalizedChain) {
      case "ethereum":
      case "eth":
        service = new EtherscanService();
        break;
      case "bsc":
      case "binance":
        service = new BscScanService();
        break;
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }

    // Cache and return
    this.instances.set(normalizedChain, service);
    return service;
  }

  /**
   * Get list of supported chains
   */
  static getSupportedChains(): string[] {
    return ["ethereum", "eth", "bsc", "binance"];
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}
