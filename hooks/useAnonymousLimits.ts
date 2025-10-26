/**
 * useAnonymousLimits Hook
 *
 * Manages anonymous user scan limits and prompts
 * Implements soft and hard limit thresholds for progressive signup conversion
 *
 * Business Logic:
 * - Show soft signup prompt after 1st scan (early conversion)
 * - Block scans after 2nd scan (hard limit before 3rd)
 * - Track session ID for attribution
 */

import { useState, useCallback } from "react";
import { SCAN_LIMITS } from "@/lib/constants/scan-limits";

export interface ScanMetadata {
  accessType?: string;
  scansRemaining?: number;
  prompt?: string;
  sessionId?: string;
}

export interface LimitCheckResult {
  shouldShowPrompt: boolean;
  isHardLimit: boolean;
  scansRemaining: number;
  message?: string;
}

export function useAnonymousLimits() {
  const [scansPerformed, setScansPerformed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scanMetadata, setScanMetadata] = useState<ScanMetadata | null>(null);

  /**
   * Check if user has reached scan limits and determine prompt behavior
   *
   * @returns LimitCheckResult with prompt and blocking status
   */
  const checkLimit = useCallback((): LimitCheckResult => {
    const scansRemaining = Math.max(
      0,
      SCAN_LIMITS.ANONYMOUS.MAX_SCANS - scansPerformed
    );

    // Hard limit: Block after 2 scans (before 3rd scan)
    if (scansPerformed >= SCAN_LIMITS.ANONYMOUS.HARD_LIMIT_THRESHOLD) {
      return {
        shouldShowPrompt: true,
        isHardLimit: true,
        scansRemaining: 0,
        message:
          "You've used your free scans. Sign up to continue with 3 free scans daily!",
      };
    }

    // Soft prompt: Show after 1st scan for early conversion
    if (scansPerformed >= SCAN_LIMITS.ANONYMOUS.SOFT_PROMPT_THRESHOLD) {
      return {
        shouldShowPrompt: true,
        isHardLimit: false,
        scansRemaining,
        message:
          scansRemaining === 1
            ? "Sign up to track your scan history and continue"
            : undefined,
      };
    }

    return {
      shouldShowPrompt: false,
      isHardLimit: false,
      scansRemaining,
    };
  }, [scansPerformed]);

  /**
   * Update scan count and metadata from API response
   *
   * @param metadata - Scan metadata from API response
   */
  const updateFromMetadata = useCallback((metadata: ScanMetadata) => {
    setScanMetadata(metadata);

    // Calculate scans performed from remaining count
    if (metadata.scansRemaining !== undefined) {
      const performed =
        SCAN_LIMITS.ANONYMOUS.MAX_SCANS - metadata.scansRemaining;
      setScansPerformed(performed);
    }

    // Save session ID for later use
    if (metadata.sessionId) {
      setSessionId(metadata.sessionId);
    }
  }, []);

  /**
   * Manually increment scan count (for client-side tracking)
   */
  const incrementScans = useCallback(() => {
    setScansPerformed((prev) =>
      Math.min(prev + 1, SCAN_LIMITS.ANONYMOUS.MAX_SCANS)
    );
  }, []);

  /**
   * Reset scan tracking (useful for testing or session management)
   */
  const resetScans = useCallback(() => {
    setScansPerformed(0);
    setSessionId(null);
    setScanMetadata(null);
  }, []);

  return {
    // State
    scansPerformed,
    sessionId,
    scanMetadata,

    // Methods
    checkLimit,
    updateFromMetadata,
    incrementScans,
    resetScans,

    // Setters (for backward compatibility)
    setScansPerformed,
    setSessionId,
    setScanMetadata,
  };
}