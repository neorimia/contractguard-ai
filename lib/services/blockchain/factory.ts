// lib/services/blockchain/factory.ts
import { BaseBlockchainService } from "./base.service";
import { EtherscanService } from "./etherscan.service";
import { BscScanService } from "./bscscan.service";
import { PolygonScanService } from "./polygon.service";
import { ArbitrumScanService } from "./arbitrum.service";

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
      case "bnb":
        service = new BscScanService();
        break;
      case "polygon":
      case "matic":
      case "pol":
        service = new PolygonScanService();
        break;
      case "arbitrum":
      case "arb":
        service = new ArbitrumScanService();
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
  static getSupportedChains(): Array<{
    id: string;
    name: string;
    aliases: string[];
    icon?: string;
  }> {
    return [
      { id: "ethereum", name: "Ethereum", aliases: ["eth"], icon: "⟠" },
      { id: "bsc", name: "BNB Chain", aliases: ["binance", "bnb"], icon: "💎" },
      { id: "polygon", name: "Polygon", aliases: ["matic", "pol"], icon: "⬡" },
      { id: "arbitrum", name: "Arbitrum", aliases: ["arb"], icon: "🔷" },
    ];
  }

  /**
   * Validate if chain is supported
   */
  static isSupported(chain: string): boolean {
    try {
      this.getService(chain);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}
