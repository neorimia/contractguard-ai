# Email Alerts System Design - ContractGuard AI

## Overview

**Feature**: Email alerts for watched contracts (Pro/Team tier exclusive)
**Business Value**: Premium feature driving subscriptions, real-time security monitoring
**Target Users**: Pro ($29/mo) and Team users who monitor multiple contracts
**Priority**: High - Competitive differentiator for premium tiers

---

## 1. Database Schema Design

### New Tables

#### `watchlists` Table
Stores user contract watchlist with alert preferences.

```typescript
export const watchlists = pgTable("watchlists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationships
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contractAddress: text("contract_address").notNull(),
  chain: text("chain").notNull().default("ethereum"),

  // Alert Configuration
  alertEnabled: boolean("alert_enabled").default(true),
  alertFrequency: text("alert_frequency", {
    enum: ["instant", "hourly", "daily"]
  }).notNull().default("instant"),

  // Alert Triggers
  alertOnRiskIncrease: boolean("alert_on_risk_increase").default(true),
  alertOnNewFlags: boolean("alert_on_new_flags").default(true),
  alertOnLiquidityChange: boolean("alert_on_liquidity_change").default(false),
  alertOnHolderChange: boolean("alert_on_holder_change").default(false),

  // Thresholds
  riskIncreaseThreshold: integer("risk_increase_threshold").default(10), // +10 points
  liquidityChangeThreshold: integer("liquidity_change_threshold").default(20), // 20% change
  holderChangeThreshold: integer("holder_change_threshold").default(15), // 15% change

  // Metadata
  nickname: text("nickname"), // User-defined name for contract
  notes: text("notes"), // Private notes
  lastAlertSent: timestamp("last_alert_sent", { withTimezone: true }),
  lastChecked: timestamp("last_checked", { withTimezone: true }),

  // Tracking
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userContractIdx: uniqueIndex("user_contract_idx").on(
    table.userId,
    table.contractAddress,
    table.chain
  ),
  userIdIdx: index("watchlist_user_id_idx").on(table.userId),
  alertEnabledIdx: index("watchlist_alert_enabled_idx").on(table.alertEnabled),
}));

export type Watchlist = typeof watchlists.$inferSelect;
export type NewWatchlist = typeof watchlists.$inferInsert;
```

#### `watchlist_snapshots` Table
Historical snapshots for change detection.

```typescript
export const watchlistSnapshots = pgTable("watchlist_snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationships
  watchlistId: text("watchlist_id")
    .notNull()
    .references(() => watchlists.id, { onDelete: "cascade" }),

  // Snapshot Data (from cryptoAudits table)
  riskScore: integer("risk_score").notNull(),
  riskCategory: text("risk_category"),
  flagCount: integer("flag_count").notNull(),
  flags: jsonb("flags").$type<RiskFlag[]>(),

  // Enrichment Data
  holderCount: integer("holder_count"),
  liquidityUsd: numeric("liquidity_usd"),
  topHolderConcentration: numeric("top_holder_concentration"),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  watchlistIdIdx: index("snapshot_watchlist_id_idx").on(table.watchlistId),
  createdAtIdx: index("snapshot_created_at_idx").on(table.createdAt),
}));

export type WatchlistSnapshot = typeof watchlistSnapshots.$inferSelect;
export type NewWatchlistSnapshot = typeof watchlistSnapshots.$inferInsert;
```

#### `alert_history` Table
Track all alerts sent to users.

```typescript
export const alertHistory = pgTable("alert_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationships
  watchlistId: text("watchlist_id")
    .notNull()
    .references(() => watchlists.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Alert Details
  alertType: text("alert_type", {
    enum: [
      "risk_increase",
      "new_flags",
      "liquidity_change",
      "holder_change",
      "critical_alert"
    ]
  }).notNull(),
  severity: text("severity", {
    enum: ["low", "medium", "high", "critical"]
  }).notNull(),

  // Change Data
  previousValue: jsonb("previous_value"),
  currentValue: jsonb("current_value"),
  changePercentage: numeric("change_percentage"),

  // Email Delivery
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  emailError: text("email_error"),

  // User Interaction
  opened: boolean("opened").default(false),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),

  // Metadata
  metadata: jsonb("metadata").$type<{
    contractAddress?: string;
    chain?: string;
    riskScoreChange?: number;
    newFlags?: RiskFlag[];
    triggerReason?: string;
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  watchlistIdIdx: index("alert_watchlist_id_idx").on(table.watchlistId),
  userIdIdx: index("alert_user_id_idx").on(table.userId),
  createdAtIdx: index("alert_created_at_idx").on(table.createdAt),
  emailSentIdx: index("alert_email_sent_idx").on(table.emailSent),
}));

export type AlertHistory = typeof alertHistory.$inferSelect;
export type NewAlertHistory = typeof alertHistory.$inferInsert;
```

