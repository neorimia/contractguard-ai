// app/api/watchlist/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

/**
 * PATCH /api/watchlist/[id]
 * Update watchlist item settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      nickname,
      notes,
      alertEnabled,
      alertFrequency,
      alertOnRiskIncrease,
      alertOnNewFlags,
      alertOnLiquidityChange,
      alertOnHolderChange,
      riskIncreaseThreshold,
      liquidityChangeThreshold,
      holderChangeThreshold,
    } = body;

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (nickname !== undefined) updateData.nickname = nickname;
    if (notes !== undefined) updateData.notes = notes;
    if (alertEnabled !== undefined) updateData.alertEnabled = alertEnabled;
    if (alertFrequency !== undefined)
      updateData.alertFrequency = alertFrequency;
    if (alertOnRiskIncrease !== undefined)
      updateData.alertOnRiskIncrease = alertOnRiskIncrease;
    if (alertOnNewFlags !== undefined)
      updateData.alertOnNewFlags = alertOnNewFlags;
    if (alertOnLiquidityChange !== undefined)
      updateData.alertOnLiquidityChange = alertOnLiquidityChange;
    if (alertOnHolderChange !== undefined)
      updateData.alertOnHolderChange = alertOnHolderChange;
    if (riskIncreaseThreshold !== undefined)
      updateData.riskIncreaseThreshold = riskIncreaseThreshold;
    if (liquidityChangeThreshold !== undefined)
      updateData.liquidityChangeThreshold = liquidityChangeThreshold;
    if (holderChangeThreshold !== undefined)
      updateData.holderChangeThreshold = holderChangeThreshold;

    // Update watchlist (only if owned by user)
    const [updated] = await db
      .update(watchlists)
      .set(updateData)
      .where(and(eq(watchlists.id, id), eq(watchlists.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Watchlist not found or unauthorized", status: "error" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      status: "success",
    });
  } catch (error) {
    console.error("[API] Error updating watchlist:", error);
    return NextResponse.json(
      {
        error: "Failed to update watchlist",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist/[id]
 * Remove contract from watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Delete watchlist (only if owned by user)
    const [deleted] = await db
      .delete(watchlists)
      .where(and(eq(watchlists.id, id), eq(watchlists.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Watchlist not found or unauthorized", status: "error" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
    });
  } catch (error) {
    console.error("[API] Error deleting from watchlist:", error);
    return NextResponse.json(
      {
        error: "Failed to remove from watchlist",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}
