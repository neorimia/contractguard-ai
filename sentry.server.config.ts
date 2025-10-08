/**
 * Sentry Server Configuration
 *
 * Error monitoring for server-side code (API routes, Server Components)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development
      if (ENVIRONMENT === "development") {
        console.log("Sentry event (server, dev mode):", event);
        return null;
      }

      return event;
    },

    // Additional options
    debug: ENVIRONMENT === "development",
  });
} else {
  console.warn("Sentry DSN not configured. Server error monitoring disabled.");
}