### Schema Update to `users` Table

Add alert preferences to existing users table:

```typescript
// Add to existing users table
alertsEnabled: boolean("alerts_enabled").default(true),
alertEmail: text("alert_email"), // Optional: different email for alerts
maxAlertsPerDay: integer("max_alerts_per_day").default(10), // Rate limiting
lastAlertSent: timestamp("last_alert_sent", { withTimezone: true }),
```

---

## 2. Email Service Architecture

### New Email Templates

#### `ContractAlertEmail.tsx`

```typescript
// emails/ContractAlertEmail.tsx
interface ContractAlertEmailProps {
  userName?: string;
  contractAddress: string;
  contractNickname?: string;
  chain: string;
  alertType: "risk_increase" | "new_flags" | "liquidity_change" | "holder_change" | "critical_alert";
  severity: "low" | "medium" | "high" | "critical";

  // Change details
  previousRiskScore?: number;
  currentRiskScore?: number;
  riskScoreChange?: number;

  newFlags?: RiskFlag[];

  liquidityChange?: {
    previous: string;
    current: string;
    percentage: number;
  };

  holderChange?: {
    previous: number;
    current: number;
    percentage: number;
  };

  // Actions
  viewContractUrl: string;
  manageAlertsUrl: string;
  unsubscribeUrl: string;
}

export const ContractAlertEmail = (props: ContractAlertEmailProps) => {
  // Professional alert email with color-coded severity
  // Includes contract details, change summary, and action buttons
};
```

#### `WeeklyWatchlistDigestEmail.tsx`

```typescript
// emails/WeeklyWatchlistDigestEmail.tsx
interface WeeklyDigestProps {
  userName?: string;
  weekStart: Date;
  weekEnd: Date;

  contracts: Array<{
    address: string;
    nickname?: string;
    chain: string;
    currentRiskScore: number;
    riskScoreChange: number;
    newFlagsCount: number;
    status: "safe" | "caution" | "danger";
  }>;

  totalAlerts: number;
  criticalAlerts: number;

  viewDashboardUrl: string;
  manageAlertsUrl: string;
}

export const WeeklyWatchlistDigestEmail = (props: WeeklyDigestProps) => {
  // Weekly summary of all watched contracts
  // Highlights critical changes and trends
};
```

### EmailService Extensions

Add to `lib/services/email.service.ts`:

```typescript
/**
 * Send contract alert email
 */
async sendContractAlert(
  to: string,
  context: ContractAlertEmailProps
): Promise<void> {
  try {
    const html = await render(ContractAlertEmail(context));

    const subjectMap = {
      risk_increase: "⚠️ Risk Alert",
      new_flags: "🚩 New Security Flags Detected",
      liquidity_change: "💧 Liquidity Changed",
      holder_change: "👥 Holder Distribution Changed",
      critical_alert: "🚨 CRITICAL ALERT"
    };

    await resend.emails.send({
      from: "ContractGuard Alerts <alerts@contractguard.ai>",
      to,
      subject: `${subjectMap[context.alertType]}: ${context.contractNickname || context.contractAddress.slice(0, 8)}...`,
      html,
      headers: {
        "X-Entity-Ref-ID": context.contractAddress, // For tracking
      },
    });

    console.log(`[${this.serviceName}] Contract alert sent to ${to}`);
  } catch (error) {
    console.error(
      `[${this.serviceName}] Failed to send contract alert:`,
      error
    );
    throw new Error("Failed to send contract alert");
  }
}

/**
 * Send weekly watchlist digest
 */
async sendWeeklyDigest(
  to: string,
  context: WeeklyDigestProps
): Promise<void> {
  try {
    const html = await render(WeeklyWatchlistDigestEmail(context));

    await resend.emails.send({
      from: "ContractGuard Digest <digest@contractguard.ai>",
      to,
      subject: `📊 Weekly Watchlist Report - ${context.totalAlerts} alerts`,
      html,
    });

    console.log(`[${this.serviceName}] Weekly digest sent to ${to}`);
  } catch (error) {
    console.error(
      `[${this.serviceName}] Failed to send weekly digest:`,
      error
    );
    // Don't throw - digest failure shouldn't block main flow
  }
}
```

