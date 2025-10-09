import { Text, Section, Link, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";

interface PaymentConfirmationEmailProps {
  firstName?: string;
  amount: number;
  invoiceId: string;
  tier: string;
  nextPaymentDate: Date;
  receiptUrl: string;
}

export function PaymentConfirmationEmail({
  firstName = "there",
  amount,
  invoiceId,
  tier,
  nextPaymentDate,
  receiptUrl,
}: PaymentConfirmationEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const formattedAmount = `$${amount.toFixed(2)}`;
  const formattedDate = nextPaymentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmailLayout preview="Your Pro subscription is now active">
      <EmailHeader title="✅ Payment Confirmed!" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <Text style={styles.paragraph}>
          Thank you for upgrading to {tierName}! Your payment has been
          successfully processed, and your account has been upgraded.
        </Text>

        <Section style={styles.invoiceBox}>
          <Text style={styles.invoiceTitle}>Invoice Details</Text>
          <Hr style={styles.divider} />
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.labelCell}>Amount Paid:</td>
                <td style={styles.valueCell}>{formattedAmount}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Plan:</td>
                <td style={styles.valueCell}>
                  {tierName} ({tier === "pro" ? "100" : "Unlimited"} scans/day)
                </td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Billing Cycle:</td>
                <td style={styles.valueCell}>Monthly</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Invoice ID:</td>
                <td style={styles.valueCell}>{invoiceId}</td>
              </tr>
            </tbody>
          </table>
          <Hr style={styles.divider} />
          <Link href={receiptUrl} style={styles.receiptLink}>
            📄 Download Receipt
          </Link>
        </Section>

        <EmailButton
          href={`${siteUrl}/account`}
          text="ACCESS YOUR PRO DASHBOARD"
        />

        <Text style={styles.heading}>Your {tierName} Features</Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            {tier === "pro" ? "100 scans per day" : "Unlimited scans"}
          </li>
          <li style={styles.listItem}>
            Advanced AI analysis with multi-provider fallback
          </li>
          <li style={styles.listItem}>Historical contract analysis</li>
          <li style={styles.listItem}>Priority support</li>
          <li style={styles.listItem}>Ad-free experience</li>
          {tier === "enterprise" && <li style={styles.listItem}>API access</li>}
          {tier === "enterprise" && (
            <li style={styles.listItem}>White-label option</li>
          )}
        </ul>

        <Text style={styles.paragraph}>
          <strong>Next Payment:</strong> {formattedDate}
          <br />
          <Link href={`${siteUrl}/account#billing`} style={styles.link}>
            Manage your subscription
          </Link>
        </Text>

        <Text style={styles.paragraph}>
          If you have any questions about your subscription, feel free to reach
          out to our support team.
        </Text>

        <Text style={styles.signature}>
          Thank you for supporting ContractGuard AI!
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
  },
  listItem: {
    marginBottom: "8px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  invoiceBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "24px",
    margin: "24px 0",
  },
  invoiceTitle: {
    fontSize: "18px",
    fontWeight: "600" as const,
    margin: "0 0 16px",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    margin: "16px 0",
  },
  table: {
    width: "100%",
    fontSize: "15px",
  },
  labelCell: {
    padding: "8px 0",
    color: "rgba(255, 255, 255, 0.6)",
  },
  valueCell: {
    padding: "8px 0",
    textAlign: "right" as const,
    fontWeight: "600" as const,
    color: "#ffffff",
  },
  receiptLink: {
    display: "inline-block",
    marginTop: "16px",
    color: "#ffffff",
    textDecoration: "underline",
    fontWeight: "600" as const,
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
