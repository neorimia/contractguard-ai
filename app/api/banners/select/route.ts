// app/api/banners/select/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BannerService } from "@/lib/services/banner.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placement, sessionId, userId, scanCount, contractAddress } = body;

    if (!placement || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: placement, sessionId" },
        { status: 400 }
      );
    }

    // Determine device type from user agent
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = userAgent.includes("Mobile")
      ? "mobile"
      : userAgent.includes("Tablet")
        ? "tablet"
        : "desktop";

    const banner = await BannerService.selectBanner({
      placement,
      sessionId,
      userId,
      scanCount,
      contractAddress,
      deviceType,
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner selection error:", error);
    return NextResponse.json(
      { error: "Failed to select banner" },
      { status: 500 }
    );
  }
}
