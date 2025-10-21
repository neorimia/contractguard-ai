// lib/utils/error-handler.ts

import { NextResponse } from 'next/server';
import { ClientErrorResponse } from '@/lib/types/errors';
import { ERROR_MESSAGES } from '@/lib/constants/error-messages';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public template: (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES],
    public additionalDetails?: Record<string, any>
  ) {
    super(template.message);
    this.name = 'APIError';
  }
}

export function createErrorResponse(
  error: APIError | Error,
  requestId?: string,
  metadata?: {
    accessType?: string;
    scansRemaining?: number;
    instantCredits?: number;
  }
): NextResponse<ClientErrorResponse> {
  if (error instanceof APIError) {
    const response: ClientErrorResponse = {
      status: 'error',
      severity: error.template.severity,
      error: error.template.error,
      message: error.template.message,
      action: error.template.action,
      details: {
        ...error.template.details,
        ...error.additionalDetails,
      },
      metadata: {
        requestId: requestId || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    // Log for monitoring (Sentry, PostHog, etc.)
    // Use different log levels based on error severity
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    const logMessage = `[${error.statusCode}] ${error.template.error}`;
    const logData = {
      requestId: response.metadata?.requestId,
      ...(error.additionalDetails && { details: error.additionalDetails }),
    };

    if (logLevel === 'error') {
      // 500s - Internal errors, need full stack trace
      console.error(logMessage, logData, error);
    } else {
      // 400s - Client errors, just log the details
      console.warn(logMessage, logData);
    }

    return NextResponse.json(response, {
      status: error.statusCode,
      headers: {
        'X-Request-ID': response.metadata?.requestId || crypto.randomUUID(),
        'X-Error-Type': error.template.error,
        ...(metadata?.accessType && { 'X-Access-Type': metadata.accessType }),
        ...(metadata?.scansRemaining !== undefined && {
          'X-Scans-Remaining': metadata.scansRemaining.toString(),
        }),
        ...(metadata?.instantCredits !== undefined && {
          'X-Instant-Credits': metadata.instantCredits.toString(),
        }),
      },
    });
  }

  // Fallback for unexpected errors
  const response: ClientErrorResponse = {
    status: 'error',
    severity: 'error',
    error: ERROR_MESSAGES.UNEXPECTED_ERROR.error,
    message: ERROR_MESSAGES.UNEXPECTED_ERROR.message,
    action: ERROR_MESSAGES.UNEXPECTED_ERROR.action,
    details: ERROR_MESSAGES.UNEXPECTED_ERROR.details,
    metadata: {
      requestId: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };

  console.error('Unexpected error:', error, {
    requestId: response.metadata?.requestId,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(response, {
    status: 500,
    headers: {
      'X-Request-ID': response.metadata?.requestId || crypto.randomUUID(),
      ...(metadata?.accessType && { 'X-Access-Type': metadata.accessType }),
    },
  });
}

// Helper functions for common error scenarios
export const ErrorFactory = {
  // ============================================================================
  // CLIENT INPUT ERRORS (400)
  // ============================================================================
  invalidAddress: () => new APIError(400, ERROR_MESSAGES.INVALID_ADDRESS),

  contractNotVerified: () => new APIError(400, ERROR_MESSAGES.CONTRACT_NOT_VERIFIED),

  missingParameters: (params?: string[]) =>
    new APIError(400, ERROR_MESSAGES.MISSING_PARAMETERS, {
      missingParams: params,
    }),

  // ============================================================================
  // ACCESS & RATE LIMITING (403, 429)
  // ============================================================================
  softAccountUpgrade: (scansRemaining: number) =>
    new APIError(403, ERROR_MESSAGES.SOFT_ACCOUNT_UPGRADE, {
      scansRemaining,
    }),

  anonymousLimitReached: (scansPerformed: number, maxScans: number, sessionId: string) =>
    new APIError(429, ERROR_MESSAGES.ANONYMOUS_LIMIT_REACHED, {
      scansPerformed,
      maxScans,
      sessionId,
    }),

  freeTierLimit: (resetAt?: Date) =>
    new APIError(429, ERROR_MESSAGES.FREE_TIER_LIMIT, {
      retryAfter: resetAt?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),

  instantCreditsDepl: () =>
    new APIError(429, ERROR_MESSAGES.INSTANT_CREDITS_DEPLETED),

  accessLimitExceeded: (accessType: string, resetAt?: Date) =>
    new APIError(429, ERROR_MESSAGES.ACCESS_LIMIT_EXCEEDED, {
      accessType,
      retryAfter: resetAt?.toISOString(),
    }),

  // ============================================================================
  // EXTERNAL SERVICE FAILURES (503)
  // ============================================================================
  etherscanUnavailable: (statusCode?: number, errorMessage?: string) =>
    new APIError(503, ERROR_MESSAGES.ETHERSCAN_UNAVAILABLE, {
      statusCode,
      originalError: errorMessage,
    }),

  etherscanRateLimit: () => new APIError(503, ERROR_MESSAGES.ETHERSCAN_RATE_LIMIT),

  etherscanNotFound: (address: string, chain: string) =>
    new APIError(404, ERROR_MESSAGES.ETHERSCAN_NOT_FOUND, {
      address,
      chain,
    }),

  aiServiceTimeout: (provider?: string) =>
    new APIError(503, ERROR_MESSAGES.AI_SERVICE_TIMEOUT, {
      provider,
    }),

  aiServiceUnavailable: (providerError?: string) =>
    new APIError(503, ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE, {
      providerError,
    }),

  enrichmentDataPartial: (failedServices: string[]) =>
    new APIError(206, ERROR_MESSAGES.ENRICHMENT_DATA_PARTIAL, {
      failedServices,
    }),

  // ============================================================================
  // INTERNAL SERVER ERRORS (500)
  // ============================================================================
  databaseError: (originalError?: string) =>
    new APIError(500, ERROR_MESSAGES.DATABASE_ERROR, {
      originalError,
    }),

  analysisFailed: (reason?: string) =>
    new APIError(500, ERROR_MESSAGES.ANALYSIS_FAILED, {
      reason,
    }),

  userSyncFailed: (originalError?: string) =>
    new APIError(500, ERROR_MESSAGES.USER_SYNC_FAILED, {
      originalError,
    }),

  invalidUserAccount: (reason?: string) =>
    new APIError(400, ERROR_MESSAGES.INVALID_USER_ACCOUNT, {
      reason,
    }),

  // ============================================================================
  // CONFIGURATION ERRORS (500)
  // ============================================================================
  apiKeyMissing: (service: string) =>
    new APIError(500, ERROR_MESSAGES.API_KEY_MISSING, {
      service,
    }),

  unexpectedError: (originalError?: Error) =>
    new APIError(500, ERROR_MESSAGES.UNEXPECTED_ERROR, {
      originalError: originalError?.message,
      stack: originalError?.stack,
    }),
};
