// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateReferralCodeFormat } from "@/lib/utils/referral-code";
import { referralConfig } from "@/lib/referrals/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle referral landing pages
  if (pathname.startsWith("/ref/")) {
    const code = pathname.split("/")[2];

    // Validate referral code format
    if (code && validateReferralCodeFormat(code)) {
      // Create response with referral cookie
      const response = NextResponse.next();

      // Set referral cookie (7-day expiration)
      response.cookies.set(referralConfig.cookieName, code, {
        maxAge: referralConfig.cookieMaxAge, // 7 days
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      console.log(`Referral cookie set for code: ${code}`);

      return response;
    } else {
      // Invalid referral code format - let the page handle the error
      console.warn(`Invalid referral code format: ${code}`);
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/ref/:path*", // All referral landing pages
  ],
};