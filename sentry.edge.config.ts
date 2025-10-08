/**
 * Sentry Edge Runtime Configuration
 *
 * Error monitoring for Edge Runtime (Middleware, Edge API Routes)
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

    // Debug in development
    debug: ENVIRONMENT === "development",
  });
}