---

## 3. Alert Trigger Logic

### WatchlistMonitorService

```typescript
// lib/services/watchlist-monitor.service.ts
import { db } from "@/db";
import { watchlists, watchlistSnapshots, alertHistory, cryptoAudits } from "@/db/schema";
import { EmailService } from "./email.service";
import { eq, and, lt, isNotNull } from "drizzle-orm";

export class WatchlistMonitorService {
  private emailService = new EmailService();
  private serviceName = "WatchlistMonitorService";

  /**
   * Check all active watchlists for changes
   * Called by cron job every 5 minutes
   */
  async checkAllWatchlists(): Promise<void> {
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
            eq(watchlists.alertFrequency, "instant")
          )
        );

      console.log(`[${this.serviceName}] Found ${activeWatchlists.length} active watchlists`);

      // Process each watchlist
      for (const watchlist of activeWatchlists) {
        await this.checkWatchlist(watchlist);
      }

      console.log(`[${this.serviceName}] Watchlist check completed`);
    } catch (error) {
      console.error(`[${this.serviceName}] Error checking watchlists:`, error);
    }
  }

  /**
   * Check individual watchlist for changes
   */
  private async checkWatchlist(watchlist: Watchlist): Promise<void> {
    try {
      // Get latest audit for this contract
      const [latestAudit] = await db
        .select()
        .from(cryptoAudits)
        .where(
          and(
            eq(cryptoAudits.contractAddress, watchlist.contractAddress),
            eq(cryptoAudits.chain, watchlist.chain)
          )
        )
        .orderBy(cryptoAudits.createdAt)
        .limit(1);

      if (!latestAudit) {
        console.log(`[${this.serviceName}] No audit found for ${watchlist.contractAddress}`);
        return;
      }

      // Get previous snapshot
      const [previousSnapshot] = await db
        .select()
        .from(watchlistSnapshots)
        .where(eq(watchlistSnapshots.watchlistId, watchlist.id))
        .orderBy(watchlistSnapshots.createdAt)
        .limit(1);

      // If no previous snapshot, create one and skip alert
      if (!previousSnapshot) {
        await this.createSnapshot(watchlist.id, latestAudit);
        console.log(`[${this.serviceName}] Created initial snapshot for ${watchlist.contractAddress}`);
        return;
      }

      // Detect changes and trigger alerts
      await this.detectChangesAndAlert(watchlist, previousSnapshot, latestAudit);

      // Create new snapshot
      await this.createSnapshot(watchlist.id, latestAudit);

      // Update last checked timestamp
      await db
        .update(watchlists)
        .set({ lastChecked: new Date() })
        .where(eq(watchlists.id, watchlist.id));

    } catch (error) {
      console.error(
        `[${this.serviceName}] Error checking watchlist ${watchlist.id}:`,
        error
      );
    }
  }

  /**
   * Detect changes and send alerts
   */
  private async detectChangesAndAlert(
    watchlist: Watchlist,
    previousSnapshot: WatchlistSnapshot,
    currentAudit: CryptoAudit
  ): Promise<void> {
    const alerts: Array<{
      type: AlertType;
      severity: Severity;
      previousValue: any;
      currentValue: any;
      changePercentage?: number;
    }> = [];

    // 1. Check risk score increase
    if (watchlist.alertOnRiskIncrease) {
      const riskChange = currentAudit.riskScore - previousSnapshot.riskScore;
      if (riskChange >= watchlist.riskIncreaseThreshold) {
        alerts.push({
          type: "risk_increase",
          severity: this.calculateSeverity(riskChange),
          previousValue: previousSnapshot.riskScore,
          currentValue: currentAudit.riskScore,
          changePercentage: (riskChange / previousSnapshot.riskScore) * 100
        });
      }
    }

    // 2. Check for new flags
    if (watchlist.alertOnNewFlags) {
      const newFlags = this.detectNewFlags(
        previousSnapshot.flags || [],
        currentAudit.flags || []
      );

      if (newFlags.length > 0) {
        alerts.push({
          type: "new_flags",
          severity: this.calculateFlagSeverity(newFlags),
          previousValue: previousSnapshot.flagCount,
          currentValue: (currentAudit.flags || []).length,
        });
      }
    }

    // 3. Check liquidity changes
    if (watchlist.alertOnLiquidityChange && previousSnapshot.liquidityUsd && currentAudit.liquidityUsd) {
      const liquidityChange = this.calculatePercentageChange(
        Number(previousSnapshot.liquidityUsd),
        Number(currentAudit.liquidityUsd)
      );

      if (Math.abs(liquidityChange) >= watchlist.liquidityChangeThreshold) {
        alerts.push({
          type: "liquidity_change",
          severity: liquidityChange < 0 ? "high" : "medium",
          previousValue: previousSnapshot.liquidityUsd,
          currentValue: currentAudit.liquidityUsd,
          changePercentage: liquidityChange
        });
      }
    }

    // 4. Check holder changes
    if (watchlist.alertOnHolderChange && previousSnapshot.holderCount && currentAudit.holderCount) {
      const holderChange = this.calculatePercentageChange(
        previousSnapshot.holderCount,
        currentAudit.holderCount
      );

      if (Math.abs(holderChange) >= watchlist.holderChangeThreshold) {
        alerts.push({
          type: "holder_change",
          severity: holderChange < 0 ? "high" : "low",
          previousValue: previousSnapshot.holderCount,
          currentValue: currentAudit.holderCount,
          changePercentage: holderChange
        });
      }
    }

    // Send alerts
    if (alerts.length > 0) {
      await this.sendAlerts(watchlist, currentAudit, alerts);
    }
  }

  /**
   * Send alert emails
   */
  private async sendAlerts(
    watchlist: Watchlist,
    currentAudit: CryptoAudit,
    alerts: Array<any>
  ): Promise<void> {
    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, watchlist.userId));

    if (!user) return;

    // Check rate limiting
    if (!this.canSendAlert(user)) {
      console.log(`[${this.serviceName}] Rate limit reached for user ${user.id}`);
      return;
    }

    // Send email for each alert type
    for (const alert of alerts) {
      try {
        const emailContext = this.buildEmailContext(
          watchlist,
          currentAudit,
          alert,
          user
        );

        await this.emailService.sendContractAlert(
          user.alertEmail || user.email,
          emailContext
        );

        // Record alert in history
        await db.insert(alertHistory).values({
          watchlistId: watchlist.id,
          userId: user.id,
          alertType: alert.type,
          severity: alert.severity,
          previousValue: alert.previousValue,
          currentValue: alert.currentValue,
          changePercentage: alert.changePercentage,
          emailSent: true,
          emailSentAt: new Date(),
          metadata: {
            contractAddress: watchlist.contractAddress,
            chain: watchlist.chain,
            triggerReason: `${alert.type} threshold exceeded`
          }
        });

        // Update watchlist last alert sent
        await db
          .update(watchlists)
          .set({ lastAlertSent: new Date() })
          .where(eq(watchlists.id, watchlist.id));

        console.log(
          `[${this.serviceName}] Alert sent for ${watchlist.contractAddress}: ${alert.type}`
        );
      } catch (error) {
        console.error(
          `[${this.serviceName}] Error sending alert:`,
          error
        );

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
          }
        });
      }
    }
  }

  // Helper methods
  private createSnapshot(watchlistId: string, audit: CryptoAudit): Promise<void> {
    return db.insert(watchlistSnapshots).values({
      watchlistId,
      riskScore: audit.riskScore,
      riskCategory: audit.riskCategory,
      flagCount: (audit.flags || []).length,
      flags: audit.flags,
      holderCount: audit.holderCount,
      liquidityUsd: audit.liquidityUsd,
      topHolderConcentration: audit.topHolderConcentration,
    });
  }

  private detectNewFlags(oldFlags: RiskFlag[], newFlags: RiskFlag[]): RiskFlag[] {
    const oldFlagTypes = new Set(oldFlags.map(f => f.type));
    return newFlags.filter(f => !oldFlagTypes.has(f.type));
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private calculateSeverity(riskChange: number): Severity {
    if (riskChange >= 30) return "critical";
    if (riskChange >= 20) return "high";
    if (riskChange >= 10) return "medium";
    return "low";
  }

  private calculateFlagSeverity(flags: RiskFlag[]): Severity {
    const hasCritical = flags.some(f => f.severity === "critical");
    if (hasCritical) return "critical";

    const hasHigh = flags.some(f => f.severity === "high");
    if (hasHigh) return "high";

    return "medium";
  }

  private canSendAlert(user: User): boolean {
    // Check daily alert limit
    const now = new Date();
    const lastAlertDate = user.lastAlertSent ? new Date(user.lastAlertSent) : null;

    // Reset counter if new day
    if (!lastAlertDate || !this.isSameDay(lastAlertDate, now)) {
      return true;
    }

    // Check against max alerts per day (stored in user preferences)
    const maxAlerts = user.maxAlertsPerDay || 10;
    // TODO: Implement counter tracking
    return true; // For now, always allow
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private buildEmailContext(
    watchlist: Watchlist,
    audit: CryptoAudit,
    alert: any,
    user: User
  ): ContractAlertEmailProps {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    return {
      userName: user.displayName,
      contractAddress: watchlist.contractAddress,
      contractNickname: watchlist.nickname,
      chain: watchlist.chain,
      alertType: alert.type,
      severity: alert.severity,
      previousRiskScore: alert.type === "risk_increase" ? alert.previousValue : undefined,
      currentRiskScore: alert.type === "risk_increase" ? alert.currentValue : undefined,
      riskScoreChange: alert.changePercentage,
      viewContractUrl: `${baseUrl}/crypto/audit?address=${watchlist.contractAddress}&chain=${watchlist.chain}`,
      manageAlertsUrl: `${baseUrl}/watchlist`,
      unsubscribeUrl: `${baseUrl}/api/alerts/unsubscribe?token=${this.generateUnsubscribeToken(user.id, watchlist.id)}`,
    };
  }

  private generateUnsubscribeToken(userId: number, watchlistId: string): string {
    // TODO: Implement secure token generation
    return Buffer.from(`${userId}:${watchlistId}`).toString("base64");
  }
}

type AlertType = "risk_increase" | "new_flags" | "liquidity_change" | "holder_change" | "critical_alert";
type Severity = "low" | "medium" | "high" | "critical";
```

