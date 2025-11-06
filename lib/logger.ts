// lib/logger.ts
import pino from 'pino';

/**
 * Structured Logger Configuration
 *
 * Implements structured logging with Pino for better debugging,
 * monitoring, and production observability.
 */

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Check if we're in Next.js runtime (worker threads don't work well in Next.js)
// Next.js API routes run in a bundled environment where worker threads fail
const isNextJsRuntime =
  typeof process !== 'undefined' &&
  (process.env.NEXT_RUNTIME ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    // Check if we're in a Next.js build output
    (typeof __dirname !== 'undefined' &&
      __dirname.includes('.next/server')));

// Configure Pino logger
// Note: pino-pretty uses worker threads which don't work in Next.js
// For Next.js, we'll use simple JSON output even in development
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Only use pino-pretty in non-Next.js environments
  // Next.js has issues with worker threads used by pino-pretty
  transport:
    isDevelopment && !isNextJsRuntime
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'contractguard-ai',
  },

  // Format timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },

  // In Next.js development, still make output readable
  ...(isDevelopment && isNextJsRuntime
    ? {
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
        },
      }
    : {}),
});

/**
 * Create a child logger with additional context
 *
 * @param context - Contextual information to add to all logs from this child
 * @returns Child logger instance
 *
 * @example
 * const tokenSearchLogger = createLogger({ service: 'token-search' });
 * tokenSearchLogger.info({ query: 'ETH' }, 'Searching for token');
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * API request logger middleware context
 *
 * @param req - Request object
 * @returns Request context for logging
 */
export function getRequestContext(req: Request) {
  return {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
  };
}

/**
 * Log performance metrics
 *
 * @param operation - Operation name
 * @param durationMs - Duration in milliseconds
 * @param metadata - Additional metadata
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, any>
) {
  logger.info(
    {
      operation,
      durationMs,
      ...metadata,
    },
    `Performance: ${operation} took ${durationMs}ms`
  );
}

/**
 * Log external API calls
 *
 * @param service - External service name
 * @param endpoint - API endpoint
 * @param metadata - Additional metadata
 */
export function logExternalAPI(
  service: string,
  endpoint: string,
  metadata?: Record<string, any>
) {
  logger.debug(
    {
      externalService: service,
      endpoint,
      ...metadata,
    },
    `External API call: ${service}`
  );
}

/**
 * Log cache operations
 *
 * @param operation - Cache operation (hit, miss, set, delete)
 * @param key - Cache key
 * @param metadata - Additional metadata
 */
export function logCache(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  metadata?: Record<string, any>
) {
  logger.debug(
    {
      cacheOperation: operation,
      cacheKey: key,
      ...metadata,
    },
    `Cache ${operation}: ${key}`
  );
}

/**
 * Log circuit breaker events
 *
 * @param name - Circuit breaker name
 * @param state - Circuit state (open, closed, halfOpen)
 * @param metadata - Additional metadata
 */
export function logCircuitBreaker(
  name: string,
  state: 'open' | 'closed' | 'halfOpen',
  metadata?: Record<string, any>
) {
  const logLevel = state === 'open' ? 'warn' : 'info';
  logger[logLevel](
    {
      circuitBreaker: name,
      circuitState: state,
      ...metadata,
    },
    `Circuit breaker ${name} is ${state}`
  );
}

// Export default logger
export default logger;