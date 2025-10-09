// app/api/referrals/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/services/referral.service";
import { getUserFromRequest } from "@/lib/middleware/auth.middleware";
import { getClientInfo } from "@/lib/utils/client-info";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = getUserFromRequest(request);

    const body = await request.json();
    const { trigger } = body;

    if (!trigger || !["first_audit_complete", "email_verified"].includes(trigger)) {
      return NextResponse.json(
        { error: "Invalid trigger" },
        { status: 400 }
      );
    }

    const clientInfo = await getClientInfo(request);

    const referralService = new ReferralService();
    const result = await referralService.confirmReferral({
      referredUserId: user.id,
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