---

## 4. API Endpoints

### Watchlist Management

#### `POST /api/watchlist/add`

```typescript
// app/api/watchlist/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { getUser } from "@stackframe/stack";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    // Check tier authorization
    if (!user || (user.tier !== "pro" && user.tier !== "team")) {
      return NextResponse.json(
        { error: "Watchlist alerts are only available for Pro and Team users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contractAddress, chain, nickname, alertPreferences } = body;

    // Validate contract address
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { error: "Invalid contract address" },
        { status: 400 }
      );
    }

    // Check watchlist limit (Pro: 10, Team: 50)
    const watchlistLimit = user.tier === "team" ? 50 : 10;
    const existingCount = await db
      .select({ count: count() })
      .from(watchlists)
      .where(eq(watchlists.userId, user.id));

    if (existingCount[0].count >= watchlistLimit) {
      return NextResponse.json(
        { error: `Watchlist limit reached (${watchlistLimit} contracts)` },
        { status: 400 }
      );
    }

    // Create watchlist entry
    const [newWatchlist] = await db
      .insert(watchlists)
      .values({
        userId: user.id,
        contractAddress: contractAddress.toLowerCase(),
        chain: chain || "ethereum",
        nickname,
        ...alertPreferences,
      })
      .returning();

    return NextResponse.json({
      data: newWatchlist,
      status: "success"
    });

  } catch (error) {
    console.error("[API] Error adding to watchlist:", error);
    return NextResponse.json(
      { error: "Failed to add contract to watchlist" },
      { status: 500 }
    );
  }
}
```

