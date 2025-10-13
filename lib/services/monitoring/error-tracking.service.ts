/**
 * Error Tracking Service
 *
 * Centralized error tracking and reporting
 * Integrates with Sentry (optional)
 */

interface ErrorContext {
  contractAddress?: string;
  chain?: string;
  userId?: string;
  endpoint?: string;
  [key: string]: any;
}

interface ErrorRecord {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
}

export class ErrorTrackingService {
  private errors: ErrorRecord[] = [];
  private readonly maxErrors = 1000;

  /**
   * Capture an error with context
   */
  captureError(
    error: Error,
    context: ErrorContext = {},
    severity: "low" | "medium" | "high" | "critical" = "medium"
  ): void {
    const record: ErrorRecord = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      severity,
    };

    this.errors.push(record);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console
    console.error(`[${severity.toUpperCase()}]`, error.message, context);

    // Send to Sentry if configured
    if (this.isSentryConfigured()) {
      this.sendToSentry(error, context, severity);
    }
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(
    message: string,
    context: ErrorContext = {},
    severity: "low" | "medium" | "high" | "critical" = "low"
  ): void {
    const record: ErrorRecord = {
      message,
      context,
      timestamp: Date.now(),
      severity,
    };

    this.errors.push(record);

    console.log(`[${severity.toUpperCase()}]`, message, context);

    if (this.isSentryConfigured()) {
      this.sendMessageToSentry(message, context, severity);
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorRecord[] {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(
    severity: "low" | "medium" | "high" | "critical"
  ): ErrorRecord[] {
    return this.errors.filter((e) => e.severity === severity).reverse();
  }

  /**
   * Get error rate statistics
   */
  getErrorStats(timeWindowMs: number = 3600000): {
    totalErrors: number;
    errorRate: number; // Errors per minute
    bySeverity: Record<string, number>;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentErrors = this.errors.filter((e) => e.timestamp > cutoff);

    // Count by severity
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    recentErrors.forEach((e) => {
      bySeverity[e.severity]++;
    });

    // Find most common errors
    const errorCounts = new Map<string, number>();
    recentErrors.forEach((e) => {
      errorCounts.set(e.message, (errorCounts.get(e.message) || 0) + 1);
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const minutesInWindow = timeWindowMs / 60000;
    const errorRate = recentErrors.length / minutesInWindow;

    return {
      totalErrors: recentErrors.length,
      errorRate: Math.round(errorRate * 10) / 10,
      bySeverity,
      topErrors,
    };
  }

  /**
   * Check if Sentry is configured
   */
  private isSentryConfigured(): boolean {
    return (
      typeof process.env.SENTRY_DSN !== "undefined" &&
      process.env.SENTRY_DSN !== ""
    );
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(
    error: Error,
    context: ErrorContext,
    severity: string
  ): void {
    // Note: Actual Sentry integration would use @sentry/nextjs
    // This is a placeholder that shows the integration pattern

    try {
      // In production with Sentry:
      // import * as Sentry from "@sentry/nextjs";
      //
      // Sentry.captureException(error, {
      //   level: severity as Sentry.SeverityLevel,
      //   tags: {
      //     chain: context.chain,
      //     endpoint: context.endpoint,
      //   },
      //   extra: context,
      // });

      console.log("[Sentry] Would send error:", error.message);
    } catch (sentryError) {
      console.error("[Sentry] Failed to send error:", sentryError);
    }
  }

  /**
   * Send message to Sentry
   */
  private sendMessageToSentry(
    message: string,
    context: ErrorContext,
    severity: string
  ): void {
    try {
      // In production with Sentry:
      // import * as Sentry from "@sentry/nextjs";
      //
      // Sentry.captureMessage(message, {
      //   level: severity as Sentry.SeverityLevel,
      //   extra: context,
      // });

      console.log("[Sentry] Would send message:", message);
    } catch (sentryError) {
      console.error("[Sentry] Failed to send message:", sentryError);
    }
  }

  /**
   * Clear all errors (for testing)
   */
  clear(): void {
    this.errors = [];
  }
}

// Singleton instance
export const errorTracking = new ErrorTrackingService();
