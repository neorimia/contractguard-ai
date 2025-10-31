// lib/circuit-breaker.ts
import CircuitBreaker from 'opossum';
import { logCircuitBreaker, logger } from './logger';

/**
 * Circuit Breaker Configuration
 *
 * Implements circuit breaker pattern to prevent cascading failures
 * when external APIs are down or slow.
 */

export interface CircuitBreakerConfig {
  timeout?: number; // Request timeout in ms
  errorThresholdPercentage?: number; // Error percentage to trip circuit
  resetTimeout?: number; // Time before attempting to close circuit
  rollingCountTimeout?: number; // Time window for error rate calculation
  rollingCountBuckets?: number; // Number of buckets in rolling window
  name?: string; // Circuit breaker name for logging
}

const DEFAULT_CONFIG: Required<CircuitBreakerConfig> = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // Trip at 50% error rate
  resetTimeout: 30000, // Try to close after 30 seconds
  rollingCountTimeout: 10000, // 10 second rolling window
  rollingCountBuckets: 10, // 10 buckets = 1 second per bucket
  name: 'default',
};

/**
 * Create a circuit breaker for an async function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: CircuitBreakerConfig = {}
): CircuitBreaker<any[], any> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const breaker = new CircuitBreaker(fn, {
    timeout: fullConfig.timeout,
    errorThresholdPercentage: fullConfig.errorThresholdPercentage,
    resetTimeout: fullConfig.resetTimeout,
    rollingCountTimeout: fullConfig.rollingCountTimeout,
    rollingCountBuckets: fullConfig.rollingCountBuckets,
    name: fullConfig.name,
  });

  // Event listeners for monitoring with structured logging
  breaker.on('open', () => {
    logCircuitBreaker(fullConfig.name, 'open', {
      errorThreshold: fullConfig.errorThresholdPercentage,
      resetTimeout: fullConfig.resetTimeout,
    });
  });

  breaker.on('halfOpen', () => {
    logCircuitBreaker(fullConfig.name, 'halfOpen');
  });

  breaker.on('close', () => {
    logCircuitBreaker(fullConfig.name, 'closed', {
      stats: getCircuitBreakerState(breaker).stats,
    });
  });

  breaker.on('fallback', (result) => {
    logCircuitBreaker(fullConfig.name, 'closed', {
      fallbackExecuted: true,
      result: typeof result === 'object' ? JSON.stringify(result) : result,
    });
  });

  return breaker;
}

/**
 * Wrapper to execute a function with circuit breaker protection
 * and optional fallback
 */
export async function withCircuitBreaker<T>(
  breaker: CircuitBreaker<any[], T>,
  fallback?: () => Promise<T>
): Promise<T> {
  try {
    return await breaker.fire();
  } catch (error) {
    // If circuit is open or request failed, use fallback
    if (fallback) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : 'unknown error',
          fallbackActivated: true,
        },
        'Circuit breaker using fallback'
      );
      return await fallback();
    }
    throw error;
  }
}

/**
 * Check if circuit breaker is in a specific state
 */
export function getCircuitBreakerState(
  breaker: CircuitBreaker<any[], any>
): {
  state: 'OPEN' | 'HALF_OPEN' | 'CLOSED';
  stats: {
    failures: number;
    successes: number;
    rejects: number;
    fires: number;
    timeouts: number;
  };
} {
  return {
    state: breaker.opened
      ? 'OPEN'
      : breaker.halfOpen
        ? 'HALF_OPEN'
        : 'CLOSED',
    stats: {
      failures: breaker.stats.failures,
      successes: breaker.stats.successes,
      rejects: breaker.stats.rejects,
      fires: breaker.stats.fires,
      timeouts: breaker.stats.timeouts,
    },
  };
}