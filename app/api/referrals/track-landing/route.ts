// app/api/referrals/track-landing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/services/referral.service";
import { getClientInfo } from "@/lib/utils/client-info";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, fingerprint, source } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const clientInfo = await getClientInfo(request);

    const referralService = new ReferralService();
    const result = await referralService.createReferral({
      referrerCode: code,
      metadata: {
        ...clientInfo,
        fingerprint,
        source,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      referralId: result.referralId,
    });
  } catch (error) {
    console.error("Error tracking landing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}