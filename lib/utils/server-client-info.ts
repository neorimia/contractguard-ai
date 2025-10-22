// lib/utils/server-client-info.ts
// Server-only utilities for extracting client information

import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { ClientInfo } from "./client-info";

/**
 * Extract client information from request (server-side only)
 * Works with both Next.js headers() and NextRequest
 */
export async function getClientInfo(
  request?: NextRequest
): Promise<ClientInfo> {
  const headersList = request ? request.headers : await headers();

  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  const userAgent = headersList.get("user-agent") || "unknown";
  const fingerprint = headersList.get("x-fingerprint") || undefined;
  const referer = headersList.get("referer") || undefined;

  return {
    ip,
    userAgent,
    fingerprint,
    deviceType: getDeviceType(userAgent),
    referer,
  };
}

/**
 * Determine device type from user agent
 */
function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  // Check for mobile devices
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return "mobile";
  }

  // Check for tablets
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}
