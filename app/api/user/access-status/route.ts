/**
 * User Access Status API
 *
 * Returns current access status for authenticated user or guest
 * Used by client-side useHasAccess hook
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";
import { accessValidationService } from "@/lib/services/access-validation.service";

const authService = new AuthService();

export async function GET(req: NextRequest) {
  try {
    // Check for guest session ID in query params or cookies
    const url = new URL(req.url);
    const guestSessionId = url.searchParams.get("guestSessionId");

    // Try to authenticate user
    const stackUser = await stackServerApp.getUser();

    if (stackUser) {
      // Authenticated user
      const appUser = await authService.getUserByStackId(stackUser.id);

      if (!appUser) {
        return NextResponse.json(
          {
            error: "User not found",
            status: "error",
          },
          { status: 404 }
        );
      }

      // Get access status
      const accessStatus = await accessValidationService.getAccessStatus(
        appUser.id
      );

      return NextResponse.json({
        ...accessStatus,
        isAuthenticated: true,
        status: "success",
      });
    } else if (guestSessionId) {
      // Guest user
      const accessStatus = await accessValidationService.validateGuestAccess(
        guestSessionId
      );

      return NextResponse.json({
        ...accessStatus,
        isAuthenticated: false,
        status: "success",
      });
    } else {
      // No authentication and no guest session
      // Return default free tier access
      return NextResponse.json({
        hasAccess: true,
        accessType: "free",
        scansRemaining: 3,
        instantCredits: 0,
        isAuthenticated: false,
        status: "success",
      });
    }
  } catch (error: any) {
    console.error("Access status error:", error);
    return NextResponse.json(
      {
        error: "Failed to get access status",
        details: error.message || "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}