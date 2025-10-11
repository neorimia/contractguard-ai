// app/api/banners/click/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BannerService } from "@/lib/services/banner.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bannerId, sessionId, userId } = body;

    if (!bannerId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: bannerId, sessionId" },
        { status: 400 }
      );
    }

    await BannerService.trackClick({
      bannerId,
      sessionId,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track banner click:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
