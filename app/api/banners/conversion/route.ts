// app/api/banners/conversion/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BannerService } from "@/lib/services/banner.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, revenueGenerated } = body;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userId" },
        { status: 400 }
      );
    }

    const result = await BannerService.trackConversion({
      sessionId,
      userId,
      revenueGenerated,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to track banner conversion:", error);
    return NextResponse.json(
      { error: "Failed to track conversion" },
      { status: 500 }
    );
  }
}
