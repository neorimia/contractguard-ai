/**
 * Session Tracking Middleware
 *
 * Handles anonymous user session tracking via cookies for progressive signup flow.
 * Enables users to scan contracts without creating an account (up to 3 scans).
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const ANONYMOUS_SESSION_COOKIE = "anonymous_session_id";
const ANONYMOUS_SCAN_COUNT_PREFIX = "anon_scans_";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds
const MAX_ANONYMOUS_SCANS = 3;

/**
 * Get or create an anonymous session ID
 * Creates a new UUID if no session exists
 *
 * @returns {Promise<string>} Session ID (UUID)
 */
export async function getOrCreateAnonymousSession(
  req: NextRequest
): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(ANONYMOUS_SESSION_COOKIE)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();

    cookieStore.set(ANONYMOUS_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }

  return sessionId;
}

/**
 * Get the current anonymous scan count for a session
 *
 * @param {string} sessionId - Anonymous session UUID
 * @returns {Promise<number>} Number of scans performed (0-3)
 */
export async function getAnonymousScanCount(
  sessionId: string
): Promise<number> {
  const cookieStore = await cookies();
  const countCookie = cookieStore.get(
    `${ANONYMOUS_SCAN_COUNT_PREFIX}${sessionId}`
  )?.value;

  if (!countCookie) {
    return 0;
  }

  const count = parseInt(countCookie, 10);
  return isNaN(count) ? 0 : count;
}

/**
 * Increment the anonymous scan counter
 *
 * @param {string} sessionId - Anonymous session UUID
 * @returns {Promise<number>} New scan count
 */
export async function incrementAnonymousScanCount(
  sessionId: string
): Promise<number> {
  const cookieStore = await cookies();
  const currentCount = await getAnonymousScanCount(sessionId);
  const newCount = Math.min(currentCount + 1, MAX_ANONYMOUS_SCANS);

  cookieStore.set(
    `${ANONYMOUS_SCAN_COUNT_PREFIX}${sessionId}`,
    newCount.toString(),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    }
  );

  return newCount;
}

/**
 * Check if anonymous session has reached scan limit
 *
 * @param {string} sessionId - Anonymous session UUID
 * @returns {Promise<boolean>} True if limit reached
 */
export async function hasReachedAnonymousLimit(
  sessionId: string
): Promise<boolean> {
  const count = await getAnonymousScanCount(sessionId);
  return count >= MAX_ANONYMOUS_SCANS;
}

/**
 * Get remaining scans for anonymous session
 *
 * @param {string} sessionId - Anonymous session UUID
 * @returns {Promise<number>} Remaining scans (0-3)
 */
export async function getRemainingAnonymousScans(
  sessionId: string
): Promise<number> {
  const count = await getAnonymousScanCount(sessionId);
  return Math.max(0, MAX_ANONYMOUS_SCANS - count);
}

/**
 * Clear anonymous session (used when user signs up)
 *
 * @param {string} sessionId - Anonymous session UUID
 */
export async function clearAnonymousSession(sessionId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ANONYMOUS_SESSION_COOKIE);
  cookieStore.delete(`${ANONYMOUS_SCAN_COUNT_PREFIX}${sessionId}`);
}

/**
 * Get anonymous session from request (if exists)
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {string | null} Session ID or null if not found
 */
export function getAnonymousSessionFromRequest(
  req: NextRequest
): string | null {
  const sessionCookie = req.cookies.get(ANONYMOUS_SESSION_COOKIE);
  return sessionCookie?.value || null;
}

/**
 * Check if request has anonymous session
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {boolean} True if anonymous session exists
 */
export function hasAnonymousSession(req: NextRequest): boolean {
  return !!getAnonymousSessionFromRequest(req);
}

/**
 * Constants for external use
 */
export const ANONYMOUS_SCAN_LIMITS = {
  MAX_SCANS: MAX_ANONYMOUS_SCANS,
  SESSION_DURATION_HOURS: SESSION_MAX_AGE / 3600,
  PROMPT_SIGNUP_AFTER: 2, // Show signup prompt after 2 scans
} as const;
