// app/api/admin/revenue-stats/route.ts
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
    const stats = await analyticsService.getRevenueStats({
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue statistics" },
      { status: 500 }
    );
  }
}
