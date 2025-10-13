/**
 * Database Query Optimizations
 *
 * Optimized queries for common operations
 * Includes proper indexing strategies
 */

import { db } from "@/db";
import { cryptoAudits } from "@/db/schema";
import { eq, and, desc, sql, gt, lt } from "drizzle-orm";

/**
 * Optimized query to find recent audits
 * Uses index on createdAt
 */
export async function findRecentAudits(limit: number = 10) {
  return db
    .select()
    .from(cryptoAudits)
    .orderBy(desc(cryptoAudits.createdAt))
    .limit(limit);
}

/**
 * Optimized query to find audit by address and chain
 * Uses composite index on (contractAddress, chain)
 */
export async function findAuditByContract(address: string, chain: string) {
  return db
    .select()
    .from(cryptoAudits)
    .where(
      and(
        eq(cryptoAudits.contractAddress, address.toLowerCase()),
        eq(cryptoAudits.chain, chain.toLowerCase())
      )
    )
    .limit(1);
}

/**
 * Optimized query to find high-risk contracts
 * Uses index on riskScore
 */
export async function findHighRiskContracts(
  minScore: number = 70,
  limit: number = 20
) {
  return db
    .select()
    .from(cryptoAudits)
    .where(gt(cryptoAudits.riskScore, minScore))
    .orderBy(desc(cryptoAudits.riskScore))
    .limit(limit);
}

/**
 * Optimized query to clean up expired audits
 * Uses index on expiresAt
 */
export async function cleanExpiredAudits() {
  const now = new Date();

  const result = await db
    .delete(cryptoAudits)
    .where(lt(cryptoAudits.expiresAt, now))
    .returning({ deletedId: cryptoAudits.id });

  return result.length;
}

/**
 * Get audit statistics (optimized with aggregation)
 */
export async function getAuditStatistics() {
  const stats = await db
    .select({
      totalAudits: sql<number>`count(*)`,
      avgRiskScore: sql<number>`avg(${cryptoAudits.riskScore})`,
      criticalCount: sql<number>`sum(case when ${cryptoAudits.riskCategory} = 'critical' then 1 else 0 end)`,
      highCount: sql<number>`sum(case when ${cryptoAudits.riskCategory} = 'high' then 1 else 0 end)`,
      mediumCount: sql<number>`sum(case when ${cryptoAudits.riskCategory} = 'medium' then 1 else 0 end)`,
      lowCount: sql<number>`sum(case when ${cryptoAudits.riskCategory} = 'low' then 1 else 0 end)`,
      verifiedCount: sql<number>`sum(case when ${cryptoAudits.isVerified} = true then 1 else 0 end)`,
    })
    .from(cryptoAudits);

  return stats[0];
}

/**
 * Recommended database indexes
 *
 * Add these to your migration:
 *
 * CREATE INDEX IF NOT EXISTS idx_crypto_audits_created ON crypto_audits(created_at DESC);
 * CREATE INDEX IF NOT EXISTS idx_crypto_audits_risk ON crypto_audits(risk_score DESC);
 * CREATE INDEX IF NOT EXISTS idx_crypto_audits_expires ON crypto_audits(expires_at);
 * CREATE INDEX IF NOT EXISTS idx_crypto_audits_contract_chain ON crypto_audits(contract_address, chain);
 * CREATE INDEX IF NOT EXISTS idx_crypto_audits_category ON crypto_audits(risk_category);
 */

export const RECOMMENDED_INDEXES = `
-- Performance indexes for crypto_audits table

-- Index for recent audits query
CREATE INDEX IF NOT EXISTS idx_crypto_audits_created 
ON crypto_audits(created_at DESC);

-- Index for high-risk queries
CREATE INDEX IF NOT EXISTS idx_crypto_audits_risk 
ON crypto_audits(risk_score DESC);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_crypto_audits_expires 
ON crypto_audits(expires_at);

-- Composite index for contract lookup
CREATE INDEX IF NOT EXISTS idx_crypto_audits_contract_chain 
ON crypto_audits(contract_address, chain);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_crypto_audits_category 
ON crypto_audits(risk_category);

-- Index for chain filtering
CREATE INDEX IF NOT EXISTS idx_crypto_audits_chain 
ON crypto_audits(chain);
`;
