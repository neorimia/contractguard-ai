import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";
import { accessValidationService } from "@/lib/services/access-validation.service";

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Get user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json({
        error: "Not authenticated",
        user: null,
      });
    }

    // Get app user from database
    const authService = new AuthService();
    const appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      return NextResponse.json({
        error: "App user not found",
        stackUser: {
          id: stackUser.id,
          email: stackUser.primaryEmail,
          displayName: stackUser.displayName,
        },
        appUser: null,
      });
    }

    // Get current access status
    const accessStatus = await accessValidationService.getAccessStatus(
      appUser.id
    );

    return NextResponse.json({
      stackUser: {
        id: stackUser.id,
        email: stackUser.primaryEmail,
        displayName: stackUser.displayName,
      },
      appUser: {
        id: appUser.id,
        stackUserId: appUser.stackUserId,
        email: appUser.email,
        displayName: appUser.displayName,
        tier: appUser.tier,
        accountType: appUser.accountType,
        instantCredits: appUser.instantCredits,
        instantCreditsUsedToday: appUser.instantCreditsUsedToday,
        scansToday: appUser.scansToday,
        scansResetAt: appUser.scansResetAt,
      },
      accessStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug user credits error:", error);
    return NextResponse.json(
      {
        error: "Failed to get user credits",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
