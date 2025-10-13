// lib/services/blockchain/etherscan.service.ts
import { BaseBlockchainService } from "./base.service";
import {
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "./types";

export class EtherscanService extends BaseBlockchainService {
  private alchemyApiKey: string;

  constructor() {
    const apiKey = process.env.ETHERSCAN_API_KEY || "";
    const baseUrl = "https://api.etherscan.io";
    super(apiKey, baseUrl, 5); // 5 requests per second

    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || "";
  }

  async fetchContractSource(address: string): Promise<ContractSource> {
    await this.rateLimiter.wait();

    return this.retryFetch(async () => {
      const response = await fetch(
        `${this.baseUrl}/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`
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
      // Get contract creation info
      const response = await fetch(
        `${this.baseUrl}/api?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === "1" && data.result && data.result[0]) {
        const creationInfo = data.result[0];

        // Get block timestamp for deploy date
        let deployDate: string | undefined;
        if (creationInfo.txHash) {
          try {
            const txResponse = await fetch(
              `${this.baseUrl}/api?module=proxy&action=eth_getTransactionByHash&txhash=${creationInfo.txHash}&apikey=${this.apiKey}`
            );
            const txData = await txResponse.json();

            if (txData.result?.blockNumber) {
              const blockResponse = await fetch(
                `${this.baseUrl}/api?module=proxy&action=eth_getBlockByNumber&tag=${txData.result.blockNumber}&boolean=false&apikey=${this.apiKey}`
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
          `${this.baseUrl}/api?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${this.apiKey}`
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
    if (!this.alchemyApiKey) {
      return {
        holderCount: 0,
        topHolderConcentration: 0,
        topHolders: [],
      };
    }

    return this.retryFetch(async () => {
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`;

      // Get token holders using Alchemy
      const response = await fetch(alchemyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [address, "erc20"],
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.error || !data.result?.tokenBalances) {
        return {
          holderCount: 0,
          topHolderConcentration: 0,
          topHolders: [],
        };
      }

      const holders = data.result.tokenBalances;
      const sortedHolders = holders
        .map((h: any) => ({
          address: h.address,
          balance: h.tokenBalance,
        }))
        .sort((a: any, b: any) => {
          const balanceA = BigInt(a.balance || "0");
          const balanceB = BigInt(b.balance || "0");
          return balanceB > balanceA ? 1 : -1;
        });

      const topHolders = sortedHolders.slice(0, 10);
      const totalSupply = holders.reduce(
        (sum: bigint, h: any) => sum + BigInt(h.tokenBalance || "0"),
        0n
      );
      const topHolderSum = topHolders.reduce(
        (sum: bigint, h: any) => sum + BigInt(h.balance || "0"),
        0n
      );

      const concentration =
        totalSupply > 0n ? Number((topHolderSum * 100n) / totalSupply) : 0;

      return {
        holderCount: holders.length,
        topHolderConcentration: concentration,
        topHolders: topHolders.map((h: any) => ({
          address: h.address,
          balance: h.balance,
          percentage:
            totalSupply > 0n
              ? Number((BigInt(h.balance || "0") * 100n) / totalSupply)
              : 0,
        })),
      };
    });
  }

  async fetchLiquidityData(address: string): Promise<LiquidityData> {
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

      const liquidityPairs = data.pairs.map((pair: any) => ({
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
      // This would typically fetch transfer events from the liquidity pool
      // For now, we'll return empty array as placeholder
      // In production, use Alchemy Transfer API or The Graph

      // Example: Query Uniswap V2/V3 events for the pair
      // - Mint events (liquidity added)
      // - Burn events (liquidity removed)
      // - Lock events (from lock contracts)

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
      // This would check known lock contracts:
      // - Unicrypt: 0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214
      // - Team Finance: 0xE2fE530C047f2d85298b07D9333C05737f1435fB
      // - DxLock: Various addresses

      // For now, return placeholder
      return {
        isLocked: false,
      };
    });
  }

  validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
