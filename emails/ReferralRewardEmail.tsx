import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface ReferralRewardEmailProps {
  firstName?: string;
  referredUserName: string;
  rewardType: "scans" | "trial" | "credit" | "pro_month";
  rewardAmount: number;
  newBonusScansBalance?: number;
  referralLink?: string;
}

export function ReferralRewardEmail({
  firstName = "there",
  referredUserName,
  rewardType,
  rewardAmount,
  newBonusScansBalance,
  referralLink,
}: ReferralRewardEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  const rewardMessages = {
    scans: {
      title: `+${rewardAmount} Bonus Scans!`,
      description: `You've earned ${rewardAmount} bonus scans because ${referredUserName} completed their first contract scan!`,
      icon: "🎁",
    },
    trial: {
      title: `${rewardAmount}-Day Pro Trial!`,
      description: `You've earned ${rewardAmount} days of Pro access because ${referredUserName} upgraded to Pro!`,
      icon: "⭐",
    },
    credit: {
      title: `$${(rewardAmount / 100).toFixed(2)} Account Credit!`,
      description: `You've earned $${(rewardAmount / 100).toFixed(2)} in account credit because ${referredUserName} became a paying customer!`,
      icon: "💰",
    },
    pro_month: {
      title: "Free Month of Pro!",
      description: `You've earned a free month of Pro because ${referredUserName} subscribed to Pro!`,
      icon: "🚀",
    },
  };

  const reward = rewardMessages[rewardType];

  return (
    <EmailLayout preview={`You've earned a referral reward: ${reward.title}`}>
      <EmailHeader title={`${reward.icon} Referral Reward Unlocked!`} />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {firstName},</Text>

        <InfoBox type="success">
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          <Text style={styles.rewardDescription}>{reward.description}</Text>
        </InfoBox>

        {rewardType === "scans" && newBonusScansBalance !== undefined && (
          <Text style={styles.paragraph}>
            Your new bonus scans balance: <strong style={styles.strong}>{newBonusScansBalance} scans</strong>
          </Text>
        )}

        <Text style={styles.paragraph}>
          Keep sharing your referral link to earn even more rewards! For every
          friend who signs up and completes a scan, you'll earn +5 bonus scans.
        </Text>

        <EmailButton href={`${siteUrl}/audit`} text="START SCANNING NOW" />

        {referralLink && (
          <>
            <Text style={styles.heading}>Your Referral Link</Text>
            <div style={styles.linkBox}>
              <Text style={styles.linkText}>{referralLink}</Text>
            </div>
            <Text style={styles.paragraph}>
              Share this link with friends and earn rewards when they sign up
              and use ContractGuard AI!
            </Text>
          </>
        )}

        <Text style={styles.heading}>How Referral Rewards Work</Text>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <strong style={styles.strong}>Friend signs up:</strong> They get +3
            bonus scans
          </li>
          <li style={styles.listItem}>
            <strong style={styles.strong}>Friend completes first scan:</strong>{" "}
            You get +5 bonus scans
          </li>
          <li style={styles.listItem}>
            <strong style={styles.strong}>Friend upgrades to Pro:</strong> You
            get special rewards!
          </li>
        </ul>

        <InfoBox type="info">
          <Text style={styles.infoText}>
            💡 <strong style={styles.strong}>Pro Tip:</strong> Bonus scans
            never expire and can be used in addition to your daily scan limit!
          </Text>
        </InfoBox>

        <Text style={styles.paragraph}>
          Questions about referral rewards? Check out our{" "}
          <Link href={`${siteUrl}/faq`} style={styles.link}>
            FAQ
          </Link>{" "}
          or reply to this email.
        </Text>

        <Text style={styles.signature}>
          Keep earning,
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
  rewardTitle: {
    fontSize: "24px",
    fontWeight: "700" as const,
    margin: "0 0 12px",
    color: "#ffffff",
    textAlign: "center" as const,
  },
  rewardDescription: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.9)",
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
    marginBottom: "12px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  linkBox: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    padding: "16px",
    margin: "0 0 16px",
    wordBreak: "break-all" as const,
  },
  linkText: {
    fontSize: "14px",
    color: "#ffffff",
    margin: 0,
    fontFamily: "monospace",
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
