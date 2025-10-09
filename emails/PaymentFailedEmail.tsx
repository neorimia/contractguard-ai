import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface PaymentFailedEmailProps {
  firstName?: string;
  amount: number;
  failureReason: string;
  nextAttemptDate: Date;
  updatePaymentUrl: string;
}

export function PaymentFailedEmail({
  firstName = "there",
  amount,
  failureReason,
  nextAttemptDate,
  updatePaymentUrl,
}: PaymentFailedEmailProps) {
  const formattedAmount = `$${amount.toFixed(2)}`;
  const formattedDate = nextAttemptDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmailLayout preview="Update your payment method to continue your subscription">
      <EmailHeader title="⚠️ Payment Failed" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <Text style={styles.paragraph}>
          We weren't able to process your payment for your ContractGuard AI Pro
          subscription.
        </Text>

        <InfoBox type="warning">
          <Text style={styles.warningText}>
            <strong style={styles.warningStrong}>⏰ Action Required</strong>
          </Text>
          <Text style={styles.warningText}>
            Your subscription will be downgraded to the Free tier in 3 days if
            payment is not updated.
          </Text>
        </InfoBox>

        <EmailButton href={updatePaymentUrl} text="UPDATE PAYMENT METHOD" />

        <Text style={styles.heading}>Failed Payment Details</Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <strong style={styles.strong}>Amount:</strong> {formattedAmount}
          </li>
          <li style={styles.listItem}>
            <strong style={styles.strong}>Reason:</strong> {failureReason}
          </li>
          <li style={styles.listItem}>
            <strong style={styles.strong}>Next Retry:</strong> {formattedDate}
          </li>
        </ul>

        <Text style={styles.heading}>What Happens Next</Text>
        <ol style={styles.orderedList}>
          <li style={styles.listItem}>
            We'll automatically retry the payment in 2 days
          </li>
          <li style={styles.listItem}>
            If unsuccessful, your Pro subscription will be cancelled
          </li>
          <li style={styles.listItem}>
            You'll be downgraded to the Free tier (3 scans/day)
          </li>
          <li style={styles.listItem}>
            You can reactivate anytime by updating your payment method
          </li>
        </ol>

        <Section style={styles.helpBox}>
          <Text style={styles.helpTitle}>Common Solutions</Text>
          <ul style={styles.helpList}>
            <li style={styles.listItem}>
              Check your card has sufficient funds
            </li>
            <li style={styles.listItem}>Verify your card hasn't expired</li>
            <li style={styles.listItem}>
              Contact your bank to authorize the charge
            </li>
            <li style={styles.listItem}>Try a different payment method</li>
          </ul>
        </Section>

        <Text style={styles.paragraph}>
          <strong style={styles.strong}>Need Help?</strong>
          <br />
          Contact our support team at{" "}
          <Link href="mailto:support@contractguard.ai" style={styles.link}>
            support@contractguard.ai
          </Link>
          <br />
          We're here to help resolve any payment issues.
        </Text>

        <Text style={styles.signature}>
          Thank you for your prompt attention,
          <br />
          The ContractGuard AI Team
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}

const styles = {
  content: {
    padding: "40px 30px",
  },
  greeting: {
    fontSize: "20px",
    fontWeight: "600" as const,
    margin: "0 0 24px",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.8)",
    margin: "0 0 20px",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "600" as const,
    margin: "32px 0 16px",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  list: {
    lineHeight: "1.8",
    paddingLeft: "20px",
    margin: "0 0 24px",
    color: "rgba(255, 255, 255, 0.8)",
    listStyleType: "none",
  },
  listItem: {
    marginBottom: "8px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  orderedList: {
    lineHeight: "1.8",
    paddingLeft: "20px",
    margin: "0 0 24px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  warningText: {
    margin: "8px 0",
    fontSize: "15px",
    color: "rgba(245, 158, 11, 0.9)",
    lineHeight: "1.6",
  },
  warningStrong: {
    color: "rgba(245, 158, 11, 1)",
  },
  strong: {
    color: "#ffffff",
  },
  helpBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    padding: "20px",
    margin: "24px 0",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  helpTitle: {
    fontSize: "16px",
    fontWeight: "600" as const,
    margin: "0 0 12px",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  helpList: {
    lineHeight: "1.8",
    paddingLeft: "20px",
    margin: "0",
    color: "rgba(255, 255, 255, 0.8)",
  },
  link: {
    color: "#ffffff",
    textDecoration: "underline",
  },
  signature: {
    marginTop: "40px",
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic" as const,
  },
};
