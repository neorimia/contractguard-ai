import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface CancellationEmailProps {
  firstName?: string;
  tier: string;
  accessEndDate: Date;
  reactivateUrl: string;
  feedbackUrl: string;
}

export function CancellationEmail({
  firstName = "there",
  tier,
  accessEndDate,
  reactivateUrl,
  feedbackUrl,
}: CancellationEmailProps) {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const formattedDate = accessEndDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmailLayout preview="Your subscription has been cancelled successfully">
      <EmailHeader title="Subscription Cancelled" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <Text style={styles.paragraph}>
          Your ContractGuard AI {tierName} subscription has been cancelled as
          requested. We're sorry to see you go, but we understand.
        </Text>

        <InfoBox type="info">
          <Text style={styles.infoText}>
            <strong style={styles.strong}>
              Your Pro access continues until:
            </strong>
            <br />
            {formattedDate}
          </Text>
          <Text style={styles.infoText}>
            After this date, your account will return to the Free tier.
          </Text>
        </InfoBox>

        <Text style={styles.heading}>What You'll Miss</Text>
        <ul style={styles.missList}>
          <li style={styles.missItem}>
            ✗ 100 scans per day (back to 3 scans/day)
          </li>
          <li style={styles.missItem}>
            ✗ Advanced AI analysis with multi-provider fallback
          </li>
          <li style={styles.missItem}>✗ Historical contract analysis</li>
          <li style={styles.missItem}>✗ Priority support</li>
          <li style={styles.missItem}>✗ Ad-free experience</li>
        </ul>

        <Text style={styles.heading}>What You'll Keep</Text>
        <ul style={styles.keepList}>
          <li style={styles.keepItem}>✓ Access to your scan history</li>
          <li style={styles.keepItem}>✓ 3 free scans per day</li>
          <li style={styles.keepItem}>✓ Basic AI-powered analysis</li>
          <li style={styles.keepItem}>✓ Risk scoring and reports</li>
        </ul>

        <Section style={styles.reactivateBox}>
          <Text style={styles.reactivateTitle}>Changed Your Mind?</Text>
          <Text style={styles.reactivateText}>
            You can reactivate your subscription anytime! Your preferences and
            settings will be saved.
          </Text>
          <EmailButton
            href={reactivateUrl}
            text="REACTIVATE SUBSCRIPTION"
            style={{ marginTop: "16px" }}
          />
        </Section>

        <Text style={styles.heading}>We'd Love Your Feedback</Text>
        <Text style={styles.paragraph}>
          Your input helps us improve ContractGuard AI for everyone. Would you
          take 2 minutes to share why you cancelled?
        </Text>
        <Text style={styles.paragraph}>
          <Link href={feedbackUrl} style={styles.feedbackLink}>
            📝 Share Feedback (2 min survey)
          </Link>
        </Text>

        <Text style={styles.paragraph}>
          If you cancelled due to an issue we can help with, please don't
          hesitate to reach out to our support team at{" "}
          <Link href="mailto:support@contractguard.ai" style={styles.link}>
            support@contractguard.ai
          </Link>
        </Text>

        <Text style={styles.signature}>
          Thank you for using ContractGuard AI! 🙏
          <br />
          We hope to see you again soon.
          <br />
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
  missList: {
    lineHeight: "1.8",
    paddingLeft: "20px",
    margin: "0 0 24px",
    color: "rgba(255, 255, 255, 0.5)",
    listStyleType: "none",
  },
  missItem: {
    marginBottom: "8px",
    color: "rgba(255, 255, 255, 0.5)",
  },
  keepList: {
    lineHeight: "1.8",
    paddingLeft: "20px",
    margin: "0 0 24px",
    color: "rgba(16, 185, 129, 0.9)",
    listStyleType: "none",
  },
  keepItem: {
    marginBottom: "8px",
    color: "rgba(16, 185, 129, 0.9)",
  },
  infoText: {
    margin: "8px 0",
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
  },
  strong: {
    color: "#ffffff",
  },
  reactivateBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "24px",
    margin: "32px 0",
    textAlign: "center" as const,
  },
  reactivateTitle: {
    fontSize: "20px",
    fontWeight: "600" as const,
    margin: "0 0 12px",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  reactivateText: {
    fontSize: "16px",
    margin: "0",
    color: "rgba(255, 255, 255, 0.8)",
  },
  feedbackLink: {
    display: "inline-block",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "600" as const,
    fontSize: "16px",
    padding: "12px 24px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