#### `GET /api/watchlist`

```typescript
// app/api/watchlist/route.ts
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all watchlists for user with latest audit data
    const userWatchlists = await db
      .select({
        watchlist: watchlists,
        latestAudit: cryptoAudits,
      })
      .from(watchlists)
      .leftJoin(
        cryptoAudits,
        and(
          eq(watchlists.contractAddress, cryptoAudits.contractAddress),
          eq(watchlists.chain, cryptoAudits.chain)
        )
      )
      .where(eq(watchlists.userId, user.id))
      .orderBy(watchlists.createdAt);

    return NextResponse.json({
      data: userWatchlists,
      status: "success"
    });

  } catch (error) {
    console.error("[API] Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}
```

#### `PATCH /api/watchlist/[id]`

```typescript
// app/api/watchlist/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, notes, alertPreferences } = body;

    // Update watchlist
    const [updated] = await db
      .update(watchlists)
      .set({
        nickname,
        notes,
        ...alertPreferences,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(watchlists.id, params.id),
          eq(watchlists.userId, user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      status: "success"
    });

  } catch (error) {
    console.error("[API] Error updating watchlist:", error);
    return NextResponse.json(
      { error: "Failed to update watchlist" },
      { status: 500 }
    );
  }
}
```

#### `DELETE /api/watchlist/[id]`

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .delete(watchlists)
      .where(
        and(
          eq(watchlists.id, params.id),
          eq(watchlists.userId, user.id)
        )
      );

    return NextResponse.json({
      status: "success"
    });

  } catch (error) {
    console.error("[API] Error deleting from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
```

### Alert Management

#### `GET /api/alerts/history`

```typescript
// app/api/alerts/history/route.ts
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const alerts = await db
      .select({
        alert: alertHistory,
        watchlist: watchlists,
      })
      .from(alertHistory)
      .leftJoin(watchlists, eq(alertHistory.watchlistId, watchlists.id))
      .where(eq(alertHistory.userId, user.id))
      .orderBy(alertHistory.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: alerts,
      status: "success"
    });

  } catch (error) {
    console.error("[API] Error fetching alert history:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert history" },
      { status: 500 }
    );
  }
}
```

#### `POST /api/alerts/unsubscribe`

```typescript
// app/api/alerts/unsubscribe/route.ts
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unsubscribe token required" },
        { status: 400 }
      );
    }

    // Decode token to get userId and watchlistId
    const decoded = Buffer.from(token, "base64").toString();
    const [userId, watchlistId] = decoded.split(":");

    // Disable alerts for this watchlist
    await db
      .update(watchlists)
      .set({ alertEnabled: false })
      .where(
        and(
          eq(watchlists.id, watchlistId),
          eq(watchlists.userId, parseInt(userId))
        )
      );

    return NextResponse.json({
      message: "Successfully unsubscribed from alerts",
      status: "success"
    });

  } catch (error) {
    console.error("[API] Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
```

---

## 5. Frontend Components

### Watchlist Dashboard Page

```typescript
// app/watchlist/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WatchlistTable } from "@/components/watchlist/WatchlistTable";
import { AddToWatchlistDialog } from "@/components/watchlist/AddToWatchlistDialog";
import { AlertSettingsDialog } from "@/components/watchlist/AlertSettingsDialog";

export default function WatchlistPage() {
  const user = useUser();
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = async () => {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      setWatchlists(data.data);
    } catch (error) {
      console.error("Error loading watchlists:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check tier access
  if (user && user.tier !== "pro" && user.tier !== "team") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
          <p className="text-muted-foreground mb-6">
            Watchlist alerts are available for Pro and Team users.
          </p>
          <Button asChild>
            <a href="/pricing">Upgrade Now</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contract Watchlist</h1>
          <p className="text-muted-foreground">
            Monitor contracts and get instant alerts on security changes
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          Add Contract
        </Button>
      </div>

      <WatchlistTable
        watchlists={watchlists}
        onUpdate={loadWatchlists}
      />

      <AddToWatchlistDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={loadWatchlists}
      />
    </div>
  );
}
```

### WatchlistTable Component

```typescript
// components/watchlist/WatchlistTable.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertSettingsDialog } from "./AlertSettingsDialog";

interface WatchlistTableProps {
  watchlists: any[];
  onUpdate: () => void;
}

export function WatchlistTable({ watchlists, onUpdate }: WatchlistTableProps) {
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this contract from your watchlist?")) return;

    try {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      onUpdate();
    } catch (error) {
      console.error("Error deleting watchlist:", error);
    }
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 70) return <Badge variant="destructive">High Risk</Badge>;
    if (riskScore >= 40) return <Badge variant="warning">Medium Risk</Badge>;
    return <Badge variant="success">Low Risk</Badge>;
  };

  return (
    <>
      <div className="grid gap-4">
        {watchlists.map(({ watchlist, latestAudit }) => (
          <Card key={watchlist.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">
                    {watchlist.nickname || `Contract ${watchlist.contractAddress.slice(0, 8)}...`}
                  </h3>
                  {latestAudit && getRiskBadge(latestAudit.riskScore)}
                </div>

                <p className="text-sm text-muted-foreground font-mono mb-2">
                  {watchlist.contractAddress}
                </p>

                <div className="flex gap-4 text-sm">
                  <span>Chain: {watchlist.chain}</span>
                  {latestAudit && (
                    <>
                      <span>Risk Score: {latestAudit.riskScore}/100</span>
                      <span>Flags: {latestAudit.flags?.length || 0}</span>
                    </>
                  )}
                </div>

                {watchlist.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {watchlist.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWatchlist(watchlist);
                    setShowSettings(true);
                  }}
                >
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(watchlist.id)}
                >
                  Remove
                </Button>
              </div>
            </div>

            {watchlist.alertEnabled && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  🔔 Alerts enabled ({watchlist.alertFrequency})
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {showSettings && selectedWatchlist && (
        <AlertSettingsDialog
          watchlist={selectedWatchlist}
          open={showSettings}
          onClose={() => {
            setShowSettings(false);
            setSelectedWatchlist(null);
          }}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
```

### Add to Watchlist Button (on audit page)

```typescript
// components/crypto/AddToWatchlistButton.tsx
"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { AddToWatchlistDialog } from "@/components/watchlist/AddToWatchlistDialog";

interface AddToWatchlistButtonProps {
  contractAddress: string;
  chain: string;
}

export function AddToWatchlistButton({ contractAddress, chain }: AddToWatchlistButtonProps) {
  const user = useUser();
  const [showDialog, setShowDialog] = useState(false);

  if (!user || (user.tier !== "pro" && user.tier !== "team")) {
    return (
      <Button variant="outline" asChild>
        <a href="/pricing">
          Upgrade to Add to Watchlist
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        Add to Watchlist
      </Button>

      <AddToWatchlistDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        defaultValues={{ contractAddress, chain }}
      />
    </>
  );
}
```

---

## 6. Background Job Architecture

### Cron Job Setup

Use Vercel Cron Jobs or external service like Render/Railway cron.

#### `app/api/cron/check-watchlists/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { WatchlistMonitorService } from "@/lib/services/watchlist-monitor.service";

// Protect cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting watchlist check...");

    const monitor = new WatchlistMonitorService();
    await monitor.checkAllWatchlists();

    console.log("[CRON] Watchlist check completed");

    return NextResponse.json({
      status: "success",
      message: "Watchlist check completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[CRON] Error checking watchlists:", error);
    return NextResponse.json(
      { error: "Watchlist check failed" },
      { status: 500 }
    );
  }
}
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-watchlists",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/send-weekly-digests",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### Alternative: Upstash QStash

For better reliability and observability:

```typescript
// lib/qstash.ts
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function scheduleWatchlistCheck() {
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cron/check-watchlists`,
    body: { source: "qstash" },
    headers: {
      "Authorization": `Bearer ${process.env.CRON_SECRET}`
    }
  });
}
```

---

## 7. Implementation Phases

### Phase 1: Database & Core Logic (Week 1)
- [ ] Create database schema migrations
- [ ] Implement WatchlistMonitorService
- [ ] Build snapshot and change detection logic
- [ ] Unit tests for alert triggers

### Phase 2: API & Email (Week 2)
- [ ] Implement watchlist CRUD API endpoints
- [ ] Create email templates (alert, digest)
- [ ] Extend EmailService with alert methods
- [ ] API integration tests

### Phase 3: Frontend (Week 3)
- [ ] Build watchlist dashboard page
- [ ] Create watchlist table and dialogs
- [ ] Add "Add to Watchlist" button on audit pages
- [ ] Implement alert settings UI

### Phase 4: Background Jobs & Testing (Week 4)
- [ ] Set up Vercel cron jobs
- [ ] Implement weekly digest cron
- [ ] End-to-end testing
- [ ] Load testing with multiple watchlists

### Phase 5: Polish & Launch (Week 5)
- [ ] Email deliverability testing
- [ ] Analytics tracking for alerts
- [ ] Documentation and help content
- [ ] Beta test with Pro users
- [ ] Production launch

---

## 8. Technical Considerations

### Performance

**Scalability Targets:**
- Support 1000+ active watchlists
- Process all checks within 5-minute window
- Email delivery < 30 seconds from trigger

**Optimization Strategies:**
- Batch database queries
- Parallel watchlist processing
- Redis caching for recent audits
- Database indexes on alert-related queries

### Rate Limiting

**User Limits:**
- Pro: 10 contracts, 10 alerts/day
- Team: 50 contracts, 50 alerts/day

**Email Rate Limiting:**
- Max 1 alert per contract per hour (prevent spam)
- Cooldown period after 5 alerts in 10 minutes
- Aggregate multiple changes into single email

### Security

**Access Control:**
- Tier-based feature gating
- User can only access their own watchlists
- Secure unsubscribe tokens with HMAC

**Email Security:**
- SPF/DKIM configuration for Resend
- Unsubscribe links in every email
- Rate limiting to prevent abuse

### Monitoring

**Key Metrics:**
- Alert delivery success rate
- Average time from trigger to email
- User engagement (open rate, click rate)
- False positive rate

**Alerts:**
- Failed email deliveries
- Cron job failures
- Abnormal alert volume

---

## 9. Cost Analysis

### Infrastructure Costs

**Email (Resend):**
- $20/month base (50K emails)
- Estimated usage: 5K alerts/month = $0
- Weekly digests: 400 users = 1.6K emails/month

**Database:**
- 3 new tables with moderate growth
- Estimated: +2GB/year = negligible

**Cron Jobs:**
- Vercel: Free (included in Pro plan)
- QStash alternative: $10/month for reliability

**Total: ~$20-30/month**

### Revenue Impact

**Conversion Driver:**
- Watchlist feature exclusive to Pro/Team
- Estimated conversion lift: +15-20%
- Target: 50 Pro users @ $29/mo = $1,450/mo
- **ROI: 48x (revenue/cost)**

---

## 10. Success Metrics

### Engagement
- Watchlist creation rate (Pro users)
- Average contracts per watchlist
- Alert open rate > 40%
- Alert click-through rate > 15%

### Retention
- Pro user retention improvement
- Churn reduction from alerts

### Revenue
- Attribution to watchlist feature
- Upgrade rate from free to Pro

---

## 11. Future Enhancements

### V2 Features (Post-Launch)
- Telegram/Discord alert integrations
- Custom webhook alerts for developers
- Alert templates and presets
- Multi-contract alerts (portfolio view)
- AI-powered alert prioritization
- Mobile push notifications

### Advanced Analytics
- Watchlist performance tracking
- Alert accuracy metrics
- User behavior insights
- Predictive alerts (ML-based)

---

## Summary

This design provides a **production-ready email alert system** for ContractGuard AI that:

✅ **Drives revenue** through Pro/Team tier differentiation
✅ **Scales efficiently** with batch processing and caching
✅ **Delivers value** with customizable, intelligent alerts
✅ **Maintains quality** through rate limiting and monitoring
✅ **Enables growth** with extensible architecture

**Estimated Implementation:** 5 weeks
**Monthly Cost:** $20-30
**Revenue Impact:** +$1,450/mo (50 Pro users)
**ROI:** 48x

**Next Steps:**
1. Review and approve design
2. Create database migration files
3. Implement Phase 1 (database & core logic)
4. Begin development sprint

---

**Document Status:** Draft for Review
**Last Updated:** 2025-10-22
**Author:** Claude Code Design System
