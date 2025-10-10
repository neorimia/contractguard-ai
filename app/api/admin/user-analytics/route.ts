// app/api/admin/user-analytics/route.ts
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
    const analytics = await analyticsService.getUserAnalytics({
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch user analytics" },
      { status: 500 }
    );
  }
}
