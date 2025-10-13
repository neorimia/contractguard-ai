/**
 * Pattern Detection Service
 *
 * Detects time-series patterns in contract behavior
 * Identifies pump-and-dump, soft rug pulls, and other scam signatures
 */

interface TransactionData {
  timestamp: string;
  value: string;
  from: string;
  to: string;
  tokenAmount?: string;
}

interface PriceData {
  timestamp: string;
  price: number;
  volume: number;
}

interface PatternDetectionResult {
  pattern: string;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: string[];
}

export class PatternDetectionService {
  /**
   * Analyze transaction patterns for scam signatures
   */
  async analyzePatterns(
    contractAddress: string,
    transactions: TransactionData[],
    priceHistory?: PriceData[]
  ): Promise<PatternDetectionResult[]> {
    const patterns: PatternDetectionResult[] = [];

    // Detect pump and dump
    const pumpDump = this.detectPumpAndDump(priceHistory || []);
    if (pumpDump) patterns.push(pumpDump);

    // Detect soft rug pull (gradual team selling)
    const softRug = this.detectSoftRugPull(transactions);
    if (softRug) patterns.push(softRug);

    // Detect sudden wallet concentration
    const concentration = this.detectSuddenConcentration(transactions);
    if (concentration) patterns.push(concentration);

    // Detect liquidity removal pattern
    const liquidityExit = this.detectLiquidityExit(transactions);
    if (liquidityExit) patterns.push(liquidityExit);

    return patterns;
  }

  /**
   * Detect pump and dump signature
   *
   * Characteristics:
   * - Rapid price increase (>100% in <24h)
   * - Followed by sharp crash (>50% drop)
   * - High volume spike during pump
   */
  private detectPumpAndDump(
    priceHistory: PriceData[]
  ): PatternDetectionResult | null {
    if (priceHistory.length < 10) return null;

    const evidence: string[] = [];
    let hasRapidIncrease = false;
    let hasSharpCrash = false;

    // Look for rapid price increases
    for (let i = 1; i < priceHistory.length; i++) {
      const prev = priceHistory[i - 1];
      const current = priceHistory[i];

      const priceChange = ((current.price - prev.price) / prev.price) * 100;
      const timeDiff =
        new Date(current.timestamp).getTime() -
        new Date(prev.timestamp).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Rapid increase: >100% in <24 hours
      if (priceChange > 100 && hoursDiff < 24) {
        hasRapidIncrease = true;
        evidence.push(
          `Price spike: +${priceChange.toFixed(0)}% in ${hoursDiff.toFixed(0)}h`
        );
      }

      // Sharp crash: >50% drop
      if (priceChange < -50) {
        hasSharpCrash = true;
        evidence.push(`Price crash: ${priceChange.toFixed(0)}% drop`);
      }
    }

    if (hasRapidIncrease && hasSharpCrash) {
      return {
        pattern: "pump_and_dump",
        confidence: 85,
        severity: "critical",
        description:
          "Classic pump-and-dump pattern detected. Rapid price increase followed by sharp crash.",
        evidence,
      };
    }

    return null;
  }

  /**
   * Detect soft rug pull
   *
   * Characteristics:
   * - Gradual selling from deployer/team wallets
   * - Steady price decline over days/weeks
   * - Increasing team wallet concentration
   */
  private detectSoftRugPull(
    transactions: TransactionData[]
  ): PatternDetectionResult | null {
    if (transactions.length < 50) return null;

    const evidence: string[] = [];
    const teamWallets = new Set<string>();
    let largeSellCount = 0;

    // Identify potential team wallets (addresses with large early balances)
    const earlyTransactions = transactions.slice(0, 10);
    earlyTransactions.forEach((tx) => {
      const amount = parseFloat(tx.tokenAmount || "0");
      if (amount > 1000000) {
        // Threshold for "large"
        teamWallets.add(tx.to);
      }
    });

    // Check for gradual selling from team wallets
    transactions.forEach((tx) => {
      if (teamWallets.has(tx.from)) {
        const amount = parseFloat(tx.tokenAmount || "0");
        if (amount > 500000) {
          largeSellCount++;
          evidence.push(
            `Team wallet ${tx.from.slice(0, 8)}... sold large amount`
          );
        }
      }
    });

    if (largeSellCount >= 3 && teamWallets.size > 0) {
      return {
        pattern: "soft_rug_pull",
        confidence: 70,
        severity: "high",
        description: `${largeSellCount} large sell events from potential team wallets detected. Possible soft rug pull in progress.`,
        evidence: evidence.slice(0, 5), // Show top 5
      };
    }

    return null;
  }

