// app/api/admin/conversion-funnel/route.ts
import { requireAdmin, isErrorResponse } from "@/lib/middleware/admin-auth";
import { AnalyticsService } from "@/lib/services/analytics.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Authenticate admin
  const authResult = await requireAdmin(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const analyticsService = new AnalyticsService();
    const funnel = await analyticsService.getConversionFunnel({
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(funnel);
  } catch (error) {
    console.error("Error fetching conversion funnel:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion funnel" },
      { status: 500 }
    );
  }
}
