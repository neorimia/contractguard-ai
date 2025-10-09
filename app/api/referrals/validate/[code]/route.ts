// app/api/referrals/validate/[code]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/services/referral.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const referralService = new ReferralService();
    const validation = await referralService.validateReferralCode(code);

    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        displayName: validation.referrer?.displayName || "A ContractGuard user",
        avatarUrl: validation.referrer?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}