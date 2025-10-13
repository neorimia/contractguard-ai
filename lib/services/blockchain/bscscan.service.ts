// lib/services/blockchain/bscscan.service.ts
import { BaseBlockchainService } from "./base.service";
import {
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "./types";

export class BscScanService extends BaseBlockchainService {
  constructor() {
    const apiKey =
      process.env.BSCSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "";
    const baseUrl = "https://api.bscscan.com";
    super(apiKey, baseUrl, 5); // 5 requests per second
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
    // BSC holder data - simplified implementation
    // For production, use a specialized service like Covalent or BSCScan Pro
    return {
      holderCount: 0,
      topHolderConcentration: 0,
      topHolders: [],
    };
  }

  async fetchLiquidityData(address: string): Promise<LiquidityData> {
    return this.retryFetch(async () => {
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

      const liquidityPairs = data.pairs
        .filter((pair: any) => pair.chainId === "bsc")
        .map((pair: any) => ({
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
