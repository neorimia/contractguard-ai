// lib/services/contract.service.ts
interface ContractData {
  address: string;
  sourceCode: string;
  bytecode: string;
  isVerified: boolean;
  contractName: string;
  compiler: string;
}

interface EnrichmentData {
  holderCount: number;
  liquidity: string;
  ownerBalance: string;
  recentTransactions: number;
}

export class ContractService {
  private etherscanApiKey: string;
  private alchemyApiKey: string;

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY!;
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY!;
  }

  async fetchContract(
    address: string,
    chain: string = "ethereum"
  ): Promise<ContractData> {
    const baseUrl = this.getEtherscanUrl(chain);
    const chainId = this.getChainId(chain);

    try {
      // Check if API key is configured
      if (!this.etherscanApiKey || this.etherscanApiKey === "undefined") {
        throw new Error(
          "ETHERSCAN_API_KEY is not configured. Please add it to .env.local"
        );
      }

      // Fetch source code using Etherscan API V2
      const sourceResponse = await fetch(
        `${baseUrl}/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`
      );

      const sourceData = await sourceResponse.json();

      // Log the response for debugging
      console.log(
        "Etherscan API Response:",
        JSON.stringify(sourceData, null, 2)
      );

      if (sourceData.status !== "1" || !sourceData.result[0]) {
        console.error(
          "Etherscan error:",
          sourceData.message || sourceData.result
        );
        throw new Error(
          `Contract not found or not verified: ${sourceData.message || "Unknown error"}`
        );
      }

      const contractInfo = sourceData.result[0];

      // Check if verified
      if (contractInfo.SourceCode === "") {
        return {
          address,
          sourceCode: "",
          bytecode: "",
          isVerified: false,
          contractName: "",
          compiler: "",
        };
      }

      return {
        address,
        sourceCode: contractInfo.SourceCode,
        bytecode: contractInfo.Bytecode || "",
        isVerified: true,
        contractName: contractInfo.ContractName,
        compiler: contractInfo.CompilerVersion,
      };
    } catch (error) {
      console.error("Error fetching contract:", error);
      throw error;
    }
  }

  async getEnrichmentData(
    address: string,
    chain: string = "ethereum"
  ): Promise<EnrichmentData> {
    try {
      // Check if Alchemy API key is configured
      if (!this.alchemyApiKey || this.alchemyApiKey === "undefined") {
        console.warn(
          "Alchemy API key not configured, skipping enrichment data"
        );
        return this.getEmptyEnrichmentData();
      }

      const alchemyUrl = this.getAlchemyUrl(chain);

      // Parallel fetch for better performance
      const [holderData, ownerBalance, transactionCount, liquidityData] =
        await Promise.allSettled([
          this.getHolderCount(address, alchemyUrl),
          this.getOwnerBalance(address, alchemyUrl),
          this.getTransactionCount(address, alchemyUrl),
          this.getLiquidityInfo(address),
        ]);

      return {
        holderCount: holderData.status === "fulfilled" ? holderData.value : 0,
        liquidity:
          liquidityData.status === "fulfilled" ? liquidityData.value : "0",
        ownerBalance:
          ownerBalance.status === "fulfilled" ? ownerBalance.value : "0",
        recentTransactions:
          transactionCount.status === "fulfilled" ? transactionCount.value : 0,
      };
    } catch (error) {
      console.error("Error fetching enrichment data:", error);
      return this.getEmptyEnrichmentData();
    }
  }

  private async getHolderCount(
    address: string,
    alchemyUrl: string
  ): Promise<number> {
    try {
      // Get token metadata which includes holder information
      const response = await fetch(alchemyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenMetadata",
          params: [address],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Alchemy API error (holder count):", data.error);
        return 0;
      }

      // Note: Alchemy doesn't directly provide holder count
      // For accurate holder count, we'd need to use a specialized service like Ethplorer or Covalent
      // Returning 0 for now with a fallback to estimate
      return data.result?.holders || 0;
    } catch (error) {
      console.error("Error fetching holder count:", error);
      return 0;
    }
  }

  private async getOwnerBalance(
    address: string,
    alchemyUrl: string
  ): Promise<string> {
    try {
      const response = await fetch(alchemyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Alchemy API error (balance):", data.error);
        return "0";
      }

      // Convert from hex to decimal
      const balanceWei = parseInt(data.result, 16);
      const balanceEth = balanceWei / 1e18;

      return balanceEth.toFixed(4);
    } catch (error) {
      console.error("Error fetching owner balance:", error);
      return "0";
    }
  }

  private async getTransactionCount(
    address: string,
    alchemyUrl: string
  ): Promise<number> {
    try {
      const response = await fetch(alchemyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionCount",
          params: [address, "latest"],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Alchemy API error (tx count):", data.error);
        return 0;
      }

      return parseInt(data.result, 16);
    } catch (error) {
      console.error("Error fetching transaction count:", error);
      return 0;
    }
  }

  private async getLiquidityInfo(address: string): Promise<string> {
    try {
      // Use DexScreener API to get liquidity info
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${address}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn(`DexScreener API returned ${response.status}`);
        return "0";
      }

      const data = await response.json();

      if (!data.pairs || data.pairs.length === 0) {
        return "0";
      }

      // Get the pair with highest liquidity
      const bestPair = data.pairs.reduce((max: any, pair: any) => {
        const currentLiq = parseFloat(pair.liquidity?.usd || "0");
        const maxLiq = parseFloat(max.liquidity?.usd || "0");
        return currentLiq > maxLiq ? pair : max;
      }, data.pairs[0]);

      const liquidityUSD = bestPair.liquidity?.usd || "0";

      // Format nicely
      if (liquidityUSD === "0") return "0";

      const liq = parseFloat(liquidityUSD);
      if (liq >= 1000000) {
        return `$${(liq / 1000000).toFixed(2)}M`;
      } else if (liq >= 1000) {
        return `$${(liq / 1000).toFixed(2)}K`;
      } else {
        return `$${liq.toFixed(2)}`;
      }
    } catch (error) {
      console.error("Error fetching liquidity data:", error);
      return "0";
    }
  }

  private getAlchemyUrl(chain: string): string {
    const networks: Record<string, string> = {
      ethereum: "eth-mainnet",
      polygon: "polygon-mainnet",
      base: "base-mainnet",
    };

    const network = networks[chain] || "eth-mainnet";
    return `https://${network}.g.alchemy.com/v2/${this.alchemyApiKey}`;
  }

  private getEmptyEnrichmentData(): EnrichmentData {
    return {
      holderCount: 0,
      liquidity: "0",
      ownerBalance: "0",
      recentTransactions: 0,
    };
  }

  private getEtherscanUrl(chain: string): string {
    const urls: Record<string, string> = {
      ethereum: "https://api.etherscan.io",
      bsc: "https://api.bscscan.com",
      polygon: "https://api.polygonscan.com",
      base: "https://api.basescan.org",
    };
    return urls[chain] || urls.ethereum;
  }

  private getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      bsc: 56,
      polygon: 137,
      base: 8453,
    };
    return chainIds[chain] || 1;
  }

  validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
