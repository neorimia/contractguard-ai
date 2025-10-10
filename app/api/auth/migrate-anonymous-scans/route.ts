// app/api/auth/migrate-anonymous-scans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, anonymousScans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";

/**
 * Migrate Anonymous Scans API
 * Called after user completes signup to migrate their anonymous scans
 * to their new account
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const { anonymousSessionId } = await req.json();

    if (!anonymousSessionId) {
      return NextResponse.json(
        { error: "Session ID required", status: "error" },
        { status: 400 }
      );
    }

    // Get user from our database
    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.stackUserId, stackUser.id))
      .limit(1);

    if (!appUser) {
      return NextResponse.json(
        { error: "User not found", status: "error" },
        { status: 404 }
      );
    }

    // Update user with anonymous session ID (for tracking)
    await db
      .update(users)
      .set({
        anonymousSessionId,
        accountType: "full", // Upgrade from soft to full
      })
      .where(eq(users.id, appUser.id));

    // Get all anonymous scans for this session
    const scans = await db
      .select()
      .from(anonymousScans)
      .where(eq(anonymousScans.sessionId, anonymousSessionId));

    console.log(
      `Migrated ${scans.length} anonymous scans for user ${appUser.id}`
    );

    return NextResponse.json({
      status: "success",
      message: "Anonymous scans migrated successfully",
      scansMigrated: scans.length,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error.message,
        status: "error",
      },
      { status: 500 }
    );
  }
}
