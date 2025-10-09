import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface WelcomeEmailProps {
  displayName?: string;
  scansRemaining: number;
}

export function WelcomeEmail({
  displayName = "there",
  scansRemaining = 3,
}: WelcomeEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  return (
    <EmailLayout preview="Start scanning smart contracts for scams and rug pulls">
      <EmailHeader title="🛡️ Welcome to ContractGuard AI!" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {displayName},</Text>

        <Text style={styles.paragraph}>
          Welcome to ContractGuard AI! You're now protected against smart
          contract scams, honeypots, and rug pulls. We're excited to help you
          scan contracts with confidence.
        </Text>

        <EmailButton href={siteUrl} text="START YOUR FIRST SCAN" />

        <Text style={styles.heading}>What You Can Do</Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Scan {scansRemaining} contracts per day (Free tier)
          </li>
          <li style={styles.listItem}>
            Get AI-powered risk assessments in seconds
          </li>
          <li style={styles.listItem}>
            Detect honeypots and rug pull patterns
          </li>
          <li style={styles.listItem}>Share results on social media</li>
          <li style={styles.listItem}>
            Access detailed audit reports with plain English explanations
          </li>
        </ul>

        <Text style={styles.heading}>How It Works</Text>
        <div style={styles.stepContainer}>
          <Text style={styles.step}>
            1. Paste any contract address (Ethereum, Polygon, or Base)
          </Text>
          <Text style={styles.step}>2. Click "Scan Contract"</Text>
          <Text style={styles.step}>
            3. Get instant AI-powered security analysis
          </Text>
          <Text style={styles.step}>
            4. Make informed decisions about your investments
          </Text>
        </div>

        <InfoBox type="info">
          <Text style={styles.infoText}>
            💡 <strong style={styles.strong}>Pro Tip:</strong> Upgrade to Pro
            for 100 scans per day, advanced features, and priority support—all
            for just $29/month.
          </Text>
          <EmailButton
            href={`${siteUrl}/pricing`}
            text="UPGRADE TO PRO"
            variant="secondary"
            style={{ marginTop: "16px" }}
          />
        </InfoBox>

        <Text style={styles.paragraph}>
          Need help getting started? Check out our{" "}
          <Link href={`${siteUrl}/faq`} style={styles.link}>
            FAQ
          </Link>{" "}
          or contact us anytime.
        </Text>

        <Text style={styles.signature}>
          Stay safe in crypto,
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
  stepContainer: {
    margin: "0 0 24px",
  },
  step: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.8)",
    margin: "0 0 12px",
    paddingLeft: "4px",
  },
  infoText: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
  },
  strong: {
    color: "#ffffff",
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
