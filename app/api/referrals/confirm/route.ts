// app/api/referrals/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/services/referral.service";
import { AuthService } from "@/lib/services/auth.service";
import { stackServerApp } from "@/stack/server";
import { getClientInfo } from "@/lib/utils/client-info";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { trigger } = body;

    if (
      !trigger ||
      !["first_audit_complete", "email_verified"].includes(trigger)
    ) {
      return NextResponse.json({ error: "Invalid trigger" }, { status: 400 });
    }

    const clientInfo = await getClientInfo(request);

    const referralService = new ReferralService();
    const result = await referralService.confirmReferral({
      referredUserId: appUser.id,
      trigger,
      metadata: clientInfo,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.error === "no_pending_referral" ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: result.reward
        ? {
            type: result.reward.type,
            amount: result.reward.amount,
            description: result.reward.metadata?.description,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error confirming referral:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
