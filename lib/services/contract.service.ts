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

    async fetchContract(address: string, chain: string = 'ethereum'): Promise<ContractData> {
        const baseUrl = this.getEtherscanUrl(chain);

        try {
            // Fetch source code
            const sourceResponse = await fetch(
                `${baseUrl}/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`
            );

            const sourceData = await sourceResponse.json();

            if (sourceData.status !== '1' || !sourceData.result[0]) {
                throw new Error('Contract not found or not verified');
            }

            const contractInfo = sourceData.result[0];

            // Check if verified
            if (contractInfo.SourceCode === '') {
                return {
                    address,
                    sourceCode: '',
                    bytecode: '',
                    isVerified: false,
                    contractName: '',
                    compiler: '',
                };
            }

            return {
                address,
                sourceCode: contractInfo.SourceCode,
                bytecode: contractInfo.Bytecode || '',
                isVerified: true,
                contractName: contractInfo.ContractName,
                compiler: contractInfo.CompilerVersion,
            };
        } catch (error) {
            console.error('Error fetching contract:', error);
            throw error;
        }
    }

    async getEnrichmentData(address: string): Promise<EnrichmentData> {
        try {
            // Get holder count (simplified - use Alchemy or Etherscan)
            const response = await fetch(
                `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'alchemy_getTokenBalances',
                        params: [address]
                    })
                }
            );

            const data = await response.json();

            // Fetch owner balance
            const ownerResponse = await fetch(
                `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'eth_getBalance',
                        params: [address, 'latest']
                    })
                }
            );

            const ownerData = await ownerResponse.json();

            return {
                holderCount: data.result?.tokenBalances?.length || 0,
                liquidity: '0', // Add DexScreener API call here
                ownerBalance: ownerData.result || '0',
                recentTransactions: 0, // Add transaction count
            };
        } catch (error) {
            console.error('Error fetching enrichment data:', error);
            return {
                holderCount: 0,
                liquidity: '0',
                ownerBalance: '0',
                recentTransactions: 0,
            };
        }
    }

    private getEtherscanUrl(chain: string): string {
        const urls: Record<string, string> = {
            ethereum: 'https://api.etherscan.io',
            bsc: 'https://api.bscscan.com',
            polygon: 'https://api.polygonscan.com',
            base: 'https://api.basescan.org',
        };
        return urls[chain] || urls.ethereum;
    }

    validateAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}
