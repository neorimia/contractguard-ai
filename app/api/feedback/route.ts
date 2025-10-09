import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback as feedbackTable } from "@/db/schema";
import { EmailService } from "@/lib/services/email.service";

const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reason, feedback, rating, timestamp, userEmail, userId } = body;

    // Log feedback to console
    console.log("=== New Feedback Received ===");
    console.log("Timestamp:", timestamp);
    console.log("Reason:", reason || "general");
    console.log("Rating:", rating ? `${rating}/5 stars` : "Not provided");
    console.log("Feedback:", feedback);
    console.log("============================");

    // Store feedback in database
    try {
      await db.insert(feedbackTable).values({
        reason: reason || "general",
        feedback,
        rating,
        userEmail,
        userId: userId ? parseInt(userId) : undefined,
        createdAt: new Date(timestamp),
      });
      console.log("✅ Feedback stored in database");
    } catch (dbError) {
      console.error("Failed to store feedback in database:", dbError);
      // Continue even if DB storage fails
    }

    // Send notification to team
    await emailService.sendFeedbackNotification({
      reason: reason || "general",
      feedback,
      rating,
      userEmail,
      timestamp,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback received successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process feedback",
      },
      { status: 500 }
    );
  }
}
