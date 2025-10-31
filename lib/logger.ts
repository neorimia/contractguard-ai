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

// Configure Pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print in development for readability
  transport: isDevelopment
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