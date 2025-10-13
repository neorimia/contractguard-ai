/**
 * Heuristic Accuracy Tracking Service
 *
 * Tracks false positives and false negatives for each heuristic
 * Enables continuous improvement and validation
 */

interface AccuracyRecord {
  heuristicName: string;
  contractAddress: string;
  chain: string;
  flagged: boolean;
  actualRisk: boolean; // Ground truth
  timestamp: number;
}

interface HeuristicAccuracy {
  name: string;
  totalChecks: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number; // TP / (TP + FP)
  recall: number; // TP / (TP + FN)
  f1Score: number;
  accuracy: number; // (TP + TN) / Total
}

export class HeuristicAccuracyService {
  private records: AccuracyRecord[] = [];
  private readonly maxRecords = 10000;

  /**
   * Record a heuristic check result
   */
  recordCheck(record: AccuracyRecord): void {
    this.records.push(record);

    // Keep only recent records
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  /**
   * Get accuracy metrics for a specific heuristic
   */
  getAccuracy(heuristicName: string): HeuristicAccuracy {
    const heuristicRecords = this.records.filter(
      (r) => r.heuristicName === heuristicName
    );

    if (heuristicRecords.length === 0) {
      return {
        name: heuristicName,
        totalChecks: 0,
        truePositives: 0,
        falsePositives: 0,
        trueNegatives: 0,
        falseNegatives: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        accuracy: 0,
      };
    }

    // Calculate confusion matrix
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    heuristicRecords.forEach((record) => {
      if (record.flagged && record.actualRisk) truePositives++;
      else if (record.flagged && !record.actualRisk) falsePositives++;
      else if (!record.flagged && !record.actualRisk) trueNegatives++;
      else if (!record.flagged && record.actualRisk) falseNegatives++;
    });

    // Calculate metrics
    const precision =
      truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;

    const recall =
      truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0;

    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    const accuracy =
      heuristicRecords.length > 0
        ? (truePositives + trueNegatives) / heuristicRecords.length
        : 0;

    return {
      name: heuristicName,
      totalChecks: heuristicRecords.length,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      precision: Math.round(precision * 1000) / 10, // Percentage
      recall: Math.round(recall * 1000) / 10,
      f1Score: Math.round(f1Score * 1000) / 10,
      accuracy: Math.round(accuracy * 1000) / 10,
    };
  }

  /**
   * Get accuracy for all heuristics
   */
  getAllAccuracy(): HeuristicAccuracy[] {
    const heuristicNames = Array.from(
      new Set(this.records.map((r) => r.heuristicName))
    );

    return heuristicNames.map((name) => this.getAccuracy(name));
  }

  /**
   * Check if accuracy targets are met
   */
  checkTargets(): {
    falsePositiveRate: number; // Target: < 15%
    falseNegativeRate: number; // Target: < 5%
    meetsTargets: boolean;
  } {
    const totalRecords = this.records.length;

    if (totalRecords === 0) {
      return {
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        meetsTargets: false,
      };
    }

    const falsePositives = this.records.filter(
      (r) => r.flagged && !r.actualRisk
    ).length;
    const falseNegatives = this.records.filter(
      (r) => !r.flagged && r.actualRisk
    ).length;

    const falsePositiveRate = (falsePositives / totalRecords) * 100;
    const falseNegativeRate = (falseNegatives / totalRecords) * 100;

    return {
      falsePositiveRate: Math.round(falsePositiveRate * 10) / 10,
      falseNegativeRate: Math.round(falseNegativeRate * 10) / 10,
      meetsTargets: falsePositiveRate < 15 && falseNegativeRate < 5,
    };
  }

  /**
   * Get worst performing heuristics
   */
  getWorstPerformers(limit: number = 3): HeuristicAccuracy[] {
    const allAccuracy = this.getAllAccuracy();

    return allAccuracy
      .filter((h) => h.totalChecks >= 10) // Minimum sample size
      .sort((a, b) => a.f1Score - b.f1Score)
      .slice(0, limit);
  }

  /**
   * Export accuracy metrics
   */
  exportMetrics(): {
    overall: {
      falsePositiveRate: number;
      falseNegativeRate: number;
      meetsTargets: boolean;
    };
    byHeuristic: HeuristicAccuracy[];
    worstPerformers: HeuristicAccuracy[];
  } {
    return {
      overall: this.checkTargets(),
      byHeuristic: this.getAllAccuracy(),
      worstPerformers: this.getWorstPerformers(3),
    };
  }

  /**
   * Clear all records (for testing)
   */
  clear(): void {
    this.records = [];
  }
}

// Singleton instance
export const heuristicAccuracy = new HeuristicAccuracyService();
