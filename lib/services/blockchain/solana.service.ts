// lib/services/blockchain/solana.service.ts
import { BaseBlockchainService } from "./base.service";
import {
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "./types";

/**
 * Solana Blockchain Service
 *
 * Note: Solana uses different architecture than EVM chains
 * - Programs instead of contracts
 * - Different address format (base58 vs 0x hex)
 * - Different token standard (SPL vs ERC20)
 */
export class SolanaService extends BaseBlockchainService {
  private solscanApiKey: string;
  private heliusApiKey: string;

  constructor() {
    const apiKey = process.env.SOLSCAN_API_KEY || "";
    const baseUrl = "https://api.solscan.io";
    super(apiKey, baseUrl, 5);

    this.solscanApiKey = apiKey;
    this.heliusApiKey = process.env.HELIUS_API_KEY || "";
  }

  async fetchContractSource(address: string): Promise<ContractSource> {
    await this.rateLimiter.wait();

    return this.retryFetch(async () => {
      // Solana programs are compiled, source not always available
      // Try to fetch from Solscan API
      const response = await fetch(`${this.baseUrl}/account/${address}`, {
        headers: {
          token: this.solscanApiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Program not found on Solana");
      }

      const data = await response.json();

      // Solana programs typically don't have verified source code
      // We'll mark as unverified and use bytecode analysis
      return {
        sourceCode: "", // Solana programs are compiled
        contractName: data.data?.name || "Unknown Solana Program",
        compilerVersion: "Solana Runtime",
        abi: [], // Solana uses IDL instead of ABI
        isVerified: false, // Most Solana programs aren't verified
      };
    });
  }

  async fetchContractMetadata(address: string): Promise<ContractMetadata> {
    await this.rateLimiter.wait();

    return this.retryFetch(async () => {
      const response = await fetch(`${this.baseUrl}/account/${address}`, {
        headers: {
          token: this.solscanApiKey,
        },
      });

      if (!response.ok) {
        return {
          deployer: "Unknown",
          deployDate: new Date().toISOString(),
          txCount: 0,
        };
      }

      const data = await response.json();

      return {
        deployer: data.data?.owner || "Unknown",
        deployDate: data.data?.createdTime
          ? new Date(data.data.createdTime * 1000).toISOString()
          : new Date().toISOString(),
        txCount: data.data?.txCount || 0,
      };
    });
  }

  async fetchHolderDistribution(address: string): Promise<HolderData> {
    await this.rateLimiter.wait();

    return this.retryFetch(async () => {
      // Use Helius API for SPL token holders
      if (!this.heliusApiKey) {
        return {
          holderCount: 0,
          topHolderConcentration: 0,
          topHolders: [],
        };
      }

      const heliusUrl = `https://api.helius.xyz/v0/token-metadata`;

      const response = await fetch(
        `${heliusUrl}?api-key=${this.heliusApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mintAccounts: [address],
          }),
        }
      );

      if (!response.ok) {
        return {
          holderCount: 0,
          topHolderConcentration: 0,
          topHolders: [],
        };
      }

      const data = await response.json();

      // Get token supply
      const tokenInfo = data[0];
      const supply = tokenInfo?.supply || 0;

      // Fetch top holders (requires additional API call)
      // For now, return placeholder
      return {
        holderCount: 0,
        topHolderConcentration: 0,
        topHolders: [],
      };
    });
  }

  async fetchLiquidityData(address: string): Promise<LiquidityData> {
    return this.retryFetch(async () => {
      // Use DexScreener for Solana liquidity (supports Raydium, Orca, etc.)
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${address}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          totalLiquidityUsd: "0",
          liquidityPairs: [],
        };
      }

      const data = await response.json();

      if (!data.pairs || data.pairs.length === 0) {
        return {
          totalLiquidityUsd: "0",
          liquidityPairs: [],
        };
      }

      // Filter for Solana chain
      const solanaPairs = data.pairs.filter(
        (pair: any) => pair.chainId === "solana"
      );

      const liquidityPairs = solanaPairs.map((pair: any) => ({
        dex: pair.dexId,
        pair: pair.pairAddress,
        liquidityUsd: pair.liquidity?.usd || "0",
      }));

      const totalLiquidity = liquidityPairs.reduce(
        (sum: number, pair: any) => sum + parseFloat(pair.liquidityUsd || "0"),
        0
      );

      return {
        totalLiquidityUsd: totalLiquidity.toString(),
        liquidityPairs,
      };
    });
  }

  validateAddress(address: string): boolean {
    // Solana addresses are base58 encoded, 32-44 characters
    // Valid characters: 1-9, A-H, J-N, P-Z, a-k, m-z
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * Solana-specific: Get program data account
   */
  async getProgramData(address: string): Promise<any> {
    return this.retryFetch(async () => {
      // This would use Solana RPC to get program account data
      // For now, return placeholder
      return null;
    });
  }

  /**
   * Solana-specific: Check if address is a token mint
   */
  async isTokenMint(address: string): Promise<boolean> {
    return this.retryFetch(async () => {
      const response = await fetch(`${this.baseUrl}/token/meta/${address}`, {
        headers: {
          token: this.solscanApiKey,
        },
      });

      return response.ok;
    });
  }
}
