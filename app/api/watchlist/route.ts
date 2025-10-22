// app/api/watchlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists, cryptoAudits } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

/**
 * GET /api/watchlist
 * Get all watchlists for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const authService = new AuthService();
    const user = await authService.getUserByStackId(stackUser.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found", status: "error" },
        { status: 404 }
      );
    }

    // Get all watchlists for user with latest audit data
    const userWatchlists = await db
      .select({
        watchlist: watchlists,
        latestAudit: cryptoAudits,
      })
      .from(watchlists)
      .leftJoin(
        cryptoAudits,
        and(
          eq(watchlists.contractAddress, cryptoAudits.contractAddress),
          eq(watchlists.chain, cryptoAudits.chain)
        )
      )
      .where(eq(watchlists.userId, user.id))
      .orderBy(desc(watchlists.createdAt));

    return NextResponse.json({
      data: userWatchlists,
      status: "success",
    });
  } catch (error) {
    console.error("[API] Error fetching watchlist:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch watchlist",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add a contract to the watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const authService = new AuthService();
    const user = await authService.getUserByStackId(stackUser.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found", status: "error" },
        { status: 404 }
      );
    }

    // Check tier authorization - watchlist is Pro/Team feature
    if (user.tier !== "pro" && user.tier !== "team") {
      return NextResponse.json(
        {
          error:
            "Watchlist alerts are only available for Pro and Team users. Please upgrade to access this feature.",
          status: "error",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      contractAddress,
      chain = "ethereum",
      nickname,
      notes,
      alertPreferences,
    } = body;

    // Validate contract address
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { error: "Invalid contract address format", status: "error" },
        { status: 400 }
      );
    }

    // Check watchlist limit (Pro: 10, Team: 50)
    const watchlistLimit = user.tier === "team" ? 50 : 10;
    const [existingCount] = await db
      .select({ count: count() })
      .from(watchlists)
      .where(eq(watchlists.userId, user.id));

    if (existingCount.count >= watchlistLimit) {
      return NextResponse.json(
        {
          error: `Watchlist limit reached (${watchlistLimit} contracts maximum for ${user.tier} tier)`,
          status: "error",
        },
        { status: 400 }
      );
    }

    // Check if contract already in watchlist
    const [existing] = await db
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.userId, user.id),
          eq(watchlists.contractAddress, contractAddress.toLowerCase()),
          eq(watchlists.chain, chain)
        )
      );

    if (existing) {
      return NextResponse.json(
        {
          error: "Contract already in watchlist",
          status: "error",
        },
        { status: 400 }
      );
    }

    // Create watchlist entry
    const [newWatchlist] = await db
      .insert(watchlists)
      .values({
        userId: user.id,
        contractAddress: contractAddress.toLowerCase(),
        chain,
        nickname,
        notes,
        ...alertPreferences,
      })
      .returning();

    return NextResponse.json({
      data: newWatchlist,
      status: "success",
    });
  } catch (error) {
    console.error("[API] Error adding to watchlist:", error);
    return NextResponse.json(
      {
        error: "Failed to add contract to watchlist",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}
