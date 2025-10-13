// lib/services/blockchain/polygon.service.ts
import { BaseBlockchainService } from "./base.service";
import {
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "./types";

export class PolygonScanService extends BaseBlockchainService {
  private alchemyApiKey: string;

  constructor() {
    const apiKey =
      process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "";
    const baseUrl = "https://api.polygonscan.com";
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
      const response = await fetch(
        `${this.baseUrl}/api?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === "1" && data.result && data.result[0]) {
        const creationInfo = data.result[0];

        return {
          deployer: creationInfo.contractCreator,
          deployDate: new Date().toISOString(),
          txCount: 0,
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
      // Use Alchemy Polygon endpoint
      const alchemyUrl = `https://polygon-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`;

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
      // Use DexScreener API for Polygon liquidity
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

      // Filter for Polygon chain
      const polygonPairs = data.pairs.filter(
        (pair: any) => pair.chainId === "polygon" || pair.chainId === "matic"
      );

      const liquidityPairs = polygonPairs.map((pair: any) => ({
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
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
