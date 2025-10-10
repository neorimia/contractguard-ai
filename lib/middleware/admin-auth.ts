// lib/middleware/admin-auth.ts
import { stackServerApp } from "@/stack/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Admin authentication middleware
 * Verifies user is authenticated and has admin privileges
 */
export async function requireAdmin(request: NextRequest) {
  const user = await stackServerApp.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Authentication required" },
      { status: 401 }
    );
  }

  // Get user from database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.stackUserId, user.id))
    .limit(1);

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check admin status
  // For now, check if user is in ADMIN_EMAILS env variable
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  const isAdmin = adminEmails.includes(dbUser.email!);

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  return { user: dbUser };
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}
