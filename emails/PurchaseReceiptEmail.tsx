import { Text, Section, Link, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";

interface PurchaseReceiptEmailProps {
  firstName?: string;
  amount: number;
  credits: number;
  purchaseId: string;
  purchaseType: "instant_credits" | "pro_subscription" | "team_subscription";
  receiptUrl?: string;
  isGuest?: boolean;
}

export function PurchaseReceiptEmail({
  firstName = "there",
  amount,
  credits,
  purchaseId,
  purchaseType,
  receiptUrl,
  isGuest = false,
}: PurchaseReceiptEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getPurchaseTypeLabel = () => {
    switch (purchaseType) {
      case "instant_credits":
        return "Instant Credits";
      case "pro_subscription":
        return "Pro Subscription";
      case "team_subscription":
        return "Team Subscription";
      default:
        return "Purchase";
    }
  };

  const getPurchaseDescription = () => {
    switch (purchaseType) {
      case "instant_credits":
        return `${credits} instant scan${credits > 1 ? "s" : ""}`;
      case "pro_subscription":
        return "Pro subscription (100 scans/day)";
      case "team_subscription":
        return "Team subscription (unlimited scans)";
      default:
        return "Purchase";
    }
  };

  return (
    <EmailLayout preview="Your purchase receipt - ContractGuard AI">
      <EmailHeader title="✅ Purchase Receipt" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <Text style={styles.paragraph}>
          Thank you for your purchase! Your{" "}
          {getPurchaseTypeLabel().toLowerCase()} has been successfully processed
          and your account has been updated.
        </Text>

        <Section style={styles.receiptBox}>
          <Text style={styles.receiptTitle}>Purchase Details</Text>
          <Hr style={styles.divider} />
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.labelCell}>Amount Paid:</td>
                <td style={styles.valueCell}>{formattedAmount}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Item:</td>
                <td style={styles.valueCell}>{getPurchaseDescription()}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Purchase ID:</td>
                <td style={styles.valueCell}>{purchaseId}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Date:</td>
                <td style={styles.valueCell}>{formattedDate}</td>
              </tr>
              <tr>
                <td style={styles.labelCell}>Status:</td>
                <td style={styles.valueCell}>✅ Completed</td>
              </tr>
            </tbody>
          </table>
          <Hr style={styles.divider} />
          {receiptUrl && (
            <Link href={receiptUrl} style={styles.receiptLink}>
              📄 Download Receipt
            </Link>
          )}
        </Section>

        {purchaseType === "instant_credits" && (
          <>
            <Text style={styles.heading}>Your Credits Are Ready!</Text>
            <Text style={styles.paragraph}>
              You now have{" "}
              <strong>
                {credits} instant scan{credits > 1 ? "s" : ""}
              </strong>{" "}
              available in your account. These credits can be used to scan any
              smart contract instantly without waiting in queue.
            </Text>
          </>
        )}

        {(purchaseType === "pro_subscription" ||
          purchaseType === "team_subscription") && (
          <>
            <Text style={styles.heading}>Your Subscription is Active!</Text>
            <Text style={styles.paragraph}>
              Your {getPurchaseTypeLabel().toLowerCase()} is now active and you
              have access to:
            </Text>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                {purchaseType === "pro_subscription"
                  ? "100 scans per day"
                  : "Unlimited scans"}
              </li>
              <li style={styles.listItem}>
                Advanced AI analysis with multi-provider fallback
              </li>
              <li style={styles.listItem}>Historical contract analysis</li>
              <li style={styles.listItem}>Priority support</li>
              <li style={styles.listItem}>Ad-free experience</li>
              {purchaseType === "team_subscription" && (
                <li style={styles.listItem}>Team collaboration features</li>
              )}
            </ul>
          </>
        )}

        <EmailButton href={`${siteUrl}/scan`} text="START SCANNING CONTRACTS" />

        {isGuest && (
          <Section style={styles.guestBox}>
            <Text style={styles.guestTitle}>💡 Create Your Account</Text>
            <Text style={styles.guestText}>
              You're currently using ContractGuard AI as a guest. Create a free
              account to:
            </Text>
            <ul style={styles.guestList}>
              <li style={styles.guestListItem}>Save your scan history</li>
              <li style={styles.guestListItem}>Get unlimited free scans</li>
              <li style={styles.guestListItem}>Access advanced features</li>
              <li style={styles.guestListItem}>Receive email notifications</li>
            </ul>
            <EmailButton
              href={`${siteUrl}/auth/signup`}
              text="CREATE FREE ACCOUNT"
              variant="secondary"
            />
          </Section>
        )}

        <Text style={styles.paragraph}>
          If you have any questions about your purchase, feel free to reach out
          to our support team at{" "}
          <Link href="mailto:support@contractguard.ai" style={styles.link}>
            support@contractguard.ai
          </Link>
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
  receiptBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "24px",
    margin: "24px 0",
  },
  receiptTitle: {
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
  guestBox: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "12px",
    padding: "24px",
    margin: "32px 0",
  },
  guestTitle: {
    fontSize: "16px",
    fontWeight: "600" as const,
    margin: "0 0 12px",
    color: "#ffffff",
  },
  guestText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.8)",
    margin: "0 0 16px",
  },
  guestList: {
    lineHeight: "1.8",
    paddingLeft: "20px",
    margin: "0 0 20px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  guestListItem: {
    marginBottom: "6px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  signature: {
    marginTop: "40px",
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic" as const,
  },
};
