// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

const authService = new AuthService();

/**
 * GET /api/user/profile
 * Get current user's profile information
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    // Get user from our database
    const appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      // User doesn't exist in our database yet - sync them
      const nameParts = stackUser.displayName?.split(" ") || [];
      const syncedUser = await authService.syncUser(
        stackUser.id,
        stackUser.primaryEmail,
        {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          avatarUrl: stackUser.profileImageUrl || undefined,
        }
      );

      return NextResponse.json({
        ...syncedUser,
        status: "success",
      });
    }

    // Return user profile (exclude sensitive fields)
    const { verificationToken, verificationTokenExpires, ...safeProfile } =
      appUser;

    return NextResponse.json({
      ...safeProfile,
      status: "success",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", status: "error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update user profile information
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    // Get user from our database
    const appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      return NextResponse.json(
        { error: "User not found", status: "error" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { firstName, lastName, avatarUrl } = body;

    // Update user profile
    const updatedUser = await authService.updateUser(appUser.id, {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(avatarUrl && { avatarUrl }),
    });

    // Remove sensitive fields
    const { verificationToken, verificationTokenExpires, ...safeProfile } =
      updatedUser;

    return NextResponse.json({
      ...safeProfile,
      status: "success",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", status: "error" },
      { status: 500 }
    );
  }
}
