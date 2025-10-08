// app/api/debug/current-user/route.ts
import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

const authService = new AuthService();

export async function GET() {
  try {
    // Get Stack Auth user
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json({
        authenticated: false,
        message: "Not logged in",
      });
    }

    // Try to find user in our database
    const dbUser = await authService.getUserByStackId(stackUser.id);

    return NextResponse.json({
      authenticated: true,
      stackAuth: {
        id: stackUser.id,
        email: stackUser.primaryEmail,
        displayName: stackUser.displayName,
        profileImageUrl: stackUser.profileImageUrl,
      },
      database: {
        found: !!dbUser,
        user: dbUser
          ? {
              id: dbUser.id,
              stackUserId: dbUser.stackUserId,
              email: dbUser.email,
              tier: dbUser.tier,
              scansToday: dbUser.scansToday,
              scansResetAt: dbUser.scansResetAt,
            }
          : null,
      },
      match: {
        stackIdMatches: dbUser?.stackUserId === stackUser.id,
        emailMatches: dbUser?.email === stackUser.primaryEmail,
      },
    });
  } catch (error: any) {
    console.error("Current user debug error:", error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
