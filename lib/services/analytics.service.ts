// lib/services/analytics.service.ts
import { db } from "@/db";
import { purchases, users, cryptoAudits } from "@/db/schema";
import { eq, and, gte, lte, sql, count, sum } from "drizzle-orm";

export interface RevenueStats {
  instant: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    packageBreakdown: {
      oneReport: { count: number; revenue: number };
      threeReports: { count: number; revenue: number };
      fiveReports: { count: number; revenue: number };
    };
    growthRate: number;
  };
  subscriptions: {
    activePro: number;
    activeTeam: number;
    mrr: number;
    arr: number;
    newThisMonth: number;
    canceledThisMonth: number;
    churnRate: number;
    reactivatedThisMonth: number;
  };
  combined: {
    totalRevenue: number;
    blendedARPU: number;
    ltv: number;
    paybackPeriod: number;
  };
  period: {
    start: Date;
    end: Date;
    previousPeriodComparison: {
      revenueGrowth: number;
      userGrowth: number;
      conversionGrowth: number;
    };
  };
}

export interface ConversionFunnel {
  visitors: number;
  reportViews: number;
  paywallShown: number;
  paywallShowRate: number;
  checkoutInitiated: number;
  checkoutInitiationRate: number;
  instantPurchases: number;
  instantConversionRate: number;
  subscriptionPurchases: number;
  subscriptionConversionRate: number;
  upsellModalShown: number;
  upsellClicked: number;
  upsellConversionRate: number;
  instantToProUpgrades: number;
  instantToProConversionRate: number;
  dropOffPoints: Array<{
    stage: string;
    users: number;
    dropOffRate: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  byTier: {
    free: number;
    instantCredits: number;
    pro: number;
    team: number;
  };
  averageScansPerUser: number;
  creditsPerUser: {
    average: number;
    median: number;
    distribution: Array<{ range: string; count: number }>;
  };
  retentionCohorts: Array<{
    cohortMonth: string;
    day1: number;
    day7: number;
    day30: number;
    day90: number;
  }>;
  referrals: {
    totalReferrers: number;
    totalReferred: number;
    conversionRate: number;
    creditsAwarded: number;
  };
}

export class AnalyticsService {
  /**
   * Get comprehensive revenue statistics
   */
  async getRevenueStats(params: {
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<RevenueStats> {
    const { startDate, endDate } = this.calculateDateRange(params);

    // Fetch instant sales stats
    const instantStats = await this.getInstantSalesStats(startDate, endDate);

    // Fetch subscription stats
    const subscriptionStats = await this.getSubscriptionStats(
      startDate,
      endDate
    );

    // Calculate combined metrics
    const combinedStats = this.calculateCombinedMetrics(
      instantStats,
      subscriptionStats
    );

    // Get previous period for comparison
    const previousPeriod = await this.getPreviousPeriodStats(
      startDate,
      endDate
    );

    return {
      instant: instantStats,
      subscriptions: subscriptionStats,
      combined: combinedStats,
      period: {
        start: startDate,
        end: endDate,
        previousPeriodComparison: previousPeriod,
      },
    };
  }

  /**
   * Get instant sales statistics
   */
  private async getInstantSalesStats(startDate: Date, endDate: Date) {
    // Query purchases table
    const sales = await db
      .select({
        count: count(),
        totalRevenue: sum(purchases.amount),
        credits: purchases.credits,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.type, "instant_credits"),
          eq(purchases.status, "completed"),
          gte(purchases.completedAt, startDate),
          lte(purchases.completedAt, endDate)
        )
      )
      .groupBy(purchases.credits);

    // Calculate breakdown by package
    const oneReport = sales.find((s) => s.credits === 1);
    const threeReports = sales.find((s) => s.credits === 3);
    const fiveReports = sales.find((s) => s.credits === 5);

    const totalSales = sales.reduce((sum, s) => sum + Number(s.count), 0);
    const totalRevenue = sales.reduce(
      (sum, s) => sum + Number(s.totalRevenue || 0),
      0
    );

    return {
      totalSales,
      totalRevenue,
      averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      packageBreakdown: {
        oneReport: {
          count: Number(oneReport?.count || 0),
          revenue: Number(oneReport?.totalRevenue || 0),
        },
        threeReports: {
          count: Number(threeReports?.count || 0),
          revenue: Number(threeReports?.totalRevenue || 0),
        },
        fiveReports: {
          count: Number(fiveReports?.count || 0),
          revenue: Number(fiveReports?.totalRevenue || 0),
        },
      },
      growthRate: 0, // Will be calculated in previous period comparison
    };
  }

  /**
   * Get subscription statistics
   */
  private async getSubscriptionStats(startDate: Date, endDate: Date) {
    // Active subscriptions by tier
    const activeProCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(eq(users.tier, "pro"), eq(users.subscriptionStatus, "active"))
      );

    const activeTeamCount = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(eq(users.tier, "team"), eq(users.subscriptionStatus, "active"))
      );

    const activePro = Number(activeProCount[0]?.count || 0);
    const activeTeam = Number(activeTeamCount[0]?.count || 0);

    // Calculate MRR (Monthly Recurring Revenue) in cents
    const mrr = activePro * 2900 + activeTeam * 9900;