  /**
   * Detect sudden wallet concentration
   *
   * Characteristics:
   * - New wallets accumulating large amounts quickly
   * - Coordinated buying pattern
   * - Preparation for dump
   */
  private detectSuddenConcentration(
    transactions: TransactionData[]
  ): PatternDetectionResult | null {
    if (transactions.length < 20) return null;

    const evidence: string[] = [];
    const walletAccumulation = new Map<string, number>();

    // Recent transactions (last 100)
    const recentTx = transactions.slice(-100);

    // Track accumulation
    recentTx.forEach((tx) => {
      const amount = parseFloat(tx.tokenAmount || "0");
      const current = walletAccumulation.get(tx.to) || 0;
      walletAccumulation.set(tx.to, current + amount);
    });

    // Find wallets with rapid accumulation
    const largeAccumulators = Array.from(walletAccumulation.entries())
      .filter(([_, amount]) => amount > 500000)
      .sort((a, b) => b[1] - a[1]);

    if (largeAccumulators.length >= 3) {
      largeAccumulators.slice(0, 3).forEach(([wallet, amount]) => {
        evidence.push(
          `${wallet.slice(0, 8)}... accumulated ${amount.toLocaleString()} tokens`
        );
      });

      return {
        pattern: "sudden_concentration",
        confidence: 65,
        severity: "medium",
        description: `${largeAccumulators.length} wallets rapidly accumulating large token amounts. Possible coordinated action.`,
        evidence,
      };
    }

    return null;
  }

  /**
   * Detect liquidity exit pattern
   *
   * Characteristics:
   * - Large liquidity removals
   * - Followed by reduced trading activity
   * - Price impact from removals
   */
  private detectLiquidityExit(
    transactions: TransactionData[]
  ): PatternDetectionResult | null {
    // This would analyze liquidity pool removal events
    // For now, return null as placeholder
    // In production, would query Uniswap Burn events

    return null;
  }

  /**
   * Calculate transaction velocity
   *
   * Measures how quickly transactions are happening
   */
  private calculateVelocity(transactions: TransactionData[]): {
    avgTxPerHour: number;
    peakTxPerHour: number;
    velocityTrend: "increasing" | "decreasing" | "stable";
  } {
    if (transactions.length < 2) {
      return {
        avgTxPerHour: 0,
        peakTxPerHour: 0,
        velocityTrend: "stable",
      };
    }

    // Group transactions by hour
    const txByHour = new Map<string, number>();

    transactions.forEach((tx) => {
      const hour = new Date(tx.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      txByHour.set(hour, (txByHour.get(hour) || 0) + 1);
    });

    const hourlyRates = Array.from(txByHour.values());
    const avgTxPerHour =
      hourlyRates.reduce((sum, rate) => sum + rate, 0) / hourlyRates.length;
    const peakTxPerHour = Math.max(...hourlyRates);

    // Determine trend (comparing first half vs second half)
    const midpoint = Math.floor(hourlyRates.length / 2);
    const firstHalfAvg =
      hourlyRates.slice(0, midpoint).reduce((sum, rate) => sum + rate, 0) /
      midpoint;
    const secondHalfAvg =
      hourlyRates.slice(midpoint).reduce((sum, rate) => sum + rate, 0) /
      (hourlyRates.length - midpoint);

    let velocityTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (secondHalfAvg > firstHalfAvg * 1.5) velocityTrend = "increasing";
    else if (secondHalfAvg < firstHalfAvg * 0.5) velocityTrend = "decreasing";

    return {
      avgTxPerHour,
      peakTxPerHour,
      velocityTrend,
    };
  }
}
