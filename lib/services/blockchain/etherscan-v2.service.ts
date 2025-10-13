// lib/services/blockchain/etherscan-v2.service.ts
import { BaseBlockchainService } from "./base.service";
import {
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "./types";
import {
  getChainId,
  getAlchemyNetwork,
  getDexScreenerChainId,
} from "./chain-config";

/**
 * Unified Etherscan V2 Service
 *
 * Uses Etherscan V2 API which supports 50+ chains with a single API key.
 * Reference: https://docs.etherscan.io/v/etherscan-v2/getting-started/introduction
 */
export class EtherscanV2Service extends BaseBlockchainService {
  private chainId: number;
  private chainName: string;
  private alchemyApiKey: string;
  private moralisApiKey: string;

  constructor(chain: string) {
    const apiKey = process.env.ETHERSCAN_API_KEY || "";
    // V2 API uses a unified endpoint
    const baseUrl = "https://api.etherscan.io/v2";
    super(apiKey, baseUrl, 5); // 5 requests per second

    this.chainName = chain.toLowerCase();
    this.chainId = getChainId(chain);
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || "";
    this.moralisApiKey = process.env.MORALIS_API_KEY || "";
  }

  async fetchContractSource(address: string): Promise<ContractSource> {
    await this.rateLimiter.wait();

    return this.retryFetch(async () => {
      // V2 API uses chainid parameter
      const response = await fetch(
        `${this.baseUrl}/api?chainid=${this.chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== "1" || !data.result[0]) {
        throw new Error("Contract not verified or not found");
      }

      const contractInfo = data.result[0];
      const isVerified = contractInfo.SourceCode !== "";

      return {
        sourceCode: contractInfo.SourceCode,
        contractName: contractInfo.ContractName,
        compilerVersion: contractInfo.CompilerVersion,
        abi: contractInfo.ABI ? JSON.parse(contractInfo.ABI) : [],
        isVerified,
      };
    });
  }

  async fetchContractMetadata(address: string): Promise<ContractMetadata> {
    await this.rateLimiter.wait();

    return this.retryFetch(async () => {
      // Get contract creation info using V2 API
      const response = await fetch(
        `${this.baseUrl}/api?chainid=${this.chainId}&module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === "1" && data.result && data.result[0]) {
        const creationInfo = data.result[0];

        // Get block timestamp for deploy date
        let deployDate: string | undefined;
        if (creationInfo.txHash) {
          try {
            const txResponse = await fetch(
              `${this.baseUrl}/api?chainid=${this.chainId}&module=proxy&action=eth_getTransactionByHash&txhash=${creationInfo.txHash}&apikey=${this.apiKey}`
            );
            const txData = await txResponse.json();

            if (txData.result?.blockNumber) {
              const blockResponse = await fetch(
                `${this.baseUrl}/api?chainid=${this.chainId}&module=proxy&action=eth_getBlockByNumber&tag=${txData.result.blockNumber}&boolean=false&apikey=${this.apiKey}`
              );
              const blockData = await blockResponse.json();

              if (blockData.result?.timestamp) {
                const timestamp = parseInt(blockData.result.timestamp, 16);
                deployDate = new Date(timestamp * 1000).toISOString();
              }
            }
          } catch (error) {
            console.warn("Could not fetch deploy date:", error);
          }
        }

        // Get transaction count
        const txCountResponse = await fetch(
          `${this.baseUrl}/api?chainid=${this.chainId}&module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${this.apiKey}`
        );
        const txCountData = await txCountResponse.json();
        const txCount = txCountData.result
          ? parseInt(txCountData.result, 16)
          : 0;

        return {
          deployer: creationInfo.contractCreator,
          deployDate: deployDate || new Date().toISOString(),
          txCount,
        };
      }

      return {
        deployer: "Unknown",
        deployDate: new Date().toISOString(),
        txCount: 0,
      };
    });
  }

  async fetchHolderDistribution(address: string): Promise<HolderData> {
    // Use Moralis API to get token holder data
    if (!this.moralisApiKey) {
      console.warn("MORALIS_API_KEY not configured - holder data unavailable");
      return {
        holderCount: 0,
        topHolderConcentration: 0,
        topHolders: [],
      };
    }

    // Map chain names to Moralis chain identifiers
    const moralisChainMap: Record<string, string> = {
      ethereum: "eth",
      bsc: "bsc",
      polygon: "polygon",
      avalanche: "avalanche",
      fantom: "fantom",
      arbitrum: "arbitrum",
      optimism: "optimism",
      base: "base",
    };

    const moralisChain = moralisChainMap[this.chainName];
    if (!moralisChain) {
      console.warn(`Chain ${this.chainName} not supported by Moralis`);
      return {
        holderCount: 0,
        topHolderConcentration: 0,
        topHolders: [],
      };
    }

    return this.retryFetch(async () => {
      // Step 1: Get token holders from Moralis (primary data source)
      const moralisUrl = `https://deep-index.moralis.io/api/v2.2/erc20/${address}/owners?chain=${moralisChain}&limit=100&order=DESC`;

      const response = await fetch(moralisUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": this.moralisApiKey,
        },
      });

      if (!response.ok) {
        console.error(
          "Moralis API error:",
          response.status,
          response.statusText
        );
        return {
          holderCount: 0,
          topHolderConcentration: 0,
          topHolders: [],
        };
      }

      const data = await response.json();

      if (!data.result || data.result.length === 0) {
        return {
          holderCount: 0,
          topHolderConcentration: 0,
          topHolders: [],
        };
      }

      const holders = data.result;
      const totalHolders = data.total || holders.length;
      console.log(
        `[Moralis] Fetched ${totalHolders} total holders for ${address}`
      );

      // Step 2: Enrich with Alchemy token metadata (if available)
      let tokenMetadata: any = null;
      if (this.alchemyApiKey) {
        const alchemyNetwork = getAlchemyNetwork(this.chainName);
        if (alchemyNetwork) {
          try {
            const alchemyUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${this.alchemyApiKey}`;
            const metadataResponse = await fetch(alchemyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "alchemy_getTokenMetadata",
                params: [address],
                id: 1,
              }),
            });

            if (metadataResponse.ok) {
              const metadataData = await metadataResponse.json();
              tokenMetadata = metadataData.result;
              console.log(
                `[Alchemy] Enriched with metadata: ${tokenMetadata?.name || "N/A"} (${tokenMetadata?.symbol || "N/A"})`
              );
            }
          } catch (error) {
            console.warn("[Alchemy] Metadata enrichment failed:", error);
          }
        }
      }

      // Calculate total supply from all holders
      const totalSupply = holders.reduce(
        (sum: bigint, h: any) => sum + BigInt(h.balance || "0"),
        0n
      );

      // Get top 10 holders with enrichment
      const topHolders = holders.slice(0, 10).map((h: any) => {
        const balance = BigInt(h.balance || "0");
        const percentage =
          totalSupply > 0n ? Number((balance * 10000n) / totalSupply) / 100 : 0;

        return {
          address: h.owner_address,
          balance: h.balance,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
        };
      });

      // Calculate top 10 concentration
      const topHolderSum = topHolders.reduce(
        (sum: number, h: any) => sum + h.percentage,
        0
      );

      return {
        holderCount: totalHolders,
        topHolderConcentration: Math.round(topHolderSum * 100) / 100,
        topHolders,
      };
    });
  }

  async fetchLiquidityData(address: string): Promise<LiquidityData> {
    const dexScreenerChainId = getDexScreenerChainId(this.chainName);

    return this.retryFetch(async () => {
      // Use DexScreener API for liquidity data
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

      // Filter for the specific chain if we have the DexScreener ID
      const chainPairs = dexScreenerChainId
        ? data.pairs.filter(
            (pair: any) =>
              pair.chainId === dexScreenerChainId ||
              pair.chainId === this.chainName
          )
        : data.pairs;

      const liquidityPairs = chainPairs.map((pair: any) => ({
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

  /**
   * Fetch liquidity event timeline (Phase 3)
   *
   * Gets historical liquidity events for timeline visualization
   */
  async fetchLiquidityEvents(address: string): Promise<
    Array<{
      timestamp: string;
      liquidityUsd: number;
      change?: number;
      changePercentage?: number;
      eventType?: "add" | "remove" | "lock" | "unlock";
    }>
  > {
    return this.retryFetch(async () => {
      // Placeholder for future implementation
      // Would fetch transfer events from liquidity pools
      return [];
    });
  }

  /**
   * Check if liquidity is locked (Phase 3)
   *
   * Queries known lock contracts (Unicrypt, Team Finance, etc.)
   */
  async checkLiquidityLock(pairAddress: string): Promise<{
    isLocked: boolean;
    lockDuration?: number;
    lockExpiration?: string;
    lockedAmount?: string;
    lockContract?: string;
  }> {
    return this.retryFetch(async () => {
      // Placeholder for future implementation
      // Would check known lock contracts
      return {
        isLocked: false,
      };
    });
  }

  validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