    // New subscriptions this period
    const newSubs = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          sql`${users.tier} IN ('pro', 'team')`,
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        )
      );

    // Canceled subscriptions this period
    const canceledSubs = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "canceled"),
          gte(users.updatedAt, startDate),
          lte(users.updatedAt, endDate)
        )
      );

    const newThisMonth = Number(newSubs[0]?.count || 0);
    const canceledThisMonth = Number(canceledSubs[0]?.count || 0);
    const totalActive = activePro + activeTeam;

    return {
      activePro,
      activeTeam,
      mrr,
      arr: mrr * 12,
      newThisMonth,
      canceledThisMonth,
      churnRate: totalActive > 0 ? (canceledThisMonth / totalActive) * 100 : 0,
      reactivatedThisMonth: 0, // TODO: Implement reactivation tracking
    };
  }

  /**
   * Calculate combined metrics
   */
  private calculateCombinedMetrics(instant: any, subscriptions: any) {
    const totalRevenue = instant.totalRevenue + subscriptions.mrr;

    // Get total active users for ARPU calculation
    const activeUsers =
      subscriptions.activePro + subscriptions.activeTeam + instant.totalSales;

    const blendedARPU = activeUsers > 0 ? totalRevenue / activeUsers : 0;

    // Simple LTV calculation
    const avgMonthlyChurn = subscriptions.churnRate / 100 || 0.05;
    const avgCustomerLifetime = avgMonthlyChurn > 0 ? 1 / avgMonthlyChurn : 12;
    const ltv = blendedARPU * avgCustomerLifetime;

    return {
      totalRevenue,
      blendedARPU,
      ltv,
      paybackPeriod: 30, // Placeholder
    };
  }

  /**
   * Calculate date range based on period
   */
  private calculateDateRange(params: {
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }): { startDate: Date; endDate: Date } {
    const endDate = params.endDate || new Date();
    let startDate = params.startDate;

    if (!startDate && params.period) {
      const now = new Date();
      switch (params.period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate,
    };
  }

  /**
   * Get previous period stats for comparison
   */
  private async getPreviousPeriodStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    revenueGrowth: number;
    userGrowth: number;
    conversionGrowth: number;
  }> {
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    const prevInstant = await this.getInstantSalesStats(
      prevStartDate,
      prevEndDate
    );
    const prevSubs = await this.getSubscriptionStats(
      prevStartDate,
      prevEndDate
    );

    const currentInstant = await this.getInstantSalesStats(startDate, endDate);
    const currentSubs = await this.getSubscriptionStats(startDate, endDate);

    const prevRevenue = prevInstant.totalRevenue + prevSubs.mrr;
    const currentRevenue = currentInstant.totalRevenue + currentSubs.mrr;
    const revenueGrowth =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : 0;

    return {
      revenueGrowth,
      userGrowth: 0, // TODO: Implement
      conversionGrowth: 0, // TODO: Implement
    };
  }

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(params: {
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ConversionFunnel> {
    const { startDate, endDate } = this.calculateDateRange(params);

    // Total audits performed (proxy for report views)
    const reportViews = await db
      .select({ count: count() })
      .from(cryptoAudits)
      .where(
        and(
          gte(cryptoAudits.createdAt, startDate),
          lte(cryptoAudits.createdAt, endDate)
        )
      );

    // Instant purchases
    const instantPurchases = await db
      .select({ count: count() })
      .from(purchases)
      .where(
        and(
          eq(purchases.type, "instant_credits"),
          eq(purchases.status, "completed"),
          gte(purchases.completedAt, startDate),
          lte(purchases.completedAt, endDate)
        )
      );

    // Subscription conversions
    const subPurchases = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          sql`${users.tier} IN ('pro', 'team')`,
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        )
      );

    const reportViewCount = Number(reportViews[0]?.count || 0);
    const instantCount = Number(instantPurchases[0]?.count || 0);
    const subCount = Number(subPurchases[0]?.count || 0);

    const instantConversionRate =
      reportViewCount > 0 ? (instantCount / reportViewCount) * 100 : 0;
    const subscriptionConversionRate =
      reportViewCount > 0 ? (subCount / reportViewCount) * 100 : 0;

    return {
      visitors: 0, // From PostHog or analytics events
      reportViews: reportViewCount,
      paywallShown: 0,
      paywallShowRate: 0,
      checkoutInitiated: instantCount + subCount,
      checkoutInitiationRate: 0,
      instantPurchases: instantCount,
      instantConversionRate,
      subscriptionPurchases: subCount,
      subscriptionConversionRate,
      upsellModalShown: 0,
      upsellClicked: 0,
      upsellConversionRate: 0,
      instantToProUpgrades: 0,
      instantToProConversionRate: 0,
      dropOffPoints: [],
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(params: {
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UserAnalytics> {
    const { startDate, endDate } = this.calculateDateRange(params);

    // Total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // New users in period
    const newUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(gte(users.createdAt, startDate), lte(users.createdAt, endDate))
      );
    const newUsers = Number(newUsersResult[0]?.count || 0);

    // Users by tier
    const freeUsers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tier, "free"));
    const proUsers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tier, "pro"));
    const teamUsers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tier, "team"));

    // Users with instant credits
    const instantCreditUsers = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.instantCredits} > 0`);

    return {
      totalUsers,
      newUsers,
      activeUsers: 0, // TODO: Implement based on recent scans
      byTier: {
        free: Number(freeUsers[0]?.count || 0),
        instantCredits: Number(instantCreditUsers[0]?.count || 0),
        pro: Number(proUsers[0]?.count || 0),
        team: Number(teamUsers[0]?.count || 0),
      },
      averageScansPerUser: 0, // TODO: Calculate from audits
      creditsPerUser: {
        average: 0,
        median: 0,
        distribution: [],
      },
      retentionCohorts: [],
      referrals: {
        totalReferrers: 0,
        totalReferred: 0,
        conversionRate: 0,
        creditsAwarded: 0,
      },
    };
  }
}
