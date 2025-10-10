/**
 * GET /api/anonymous-scans
 *
 * Retrieve anonymous scans for a session ID
 * Used to show scan history for anonymous users
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { anonymousScans } from "@/db/schema";
import { eq, gt, and, desc } from "drizzle-orm";
import { getAnonymousSessionFromRequest } from "@/lib/middleware/session-tracking";

export async function GET(req: NextRequest) {
  try {
    // Get anonymous session from cookies
    const sessionId = getAnonymousSessionFromRequest(req);

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "No anonymous session found",
          message: "Session not found or expired",
          status: "error",
        },
        { status: 404 }
      );
    }

    // Get all scans for this session that haven't expired
    const now = new Date();
    const scans = await db
      .select()
      .from(anonymousScans)
      .where(
        and(
          eq(anonymousScans.sessionId, sessionId),
          gt(anonymousScans.expiresAt, now)
        )
      )
      .orderBy(desc(anonymousScans.createdAt));

    return NextResponse.json({
      status: "success",
      data: {
        sessionId,
        scans,
        totalScans: scans.length,
      },
    });
  } catch (error: any) {
    console.error("Anonymous scans fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch scans",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
