/**
 * User Credits API
 *
 * Returns instant credits balance and purchase history
 */

import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { db } from "@/db";
import { users, purchases } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    // Check if user is authenticated
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          status: "error",
        },
        { status: 401 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stackUserId, stackUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          status: "error",
        },
        { status: 404 }
      );
    }

    // Get recent instant credit purchases
    const recentPurchases = await db
      .select({
        id: purchases.id,
        type: purchases.type,
        credits: purchases.credits,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        completedAt: purchases.completedAt,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.userId, user.id),
          eq(purchases.type, "instant_credits")
        )
      )
      .orderBy(desc(purchases.createdAt))
      .limit(10);

    // Calculate total purchased credits
    const completedPurchases = recentPurchases.filter(
      (p) => p.status === "completed"
    );
    const totalPurchased = completedPurchases.reduce(
      (sum, p) => sum + (p.credits || 0),
      0
    );

    return NextResponse.json({
      status: "success",
      data: {
        balance: user.instantCredits || 0,
        usedToday: user.instantCreditsUsedToday || 0,
        totalPurchased,
        recentPurchases: recentPurchases.map((p) => ({
          id: p.id,
          type: p.type,
          credits: p.credits,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
          completedAt: p.completedAt?.toISOString() || null,
        })),
      },
    });
  } catch (error) {
    console.error("Credits API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch credits",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}
