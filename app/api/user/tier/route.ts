// app/api/user/tier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { stackServerApp } from "@/stack/server";

export async function GET(request: NextRequest) {
  try {
    // Get user from Stack Auth (server-side)
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authService = new AuthService();
    const user = await authService.getUserByStackId(stackUser.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      tier: user.tier,
      scansToday: user.scansToday,
      scansResetAt: user.scansResetAt,
    });
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
