// app/api/banners/impression/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BannerService } from "@/lib/services/banner.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bannerId,
      sessionId,
      userId,
      placement,
      scanCount,
      contractAddress,
      userAgent,
      deviceType,
      userTier,
    } = body;

    if (!bannerId || !sessionId || !placement) {
      return NextResponse.json(
        { error: "Missing required fields: bannerId, sessionId, placement" },
        { status: 400 }
      );
    }

    // Get IP address for analytics
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    await BannerService.trackImpression({
      bannerId,
      sessionId,
      userId,
      placement,
      scanCount,
      contractAddress,
      userAgent,
      ipAddress,
      deviceType,
      userTier,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track banner impression:", error);
    return NextResponse.json(
      { error: "Failed to track impression" },
      { status: 500 }
    );
  }
}
