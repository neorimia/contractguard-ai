// lib/redis.ts
/**
 * Centralized Redis client for caching and session management
 * Uses Upstash Redis for serverless-friendly caching
 */

import { Redis } from "@upstash/redis";

// Initialize Redis client with environment variables
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Helper function to generate cache keys with consistent naming
export function getCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(":")}`;
}

// Common TTL values (in seconds)
export const TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour
  LONG: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;
