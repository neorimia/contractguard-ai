// app/api/user/verification-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    // Validate that user has an email
    if (!stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Invalid user account - Missing email address" },
        { status: 400 }
      );
    }

    // Get or create app user in our database
    const authService = new AuthService();
    let appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      // First time user - create in our database
      appUser = await authService.syncUser(
        stackUser.id,
        stackUser.primaryEmail,
        {
          displayName: stackUser.displayName || undefined,
          avatarUrl: stackUser.profileImageUrl || undefined,
        }
      );
    }

    const verified = await authService.isEmailVerified(appUser.id);

    return NextResponse.json({
      verified,
      email: appUser.email,
    });
  } catch (error) {
    console.error("Error checking verification status:", error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
