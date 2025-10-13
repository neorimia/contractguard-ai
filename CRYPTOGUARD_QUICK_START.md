# CryptoGuard Quick Start Guide

## 🚀 What's New

The **Blockchain Service Integration Layer** from the CryptoGuard Implementation Workflow has been successfully implemented! This provides the foundation for smart contract risk analysis.

## 📁 New Files Structure

```
lib/services/
├── blockchain/           # ⭐ NEW
│   ├── types.ts
│   ├── base.service.ts
│   ├── etherscan.service.ts
│   ├── bscscan.service.ts
│   ├── factory.ts
│   └── index.ts
│
└── crypto/              # ⭐ NEW
    ├── types.ts
    ├── risk-scoring.service.ts
    ├── heuristics/
    │   ├── base.heuristic.ts
    │   ├── contract-verification.heuristic.ts
    │   ├── privileged-mint.heuristic.ts
    │   ├── holder-concentration.heuristic.ts
    │   ├── liquidity-lock.heuristic.ts
    │   ├── ownership-renouncement.heuristic.ts
    │   └── index.ts
    └── index.ts

app/api/crypto/          # ⭐ NEW
└── analyze/
    └── route.ts
```

## 🔧 How to Use

### 1. Import the Services

```typescript
// Use the factory for chain-agnostic access
import { BlockchainServiceFactory } from "@/lib/services/blockchain";

const service = BlockchainServiceFactory.getService("ethereum");
const contract = await service.fetchContractSource(address);
```

### 2. Use the Risk Scoring Engine

```typescript
import { RiskScoringService } from "@/lib/services/crypto";
import { BlockchainServiceFactory } from "@/lib/services/blockchain";

async function analyzeContract(address: string, chain: string) {
  const blockchainService = BlockchainServiceFactory.getService(chain);

  // Fetch data in parallel
  const [sourceCode, metadata, holderData, liquidityData] =
    await Promise.allSettled([
      blockchainService.fetchContractSource(address),
      blockchainService.fetchContractMetadata(address),
      blockchainService.fetchHolderDistribution(address),
      blockchainService.fetchLiquidityData(address),
    ]);

  // Analyze risk
  const riskService = new RiskScoringService();
  const assessment = await riskService.calculateRiskScore({
    address,
    chain,
    sourceCode:
      sourceCode.status === "fulfilled" ? sourceCode.value : undefined,
    metadata: metadata.status === "fulfilled" ? metadata.value : undefined,
    holderData:
      holderData.status === "fulfilled" ? holderData.value : undefined,
    liquidityData:
      liquidityData.status === "fulfilled" ? liquidityData.value : undefined,
  });

  return assessment;
}
```

### 3. Call the API Endpoint

**POST Request**:

```bash
curl -X POST http://localhost:3000/api/crypto/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
    "chain": "ethereum"
  }'
```

**GET Request** (retrieve cached result):

```bash
curl "http://localhost:3000/api/crypto/analyze?address=0xdac17f958d2ee523a2206206994597c13d831ec7&chain=ethereum"
```

### 4. Response Format

```typescript
{
  data: {
    contractAddress: string;
    chain: string;
    riskScore: number;          // 0-100
    riskCategory: string;        // 'very_low' | 'low' | 'medium' | 'high' | 'critical'
    confidence: number;          // 0-100
    flags: RiskFlag[];          // Array of detected issues
    metadata: {
      deployer: string;
      deployDate: string;
      txCount?: number;
    };
    holderCount?: number;
    topHolderConcentration?: number;
    liquidityUsd?: string;
    isVerified: boolean;
    recommendation: string;      // Human-readable advice
    heuristicResults: HeuristicResult[];
  };
  status: 'success' | 'error';
  cached: boolean;
}
```

## 🧪 Testing

### Run the Test Script

```bash
# Make sure dev server is running first
npm run dev

# In another terminal
npx ts-node scripts/test-crypto-api.ts
```

### Manual Testing

