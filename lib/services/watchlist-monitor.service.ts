// lib/services/watchlist-monitor.service.ts
import { db } from "@/db";
import {
  watchlists,
  watchlistSnapshots,
  alertHistory,
  cryptoAudits,
  users,
  type Watchlist,
  type WatchlistSnapshot,
  type CryptoAudit,
  type User,
  type RiskFlag,
} from "@/db/schema";
import { EmailService } from "./email.service";
import { eq, and, desc } from "drizzle-orm";

type AlertType =
  | "risk_increase"
  | "new_flags"
  | "liquidity_change"
  | "holder_change"
  | "critical_alert";
type Severity = "low" | "medium" | "high" | "critical";

interface AlertData {
  type: AlertType;
  severity: Severity;
  previousValue: any;
  currentValue: any;
  changePercentage?: number;
  newFlags?: RiskFlag[];
}

/**
 * WatchlistMonitorService - Monitors contract watchlists and sends alerts
 */
export class WatchlistMonitorService {
  private emailService = new EmailService();
  private serviceName = "WatchlistMonitorService";

  /**
   * Check all active watchlists for changes
   * Called by cron job every 5 minutes
   */
  async checkAllWatchlists(): Promise<{
    checked: number;
    alertsSent: number;
  }> {
    try {
      console.log(`[${this.serviceName}] Starting watchlist check...`);

      // Get all active watchlists with alerts enabled
      const activeWatchlists = await db
        .select()
        .from(watchlists)
        .where(
          and(
            eq(watchlists.alertEnabled, true),
            // Only check instant alerts for now (hourly/daily handled separately)
            eq(watchlists.alertFrequency, "instant"),
          ),
        );

      console.log(
        `[${this.serviceName}] Found ${activeWatchlists.length} active watchlists`,
      );

      let alertsSent = 0;

      // Process each watchlist
      for (const watchlist of activeWatchlists) {
        const sent = await this.checkWatchlist(watchlist);
        alertsSent += sent;
      }

      console.log(
        `[${this.serviceName}] Watchlist check completed. Sent ${alertsSent} alerts.`,
      );

      return {
        checked: activeWatchlists.length,
        alertsSent,
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Error checking watchlists:`, error);
      throw error;
    }
  }

  /**
   * Check individual watchlist for changes
   * Returns number of alerts sent
   */
  private async checkWatchlist(watchlist: Watchlist): Promise<number> {
    try {
      // Get latest audit for this contract
      const [latestAudit] = await db
        .select()
        .from(cryptoAudits)
        .where(
          and(
            eq(cryptoAudits.contractAddress, watchlist.contractAddress),
            eq(cryptoAudits.chain, watchlist.chain),
          ),
        )
        .orderBy(desc(cryptoAudits.createdAt))
        .limit(1);

      if (!latestAudit) {
        console.log(
          `[${this.serviceName}] No audit found for ${watchlist.contractAddress}`,
        );
        return 0;
      }

      // Get previous snapshot
      const [previousSnapshot] = await db
        .select()
        .from(watchlistSnapshots)
        .where(eq(watchlistSnapshots.watchlistId, watchlist.id))
        .orderBy(desc(watchlistSnapshots.createdAt))
        .limit(1);

      // If no previous snapshot, create one and skip alert
      if (!previousSnapshot) {
        await this.createSnapshot(watchlist.id, latestAudit);
        console.log(
          `[${this.serviceName}] Created initial snapshot for ${watchlist.contractAddress}`,
        );
        return 0;
      }

      // Detect changes and trigger alerts
      const alertsSent = await this.detectChangesAndAlert(
        watchlist,
        previousSnapshot,
        latestAudit,
      );

      // Create new snapshot
      await this.createSnapshot(watchlist.id, latestAudit);

      // Update last checked timestamp
      await db
        .update(watchlists)
        .set({ lastChecked: new Date() })
        .where(eq(watchlists.id, watchlist.id));

      return alertsSent;
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error checking watchlist ${watchlist.id}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Detect changes and send alerts
   */
  private async detectChangesAndAlert(
    watchlist: Watchlist,
    previousSnapshot: WatchlistSnapshot,
    currentAudit: CryptoAudit,
  ): Promise<number> {
    const alerts: AlertData[] = [];

    // 1. Check risk score increase
    if (
      watchlist.alertOnRiskIncrease &&
      currentAudit.riskScore &&
      previousSnapshot.riskScore
    ) {
      const riskChange = currentAudit.riskScore - previousSnapshot.riskScore;
      if (riskChange >= (watchlist.riskIncreaseThreshold || 10)) {
        alerts.push({
          type: "risk_increase",
          severity: this.calculateSeverity(riskChange),
          previousValue: previousSnapshot.riskScore,
          currentValue: currentAudit.riskScore,
          changePercentage: (riskChange / previousSnapshot.riskScore) * 100,
        });
      }
    }

    // 2. Check for new flags
    if (watchlist.alertOnNewFlags) {
      const newFlags = this.detectNewFlags(
        previousSnapshot.flags || [],
        currentAudit.flags || [],
      );

      if (newFlags.length > 0) {
        alerts.push({
          type: "new_flags",
          severity: this.calculateFlagSeverity(newFlags),
          previousValue: previousSnapshot.flagCount,
          currentValue: (currentAudit.flags || []).length,
          newFlags,
        });
      }
    }

    // 3. Check liquidity changes
    if (
      watchlist.alertOnLiquidityChange &&
      previousSnapshot.liquidityUsd &&
      currentAudit.liquidityUsd
    ) {
      const liquidityChange = this.calculatePercentageChange(
        Number(previousSnapshot.liquidityUsd),
        Number(currentAudit.liquidityUsd),
      );

      if (
        Math.abs(liquidityChange) >= (watchlist.liquidityChangeThreshold || 20)
      ) {
        alerts.push({
          type: "liquidity_change",
          severity: liquidityChange < 0 ? "high" : "medium",
          previousValue: previousSnapshot.liquidityUsd,
          currentValue: currentAudit.liquidityUsd,
          changePercentage: liquidityChange,
        });
      }
    }

    // 4. Check holder changes
    if (
      watchlist.alertOnHolderChange &&
      previousSnapshot.holderCount &&
      currentAudit.holderCount
    ) {
      const holderChange = this.calculatePercentageChange(
        previousSnapshot.holderCount,
        currentAudit.holderCount,
      );

      if (Math.abs(holderChange) >= (watchlist.holderChangeThreshold || 15)) {
        alerts.push({
          type: "holder_change",
          severity: holderChange < 0 ? "high" : "low",
          previousValue: previousSnapshot.holderCount,
          currentValue: currentAudit.holderCount,
          changePercentage: holderChange,
        });
      }
    }

    // Send alerts
    if (alerts.length > 0) {
      await this.sendAlerts(watchlist, currentAudit, alerts);
      return alerts.length;
    }

    return 0;
  }

  /**
   * Send alert emails
   */
  private async sendAlerts(
    watchlist: Watchlist,
    currentAudit: CryptoAudit,
    alerts: AlertData[],
  ): Promise<void> {
    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, watchlist.userId));

    if (!user) {
      console.log(
        `[${this.serviceName}] User not found for watchlist ${watchlist.id}`,
      );
      return;
    }

    // Check rate limiting
    if (!this.canSendAlert(user)) {
      console.log(
        `[${this.serviceName}] Rate limit reached for user ${user.id}`,
      );
      return;
    }

    // Send email for each alert type
    for (const alert of alerts) {
      try {
        const emailContext = this.buildEmailContext(
          watchlist,
          currentAudit,
          alert,
          user,
        );

        await this.emailService.sendContractAlert(
          user.alertEmail || user.email,
          emailContext,
        );

        // Record alert in history
        await db.insert(alertHistory).values({
          watchlistId: watchlist.id,
          userId: user.id,
          alertType: alert.type,
          severity: alert.severity,
          previousValue: alert.previousValue,
          currentValue: alert.currentValue,
          changePercentage: alert.changePercentage
            ? alert.changePercentage.toString()
            : null,
          emailSent: true,
          emailSentAt: new Date(),
          metadata: {
            contractAddress: watchlist.contractAddress,
            chain: watchlist.chain,
            riskScoreChange:
              alert.type === "risk_increase"
                ? Number(alert.currentValue) - Number(alert.previousValue)
                : undefined,
            newFlags: alert.newFlags,
            triggerReason: `${alert.type} threshold exceeded`,
          },
        });

        // Update watchlist last alert sent
        await db
          .update(watchlists)
          .set({ lastAlertSent: new Date() })
          .where(eq(watchlists.id, watchlist.id));

        console.log(
          `[${this.serviceName}] Alert sent for ${watchlist.contractAddress}: ${alert.type}`,
        );
      } catch (error) {
        console.error(`[${this.serviceName}] Error sending alert:`, error);

        // Record failed alert
        await db.insert(alertHistory).values({
          watchlistId: watchlist.id,
          userId: user.id,
          alertType: alert.type,
          severity: alert.severity,
          previousValue: alert.previousValue,
          currentValue: alert.currentValue,
          emailSent: false,
          emailError: error instanceof Error ? error.message : "Unknown error",
          metadata: {
            contractAddress: watchlist.contractAddress,
            chain: watchlist.chain,
          },
        });
      }
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Create snapshot from audit data
   */
  private async createSnapshot(
    watchlistId: string,
    audit: CryptoAudit,
  ): Promise<void> {
    await db.insert(watchlistSnapshots).values({
      watchlistId,
      riskScore: audit.riskScore || 0,
      riskCategory: audit.riskCategory,
      flagCount: (audit.flags || []).length,
      flags: audit.flags,
      holderCount: audit.holderCount,
      liquidityUsd: audit.liquidityUsd,
      topHolderConcentration: audit.topHolderConcentration,
    });
  }

  /**
   * Detect new flags that weren't in previous snapshot
   */
  private detectNewFlags(
    oldFlags: RiskFlag[],
    newFlags: RiskFlag[],
  ): RiskFlag[] {
    const oldFlagTypes = new Set(oldFlags.map((f) => f.type));
    return newFlags.filter((f) => !oldFlagTypes.has(f.type));
  }

  /**
   * Calculate percentage change between two values
   */
  private calculatePercentageChange(
    oldValue: number,
    newValue: number,
  ): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Calculate severity based on risk score change
   */
  private calculateSeverity(riskChange: number): Severity {
    if (riskChange >= 30) return "critical";
    if (riskChange >= 20) return "high";
    if (riskChange >= 10) return "medium";
    return "low";
  }

  /**
   * Calculate severity based on new flags
   */
  private calculateFlagSeverity(flags: RiskFlag[]): Severity {
    const hasCritical = flags.some((f) => f.severity === "critical");
    if (hasCritical) return "critical";

    const hasHigh = flags.some((f) => f.severity === "high");
    if (hasHigh) return "high";

    return "medium";
  }

  /**
   * Check if user can receive more alerts (rate limiting)
   */
  private canSendAlert(user: User): boolean {
    // Check daily alert limit
    const now = new Date();
    const lastAlertDate = user.lastAlertSent
      ? new Date(user.lastAlertSent)
      : null;

    // Reset counter if new day
    if (!lastAlertDate || !this.isSameDay(lastAlertDate, now)) {
      return true;
    }

    // Check against max alerts per day (stored in user preferences)
    const maxAlerts = user.maxAlertsPerDay || 10;
    // TODO: Implement proper counter tracking
    return true; // For now, always allow
  }

  /**
   * Check if two dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Build email context from alert data
   */
  private buildEmailContext(
    watchlist: Watchlist,
    audit: CryptoAudit,
    alert: AlertData,
    user: User,
  ): any {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    return {
      userName: user.displayName,
      contractAddress: watchlist.contractAddress,
      contractNickname: watchlist.nickname,
      chain: watchlist.chain,
      alertType: alert.type,
      severity: alert.severity,
      previousRiskScore:
        alert.type === "risk_increase" ? alert.previousValue : undefined,
      currentRiskScore:
        alert.type === "risk_increase" ? alert.currentValue : undefined,
      riskScoreChange: alert.changePercentage,
      newFlags: alert.newFlags,
      liquidityChange:
        alert.type === "liquidity_change"
          ? {
              previous: alert.previousValue,
              current: alert.currentValue,
              percentage: alert.changePercentage,
            }
          : undefined,
      holderChange:
        alert.type === "holder_change"
          ? {
              previous: alert.previousValue,
              current: alert.currentValue,
              percentage: alert.changePercentage,
            }
          : undefined,
      viewContractUrl: `${baseUrl}/crypto/audit?address=${watchlist.contractAddress}&chain=${watchlist.chain}`,
      manageAlertsUrl: `${baseUrl}/watchlist`,
      unsubscribeUrl: `${baseUrl}/api/alerts/unsubscribe?token=${this.generateUnsubscribeToken(user.id, watchlist.id)}`,
    };
  }

  /**
   * Generate secure unsubscribe token
   */
  private generateUnsubscribeToken(
    userId: number,
    watchlistId: string,
  ): string {
    // TODO: Implement HMAC-based token generation for security
    return Buffer.from(`${userId}:${watchlistId}`).toString("base64");
  }
}
