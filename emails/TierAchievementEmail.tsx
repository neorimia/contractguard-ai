import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface TierAchievementEmailProps {
  firstName?: string;
  tier: string;
  tierBadge: string;
  referralCount: number;
  rewardDescription: string;
  perks: string[];
  dashboardUrl: string;
  nextTierName?: string;
  nextTierReferrals?: number;
}

export const TierAchievementEmail = ({
  firstName = "there",
  tier = "Bronze",
  tierBadge = "🥉",
  referralCount = 3,
  rewardDescription = "1 week Pro trial",
  perks = ["1 week Pro trial", "Priority support", "Bronze badge"],
  dashboardUrl = "https://contractguard.ai/account",
  nextTierName,
  nextTierReferrals,
}: TierAchievementEmailProps) => {
  const previewText = `🎉 Congratulations! You've reached ${tier} tier with ${referralCount} referrals!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>🎉 Tier Achievement Unlocked!</Heading>
          </Section>

          {/* Tier Badge */}
          <Section style={badgeSection}>
            <div style={badgeCircle}>{tierBadge}</div>
            <Heading style={tierHeading}>{tier} Tier</Heading>
            <Text style={tierSubtext}>
              {referralCount} successful referral
              {referralCount !== 1 ? "s" : ""}
            </Text>
          </Section>

          {/* Congratulations */}
          <Section style={content}>
            <Text style={paragraph}>Hey {firstName}! 👋</Text>
            <Text style={paragraph}>
              <strong>Amazing work!</strong> You've just unlocked the{" "}
              {tierBadge} <strong>{tier}</strong> tier by successfully referring{" "}
              <strong>{referralCount}</strong> users to ContractGuard AI.
            </Text>
          </Section>

          {/* Reward */}
          <Section style={rewardBox}>
            <Text style={rewardTitle}>🎁 Your Reward</Text>
            <Text style={rewardText}>{rewardDescription}</Text>
            <Text style={rewardSubtext}>
              Your reward has been automatically applied to your account!
            </Text>
          </Section>

          {/* Perks */}
          <Section style={perksSection}>
            <Text style={perksTitle}>✨ {tier} Tier Perks</Text>
            {perks.map((perk, index) => (
              <div key={index} style={perkItem}>
                <span style={perkBullet}>•</span> {perk}
              </div>
            ))}
          </Section>

          {/* Next Tier */}
          {nextTierName && nextTierReferrals && (
            <Section style={nextTierSection}>
              <Text style={nextTierTitle}>🎯 Next Up: {nextTierName}</Text>
              <Text style={nextTierText}>
                Refer {nextTierReferrals - referralCount} more user
                {nextTierReferrals - referralCount !== 1 ? "s" : ""} to unlock{" "}
                {nextTierName} tier and even better rewards!
              </Text>
            </Section>
          )}

          {/* CTA */}
          <Section style={buttonContainer}>
            <Link style={button} href={dashboardUrl}>
              View Your Dashboard
            </Link>
          </Section>

          {/* Share Reminder */}
          <Section style={shareSection}>
            <Text style={shareTitle}>Keep the Momentum Going! 🚀</Text>
            <Text style={shareText}>
              Share your referral link with friends and crypto enthusiasts to
              climb even higher. Every referral brings you closer to exclusive
              rewards!
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Reply to this email or visit our{" "}
              <Link href="https://contractguard.ai/support" style={link}>
                support page
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © 2025 ContractGuard AI. Built to protect crypto users from
              scams.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TierAchievementEmail;

// Styles
const main = {
  backgroundColor: "#0f172a",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0",
};

const badgeSection = {
  textAlign: "center" as const,
  padding: "32px 0",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: "16px",
  marginBottom: "32px",
};

const badgeCircle = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "64px",
  margin: "0 auto 16px",
};

const tierHeading = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "8px 0",
};

const tierSubtext = {
  fontSize: "16px",
  color: "rgba(255, 255, 255, 0.8)",
  margin: "0",
};

const content = {
  marginBottom: "32px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#cbd5e1",
  margin: "16px 0",
};

const rewardBox = {
  backgroundColor: "#1e293b",
  border: "2px solid #a855f7",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  marginBottom: "32px",
};

const rewardTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0 0 8px",
};

const rewardText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#a855f7",
  margin: "8px 0",
};

const rewardSubtext = {
  fontSize: "14px",
  color: "#94a3b8",
  margin: "8px 0 0",
};

const perksSection = {
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "32px",
};

const perksTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0 0 16px",
};

const perkItem = {
  fontSize: "16px",
  color: "#cbd5e1",
  marginBottom: "12px",
  paddingLeft: "8px",
};

const perkBullet = {
  color: "#a855f7",
  fontWeight: "bold",
  marginRight: "8px",
};

const nextTierSection = {
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "32px",
  border: "1px solid #334155",
};

const nextTierTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0 0 8px",
};

const nextTierText = {
  fontSize: "16px",
  color: "#cbd5e1",
  margin: "8px 0 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#a855f7",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const shareSection = {
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "32px",
  textAlign: "center" as const,
};

const shareTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0 0 12px",
};

const shareText = {
  fontSize: "14px",
  color: "#cbd5e1",
  margin: "0",
  lineHeight: "20px",
};

const divider = {
  borderColor: "#334155",
  margin: "32px 0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#64748b",
  margin: "8px 0",
};

const link = {
  color: "#a855f7",
  textDecoration: "underline",
};