```typescript
// In your code or browser console
const response = await fetch("/api/crypto/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    chain: "ethereum",
  }),
});

const result = await response.json();
console.log(result);
```

## 📊 Risk Heuristics Explained

### 1. Contract Verification (Weight: 20)

- ✅ **Pass**: Contract is verified on blockchain explorer
- ❌ **Fail**: Unverified contract (80 risk score, high severity)

### 2. Privileged Mint Functions (Weight: 25)

- ✅ **Pass**: No mint functions or public mint
- ❌ **Fail**: Owner can mint unlimited tokens (90 risk score, critical)

### 3. Holder Concentration (Weight: 20)

- ✅ **Pass**: Distributed token ownership
- ❌ **Fail**: Top 10 wallets hold >50% (70+ risk score)

### 4. Liquidity Lock (Weight: 25)

- ✅ **Pass**: Liquidity is locked or owner can't remove
- ❌ **Fail**: Owner can remove liquidity (75 risk score, high)

### 5. Ownership Renouncement (Weight: 15)

- ✅ **Pass**: Ownership renounced
- ❌ **Fail**: Owner still has control (50 risk score, medium)

## 🎯 Risk Categories

| Score  | Category | Recommendation                   |
| ------ | -------- | -------------------------------- |
| 0-20   | very_low | ✅ Minimal red flags             |
| 20-40  | low      | ✅ Few concerns detected         |
| 40-60  | medium   | ⚡ Proceed with caution          |
| 60-80  | high     | ⚠️ Significant concerns          |
| 80-100 | critical | 🚨 AVOID - High scam probability |

## ⚡ Performance

- **Cached Response**: <200ms
- **Fresh Analysis**: <30s (target)
- **Cache Strategy**:
  - Redis: 5 minutes
  - Database: 24 hours

## 🔐 Environment Variables

Required in `.env.local`:

```bash
# Blockchain APIs (required)
ETHERSCAN_API_KEY=your_etherscan_key
ALCHEMY_API_KEY=your_alchemy_key

# Optional for BSC
BSCSCAN_API_KEY=your_bscscan_key

# Database & Cache (required)
DATABASE_URL=postgresql://...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

## 🚧 Next Steps

### Frontend Integration (TODO #7)

Create UI components:

```typescript
// components/crypto/CryptoScanInterface.tsx
import { useState } from 'react';

export function CryptoScanInterface() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    const response = await fetch('/api/crypto/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, chain }),
    });
    const data = await response.json();
    setResult(data.data);
  };

  return (
    <div>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Contract address..."
      />
      <select value={chain} onChange={(e) => setChain(e.target.value)}>
        <option value="ethereum">Ethereum</option>
        <option value="bsc">BSC</option>
      </select>
      <button onClick={handleScan}>Analyze</button>

      {result && <CryptoResultsDisplay result={result} />}
    </div>
  );
}
```

### Add More Heuristics (Phase 2)

```typescript
// lib/services/crypto/heuristics/transfer-restriction.heuristic.ts
export class TransferRestrictionHeuristic extends BaseHeuristic {
  name = "Transfer Restrictions";
  category = "code";
  weight = 20;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    // Check for blacklist/whitelist in transfer functions
  }
}

// Register it
riskScoringService.addHeuristic(new TransferRestrictionHeuristic());
```

## 📚 Documentation

- **Full Implementation**: See `CRYPTOGUARD_PHASE1_IMPLEMENTATION.md`
- **Workflow Spec**: See `CRYPTOGUARD_IMPLEMENTATION_WORKFLOW.md`
- **API Reference**: See `docs/API_REFERENCE.md`

## 🐛 Troubleshooting

### API Returns 503 Error

- Check API keys are set correctly
- Verify network connectivity
- Check rate limits haven't been exceeded

### No Holder Data on BSC

- Holder distribution requires specialized service
- Currently limited on BSC (use Covalent API for production)

### Cache Not Working

- Verify Redis connection
- Check UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN

---

**Status**: ✅ Phase 1 Complete
**Ready For**: Frontend Integration & Testing
