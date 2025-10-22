// lib/utils/client-info.ts

import type { NextRequest } from "next/server";

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
  fingerprint?: string;
  deviceType?: string;
  referer?: string;
}

/**
 * Extract client information from NextRequest (server-side only)
 * This function should only be used in server components or API routes
 */
export async function getClientInfoFromRequest(
  request: NextRequest
): Promise<ClientInfo> {
  const headersList = request.headers;

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
 * Create a basic client info object for client-side usage
 * This is a fallback when server-side headers are not available
 */
export function createBasicClientInfo(): ClientInfo {
  if (typeof window === "undefined") {
    return {
      ip: "unknown",
      userAgent: "unknown",
      deviceType: "unknown",
    };
  }

  const userAgent = navigator.userAgent;
  return {
    ip: "unknown", // Cannot get IP on client-side
    userAgent,
    deviceType: getDeviceType(userAgent),
    referer: document.referrer || undefined,
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

/**
 * Create a simple fingerprint from request headers (fallback if no JS fingerprint)
 */
export function generateServerFingerprint(clientInfo: ClientInfo): string {
  const parts = [
    clientInfo.ip || "",
    clientInfo.userAgent || "",
    clientInfo.deviceType || "",
  ];

  // Create a simple hash-like string
  return Buffer.from(parts.join("|")).toString("base64").substring(0, 32);
}
