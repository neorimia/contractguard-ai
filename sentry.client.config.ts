/**
 * Sentry Client Configuration
 *
 * Error monitoring and performance tracking for the browser
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development
      if (ENVIRONMENT === "development") {
        console.log("Sentry event (dev mode):", event);
        return null;
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);

        // Ignore network errors that are expected
        if (
          message.includes("Failed to fetch") ||
          message.includes("NetworkError")
        ) {
          return null;
        }
      }

      return event;
    },

    // Additional context
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
} else {
  console.warn("Sentry DSN not configured. Error monitoring disabled.");
}
