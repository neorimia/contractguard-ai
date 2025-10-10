// lib/services/email.service.ts
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { PaymentConfirmationEmail } from "@/emails/PaymentConfirmationEmail";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { CancellationEmail } from "@/emails/CancellationEmail";
import { FeedbackNotificationEmail } from "@/emails/FeedbackNotificationEmail";
import { WelcomeBonusEmail } from "@/emails/WelcomeBonusEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailContext {
  firstName?: string;
}

/**
 * EmailService - Handles sending transactional emails
 */
export class EmailService {
  private serviceName = "EmailService";

  /**
   * Send email verification link
   */
  async sendVerificationEmail(
    to: string,
    token: string,
    context: EmailContext = {}
  ): Promise<void> {
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/handler/email-verification?code=${token}`;

      await resend.emails.send({
        from: "ContractGuard AI <noreply@contractguard.ai>",
        to,
        subject: "Verify your email - ContractGuard AI",
        html: this.getVerificationEmailTemplate(verificationUrl, context),
      });

      console.log(`[${this.serviceName}] Verification email sent to ${to}`);
    } catch (error) {
      console.error(
        `[${this.serviceName}] Error sending verification email:`,
        error
      );
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Send welcome email after email verification
   */
  async sendWelcomeEmail(
    to: string,
    context: {
      displayName?: string;
      scansRemaining: number;
    }
  ): Promise<void> {
    try {
      const html = await render(WelcomeEmail(context));

      await resend.emails.send({
        from: "ContractGuard AI <noreply@contractguard.ai>",
        to,
        subject: "Welcome to ContractGuard AI! 🛡️",
        html,
      });

      console.log(`[${this.serviceName}] Welcome email sent to ${to}`);
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to send welcome email:`,
        error
      );
      // Don't throw - email failure shouldn't block main flow
    }
  }

  /**
   * Send welcome bonus email after signup bonus
   *
   */
  async sendWelcomeBonusEmail(
    to: string,
    context: {
      displayName?: string;
      referrerName: string;
      bonusScans: number;
      totalScans: number;
      bonusAmount: number;
    }
  ): Promise<void> {
    try {
      const html = await render(WelcomeBonusEmail(context));
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to send welcome bonus email:`,
        error
      );
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    to: string,
    context: {
      firstName?: string;
      amount: number;
      invoiceId: string;
      tier: string;
      nextPaymentDate: Date;
      receiptUrl: string;
    }
  ): Promise<void> {
    try {
      const html = await render(PaymentConfirmationEmail(context));

      await resend.emails.send({
        from: "ContractGuard AI <billing@contractguard.ai>",
        to,
        subject: "Payment Received - Thank You! 💳",
        html,
      });

      console.log(`[${this.serviceName}] Payment confirmation sent to ${to}`);
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to send payment confirmation:`,
        error
      );
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(
    to: string,
    context: {
      firstName?: string;
      amount: number;
      failureReason: string;
      nextAttemptDate: Date;
      updatePaymentUrl: string;
    }
  ): Promise<void> {
    try {
      const html = await render(PaymentFailedEmail(context));

      await resend.emails.send({
        from: "ContractGuard AI <billing@contractguard.ai>",
        to,
        subject: "Action Required: Payment Failed ⚠️",
        html,
      });

      console.log(
        `[${this.serviceName}] Payment failed notification sent to ${to}`
      );
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to send payment failed notification:`,
        error
      );
    }
  }

  /**
   * Send subscription cancellation email
   */
  async sendCancellationEmail(
    to: string,
    context: {
      firstName?: string;
      tier: string;
      accessEndDate: Date;
      reactivateUrl: string;
      feedbackUrl: string;
    }
  ): Promise<void> {
    try {
      const html = await render(CancellationEmail(context));

      await resend.emails.send({
        from: "ContractGuard AI <noreply@contractguard.ai>",
        to,
        subject: "We're Sorry to See You Go 😢",
        html,
      });

      console.log(`[${this.serviceName}] Cancellation email sent to ${to}`);
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to send cancellation email:`,
        error
      );
    }
  }

  /**
   * Send feedback notification to team
   */
  async sendFeedbackNotification(context: {
    reason: string;
    feedback: string;
    rating?: number;
    userEmail?: string;
    timestamp: string;
  }): Promise<void> {
    try {
      const html = await render(FeedbackNotificationEmail(context));

      const teamEmail =
        process.env.TEAM_NOTIFICATION_EMAIL || "support@contractguard.ai";

      await resend.emails.send({
        from: "ContractGuard AI <notifications@contractguard.ai>",
        to: teamEmail,
        subject: `[Feedback] New ${context.reason} feedback received`,
        html,
      });

      console.log(`[${this.serviceName}] Feedback notification sent to team`);
    } catch (error) {
      console.error(
        `[${this.serviceName}] Failed to send feedback notification:`,
        error
      );
      // Don't throw - email failure shouldn't block main flow
    }
  }

  /**
   * Email template for verification
   */
  private getVerificationEmailTemplate(
    verificationUrl: string,
    context: EmailContext
  ): string {
    const greeting = context.firstName ? `Hi ${context.firstName}` : "Hello";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 40px 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: #3b82f6;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
        }
        .button:hover {
            background: #2563eb;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .link-text {
            font-size: 14px;
            color: #666;
            word-break: break-all;
            background-color: #f9fafb;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer {
            padding: 30px;
            background-color: #f9fafb;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 13px;
            color: #666;
        }
        .footer p {
            margin: 8px 0;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Welcome to ContractGuard AI!</h1>
        </div>

        <div class="content">
            <p style="font-size: 18px; margin-top: 0;"><strong>${greeting},</strong></p>

            <p>Thank you for signing up for ContractGuard AI! We're excited to help you scan smart contracts for scams, honeypots, and rug pulls.</p>

            <p>To get started, please verify your email address by clicking the button below:</p>

            <div class="button-container">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:
            </p>
            <div class="link-text">
                <a href="${verificationUrl}" style="color: #3b82f6;">${verificationUrl}</a>
            </div>

            <div class="warning">
                <p><strong>⏰ This link expires in 24 hours.</strong></p>
                <p style="margin-top: 8px;">If you didn't create an account with ContractGuard AI, you can safely ignore this email.</p>
            </div>

            <p style="margin-top: 32px;">Once verified, you'll be able to:</p>
            <ul style="line-height: 1.8;">
                <li>Scan smart contracts for security vulnerabilities</li>
                <li>Get AI-powered risk assessments</li>
                <li>Detect honeypots and rug pull patterns</li>
                <li>Access detailed audit reports</li>
            </ul>
        </div>

        <div class="footer">
            <p><strong>ContractGuard AI</strong></p>
            <p>AI-Powered Smart Contract Security Scanner</p>
            <p style="margin-top: 16px;">
                Questions? Contact us at <a href="mailto:support@contractguard.ai" style="color: #3b82f6;">support@contractguard.ai</a>
            </p>
        </div>
    </div>
</body>
</html>
        `.trim();
  }
}
