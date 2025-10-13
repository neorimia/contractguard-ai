// lib/services/crypto/types.ts
import {
  ContractSource,
  ContractMetadata,
  HolderData,
  LiquidityData,
} from "../blockchain/types";
import { RiskFlag } from "@/db/schema";

export interface ContractAnalysisData {
  address: string;
  chain: string;
  sourceCode?: ContractSource;
  metadata?: ContractMetadata;
  holderData?: HolderData;
  liquidityData?: LiquidityData;
}

export interface HeuristicResult {
  name: string;
  category: "code" | "liquidity" | "tokenomics" | "transparency";
  passed: boolean;
  severity: "low" | "medium" | "high" | "critical";
  score: number; // 0-100 (0 = safe, 100 = dangerous)
  confidence: number; // 0-100
  flag?: RiskFlag;
}

export interface RiskAssessment {
  riskScore: number;
  riskCategory: string;
  confidence: number;
  flags: RiskFlag[];
  heuristicResults: HeuristicResult[];
  recommendation: string;
}
