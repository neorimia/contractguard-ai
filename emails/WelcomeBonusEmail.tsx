import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface WelcomeBonusEmailProps {
  firstName?: string;
  referrerName: string;
  bonusScans: number;
  totalScans: number;
}

export function WelcomeBonusEmail({
  firstName = "there",
  referrerName,
  bonusScans = 3,
  totalScans = 6,
}: WelcomeBonusEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  return (
    <EmailLayout preview={`Welcome to ContractGuard AI! You've earned ${bonusScans} bonus scans`}>
      <EmailHeader title="🎁 Welcome Gift Inside!" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <Text style={styles.paragraph}>
          Welcome to ContractGuard AI! You were invited by{" "}
          <strong style={styles.strong}>{referrerName}</strong>, and we've got a
          special gift for you.
        </Text>

        <InfoBox type="success">
          <Text style={styles.bonusTitle}>
            🎉 You've Earned {bonusScans} Bonus Scans!
          </Text>
          <Text style={styles.bonusDescription}>
            Plus your 3 daily scans = {totalScans} total scans today
          </Text>
        </InfoBox>

        <Text style={styles.paragraph}>
          You're now protected against smart contract scams, honeypots, and rug
          pulls. Start scanning right away with your bonus scans!
        </Text>

        <EmailButton href={`${siteUrl}/audit`} text="SCAN YOUR FIRST CONTRACT" />

        <Text style={styles.heading}>What You Can Do</Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Scan contracts with AI-powered security analysis
          </li>
          <li style={styles.listItem}>
            Detect honeypots and rug pull patterns instantly
          </li>
          <li style={styles.listItem}>
            Get risk scores and recommendations in plain English
          </li>
          <li style={styles.listItem}>
            Share results and protect your crypto community
          </li>
        </ul>

        <Text style={styles.heading}>Get More Bonus Scans</Text>
        <Text style={styles.paragraph}>
          Love ContractGuard AI? Invite your friends and earn +5 bonus scans for
          every friend who completes their first scan!
        </Text>

        <EmailButton
          href={`${siteUrl}/audit`}
          text="VIEW YOUR REFERRAL LINK"
          variant="secondary"
        />

        <InfoBox type="info">
          <Text style={styles.infoText}>
            💡 <strong style={styles.strong}>Pro Tip:</strong> Bonus scans never
            expire and stack on top of your daily limit. Upgrade to Pro for 100
            scans per day + unlimited bonus scans!
          </Text>
          <EmailButton
            href={`${siteUrl}/pricing`}
            text="VIEW PRO BENEFITS"
            variant="secondary"
            style={{ marginTop: "16px" }}
          />
        </InfoBox>

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

        <Text style={styles.paragraph}>
          Need help getting started? Check out our{" "}
          <Link href={`${siteUrl}/faq`} style={styles.link}>
            FAQ
          </Link>{" "}
          or reply to this email.
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
  bonusTitle: {
    fontSize: "22px",
    fontWeight: "700" as const,
    margin: "0 0 8px",
    color: "#ffffff",
    textAlign: "center" as const,
  },
  bonusDescription: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.8)",
    margin: 0,
    textAlign: "center" as const,
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
