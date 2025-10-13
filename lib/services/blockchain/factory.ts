// lib/services/blockchain/factory.ts
import { BaseBlockchainService } from "./base.service";
import { EtherscanV2Service } from "./etherscan-v2.service";
import { SolanaService } from "./solana.service";
import { isEVMChain, CHAIN_ALIASES } from "./chain-config";

export class BlockchainServiceFactory {
  private static instances: Map<string, BaseBlockchainService> = new Map();

  /**
   * Get blockchain service for a specific chain
   * Uses singleton pattern to reuse service instances
   */
  static getService(chain: string): BaseBlockchainService {
    const normalizedChain = chain.toLowerCase();
    const resolvedChain = CHAIN_ALIASES[normalizedChain] || normalizedChain;

    // Return cached instance if exists
    if (this.instances.has(resolvedChain)) {
      return this.instances.get(resolvedChain)!;
    }

    // Create new instance
    let service: BaseBlockchainService;

    // Check if it's Solana (non-EVM)
    if (resolvedChain === "solana" || resolvedChain === "sol") {
      service = new SolanaService();
    }
    // Use Etherscan V2 for all EVM chains
    else if (isEVMChain(resolvedChain)) {
      service = new EtherscanV2Service(resolvedChain);
    }
    // Unsupported chain
    else {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Cache and return
    this.instances.set(resolvedChain, service);
    return service;
  }

  /**
   * Get list of supported chains
   * Now includes all chains supported by Etherscan V2
   */
  static getSupportedChains(): Array<{
    id: string;
    name: string;
    aliases: string[];
    icon?: string;
    type?: "evm" | "non-evm";
    chainId?: number;
  }> {
    // Import from chain-config for consistency
    const { getSupportedEVMChains } = require("./chain-config");
    const evmChains = getSupportedEVMChains();

    return [
      ...evmChains.map((chain: any) => ({
        id: chain.id,
        name: chain.name,
        aliases: chain.aliases,
        icon: chain.icon,
        type: "evm" as const,
        chainId: chain.chainId,
      })),
      {
        id: "solana",
        name: "Solana",
        aliases: ["sol"],
        icon: "◎",
        type: "non-evm" as const,
      },
    ];
  }

  /**
   * Get EVM chains only
   */
  static getEVMChains(): Array<string> {
    return this.getSupportedChains()
      .filter((chain) => chain.type === "evm")
      .map((chain) => chain.id);
  }

  /**
   * Check if chain is EVM-compatible
   */
  static isEVMChain(chain: string): boolean {
    return isEVMChain(chain);
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
