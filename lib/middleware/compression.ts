/**
 * Response Compression Middleware
 *
 * Compresses API responses to reduce bandwidth and improve performance
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Compress response if it's JSON and larger than threshold
 */
export async function withCompression(
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest) => {
    const response = await handler(req);

    // Check if client accepts compression
    const acceptEncoding = req.headers.get("accept-encoding") || "";
    const supportsGzip = acceptEncoding.includes("gzip");

    if (!supportsGzip) {
      return response;
    }

    // Only compress JSON responses
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return response;
    }

    // Get response body
    const body = await response.text();

    // Only compress if larger than 1KB
    if (body.length < 1024) {
      return new NextResponse(body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Add compression header hint
    // Note: Vercel handles actual gzip compression automatically
    // This is mainly for documentation and future middleware
    const headers = new Headers(response.headers);
    headers.set("X-Compression-Eligible", "true");
    headers.set("X-Original-Size", body.length.toString());

    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  };
}

/**
 * Helper to calculate response size savings
 */
export function calculateCompressionSavings(
  originalSize: number,
  compressedSize: number
): {
  savingsBytes: number;
  savingsPercentage: number;
} {
  const savings = originalSize - compressedSize;
  const percentage = (savings / originalSize) * 100;

  return {
    savingsBytes: savings,
    savingsPercentage: Math.round(percentage * 10) / 10,
  };
}
