#!/usr/bin/env tsx
/**
 * Test Email Notifications
 *
 * Usage: tsx scripts/test-emails.ts
 *
 * Tests all email templates by sending them to a test email address.
 * Make sure RESEND_API_KEY is set in .env.local
 */

import "dotenv/config";
import { EmailService } from "@/lib/services/email.service";

// Change this to your test email
const TEST_EMAIL = process.env.TEST_EMAIL || "your-email@example.com";

async function testEmails() {
  console.log("🧪 Testing Email Notifications\n");
  console.log(`Sending test emails to: ${TEST_EMAIL}\n`);

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not found in environment variables");
    process.exit(1);
  }

  if (TEST_EMAIL === "your-email@example.com") {
    console.error(
      "❌ Please set TEST_EMAIL in the script or environment variable",
    );
    process.exit(1);
  }

  const emailService = new EmailService();

  try {
    // Test 1: Welcome Email
    console.log("1️⃣ Testing Welcome Email...");
    await emailService.sendWelcomeEmail(TEST_EMAIL, {
      displayName: "Test User",
      scansRemaining: 3,
    });
    console.log("✅ Welcome email sent\n");

    // Wait 1 second between emails
    await sleep(1000);

    // Test 2: Payment Confirmation
    console.log("2️⃣ Testing Payment Confirmation Email...");
    await emailService.sendPaymentConfirmation(TEST_EMAIL, {
      firstName: "Test User",
      amount: 29.0,
      invoiceId: "inv_test_123456",
      tier: "pro",
      nextPaymentDate: new Date("2025-02-08"),
      receiptUrl: "https://invoice.stripe.com/test",
    });
    console.log("✅ Payment confirmation sent\n");

    await sleep(1000);

    // Test 3: Payment Failed Notification
    console.log("3️⃣ Testing Payment Failed Notification...");
    await emailService.sendPaymentFailedNotification(TEST_EMAIL, {
      firstName: "Test User",
      amount: 29.0,
      failureReason: "Card declined",
      nextAttemptDate: new Date("2025-01-10"),
      updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?update_payment=true`,
    });
    console.log("✅ Payment failed notification sent\n");

    await sleep(1000);

    // Test 4: Cancellation Email
    console.log("4️⃣ Testing Cancellation Email...");
    await emailService.sendCancellationEmail(TEST_EMAIL, {
      firstName: "Test User",
      tier: "pro",
      accessEndDate: new Date("2025-02-08"),
      reactivateUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      feedbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/feedback?reason=cancellation`,
    });
    console.log("✅ Cancellation email sent\n");

    console.log("🎉 All test emails sent successfully!");
    console.log(`📧 Check ${TEST_EMAIL} for the test emails\n`);
  } catch (error) {
    console.error("❌ Error sending test emails:", error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run tests
testEmails().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
