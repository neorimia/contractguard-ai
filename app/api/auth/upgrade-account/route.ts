// app/api/auth/upgrade-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";

/**
 * Account Upgrade API
 * Upgrades a soft account to a full account after Stack Auth signup
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const { anonymousSessionId } = await req.json();

    // Find user by Stack ID
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

    // Check if already a full account
    if (appUser.accountType === "full") {
      return NextResponse.json({
        status: "success",
        message: "Account already upgraded",
        accountType: "full",
      });
    }

    // Upgrade account from soft to full
    const [upgradedUser] = await db
      .update(users)
      .set({
        accountType: "full",
        emailVerified: true,
        softSignupEmail: null,
        ...(anonymousSessionId && { anonymousSessionId }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, appUser.id))
      .returning();

    console.log(
      `Account upgraded: ${upgradedUser.email} (${upgradedUser.accountType})`
    );

    return NextResponse.json({
      status: "success",
      message: "Account upgraded successfully",
      accountType: "full",
      user: {
        id: upgradedUser.id,
        email: upgradedUser.email,
        tier: upgradedUser.tier,
      },
    });
  } catch (error: any) {
    console.error("Account upgrade error:", error);
    return NextResponse.json(
      {
        error: "Upgrade failed",
        details: error.message,
        status: "error",
      },
      { status: 500 }
    );
  }
}
