import { Text, Section, Link, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface Contract {
  address: string;
  nickname?: string;
  status: "safe" | "caution" | "danger";
  currentRiskScore: number;
  riskScoreChange: number;
  newFlagsCount: number;
}

interface WeeklyDigestEmailProps {
  userName?: string;
  weekStart: Date;
  weekEnd: Date;
  contracts: Contract[];
  totalAlerts: number;
  criticalAlerts: number;
  viewDashboardUrl: string;
  manageAlertsUrl: string;
}

export function WeeklyDigestEmail({
  userName,
  weekStart,
  weekEnd,
  contracts,
  totalAlerts,
  criticalAlerts,
  viewDashboardUrl,
  manageAlertsUrl,
}: WeeklyDigestEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  const getStatusIcon = (status: string) => {
    const icons = {
      safe: "✅",
      caution: "⚠️",
      danger: "🚨",
    };
    return icons[status as keyof typeof icons] || "❓";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatContractAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <EmailLayout preview="Your weekly watchlist summary">
      <EmailHeader title="📊 Weekly Watchlist Report" />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {userName || "there"},</Text>

        <Text style={styles.paragraph}>
          Here's your weekly summary for {formatDate(weekStart)} -{" "}
          {formatDate(weekEnd)}:
        </Text>

        <Section style={styles.statsContainer}>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <Text style={styles.statNumber}>{contracts.length}</Text>
              <Text style={styles.statLabel}>Contracts</Text>
            </div>
            <div style={styles.statItem}>
              <Text style={styles.statNumber}>{totalAlerts}</Text>
              <Text style={styles.statLabel}>Total Alerts</Text>
            </div>
            <div style={styles.statItem}>
              <Text style={styles.statNumber}>{criticalAlerts}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </div>
          </div>
        </Section>

        <Text style={styles.heading}>Your Watched Contracts</Text>

        {contracts.map((contract, index) => (
          <InfoBox
            key={index}
            type={
              contract.status === "danger"
                ? "error"
                : contract.status === "caution"
                  ? "warning"
                  : "success"
            }
          >
            <Text style={styles.contractTitle}>
              {getStatusIcon(contract.status)}{" "}
              {contract.nickname || formatContractAddress(contract.address)}
            </Text>
            <Text style={styles.contractAddress}>{contract.address}</Text>
            <Text style={styles.contractDetails}>
              Risk Score: <strong>{contract.currentRiskScore}</strong>
              {contract.riskScoreChange !== 0 && (
                <span style={styles.changeIndicator}>
                  ({contract.riskScoreChange > 0 ? "+" : ""}
                  {contract.riskScoreChange})
                </span>
              )}
            </Text>
            {contract.newFlagsCount > 0 && (
              <Text style={styles.newFlags}>
                🚩 {contract.newFlagsCount} new flag
                {contract.newFlagsCount > 1 ? "s" : ""}
              </Text>
            )}
          </InfoBox>
        ))}

        <EmailButton href={viewDashboardUrl} text="VIEW FULL DASHBOARD" />

        <Text style={styles.signature}>
          Stay informed in crypto,
          <br />
          The ContractGuard AI Team
          <br />
          <Link href={siteUrl} style={styles.siteLink}>
            {siteUrl.replace("https://", "").replace("http://", "")}
          </Link>
        </Text>
      </Section>

      <EmailFooter />

      <Section style={styles.manageAlertsSection}>
        <Text style={styles.footerText}>
          <Link href={manageAlertsUrl} style={styles.manageAlertsLink}>
            Manage your alert preferences
          </Link>
        </Text>
      </Section>
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
  statsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "24px",
    margin: "24px 0",
  },
  statsGrid: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    textAlign: "center" as const,
  },
  statNumber: {
    fontSize: "32px",
    fontWeight: "700" as const,
    color: "#3b82f6",
    margin: "0 0 4px",
  },
  statLabel: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.6)",
    margin: 0,
  },
  contractTitle: {
    fontSize: "16px",
    fontWeight: "600" as const,
    margin: "0 0 8px",
    color: "#ffffff",
  },
  contractAddress: {
    fontFamily: "monospace",
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.6)",
    wordBreak: "break-all" as const,
    margin: "0 0 8px",
  },
  contractDetails: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.8)",
    margin: "0 0 4px",
  },
  changeIndicator: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "13px",
    marginLeft: "4px",
  },
  newFlags: {
    fontSize: "14px",
    color: "#ef4444",
    margin: "4px 0 0",
    fontWeight: "600" as const,
  },
  signature: {
    marginTop: "40px",
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic" as const,
  },
  siteLink: {
    color: "rgba(255, 255, 255, 0.5)",
    textDecoration: "underline",
  },
  manageAlertsSection: {
    padding: "20px 30px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    textAlign: "center" as const,
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  footerText: {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center" as const,
    margin: 0,
  },
  manageAlertsLink: {
    color: "rgba(255, 255, 255, 0.5)",
    textDecoration: "underline",
  },
};
