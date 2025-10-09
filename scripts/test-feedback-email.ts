/**
 * Test script for feedback notification emails
 *
 * Usage:
 * npx tsx scripts/test-feedback-email.ts
 */

import { EmailService } from "../lib/services/email.service";

const emailService = new EmailService();

async function testFeedbackNotification() {
  console.log("🧪 Testing feedback notification email...\n");

  try {
    await emailService.sendFeedbackNotification({
      reason: "cancellation",
      feedback:
        "Reason: Too expensive\n\nAdditional comments: I really liked the product but the pricing is too high for my budget. Maybe a lower tier would help.",
      rating: 4,
      userEmail: "test-user@example.com",
      timestamp: new Date().toISOString(),
    });

    console.log("\n✅ Test email sent successfully!");
    console.log(
      "\nCheck your inbox at:",
      process.env.TEAM_NOTIFICATION_EMAIL || "support@contractguard.ai"
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testFeedbackNotification();
