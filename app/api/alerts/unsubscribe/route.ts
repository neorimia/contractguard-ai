// app/api/alerts/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/alerts/unsubscribe
 * Unsubscribe from alerts for a specific watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unsubscribe token required", status: "error" },
        { status: 400 }
      );
    }

    // Decode token to get userId and watchlistId
    // TODO: Implement proper HMAC-based token verification for security
    const decoded = Buffer.from(token, "base64").toString();
    const [userId, watchlistId] = decoded.split(":");

    if (!userId || !watchlistId) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token", status: "error" },
        { status: 400 }
      );
    }

    // Disable alerts for this watchlist
    const [updated] = await db
      .update(watchlists)
      .set({ alertEnabled: false })
      .where(
        and(
          eq(watchlists.id, watchlistId),
          eq(watchlists.userId, parseInt(userId))
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Watchlist not found", status: "error" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Successfully unsubscribed from alerts",
      status: "success",
    });
  } catch (error) {
    console.error("[API] Error unsubscribing:", error);
    return NextResponse.json(
      {
        error: "Failed to unsubscribe",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alerts/unsubscribe
 * Show unsubscribe confirmation page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Return HTML page for unsubscribe confirmation
  return new NextResponse(
    `
<!DOCTYPE html>
<html>
<head>
  <title>Unsubscribe - ContractGuard AI</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
    }
    h1 { color: #111827; margin-top: 0; }
    p { color: #6b7280; line-height: 1.6; }
    button {
      background: #ef4444;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover { background: #dc2626; }
    .success { color: #10b981; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚫 Unsubscribe from Alerts</h1>
    <p>Click the button below to stop receiving alerts for this contract.</p>
    <button onclick="unsubscribe()">Unsubscribe</button>
    <div id="result" style="margin-top: 20px;"></div>
  </div>
  <script>
    async function unsubscribe() {
      const response = await fetch('/api/alerts/unsubscribe?token=${token}', {
        method: 'POST'
      });
      const data = await response.json();
      document.getElementById('result').innerHTML =
        response.ok
          ? '<p class="success">✓ Successfully unsubscribed</p>'
          : '<p style="color: #ef4444;">Failed to unsubscribe. Please try again.</p>';
    }
  </script>
</body>
</html>
  `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}
