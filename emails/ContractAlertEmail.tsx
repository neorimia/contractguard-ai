import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";
import { EmailButton } from "./components/EmailButton";
import { EmailFooter } from "./components/EmailFooter";
import { InfoBox } from "./components/InfoBox";

interface ContractAlertEmailProps {
  userName?: string;
  contractNickname?: string;
  contractAddress: string;
  chain: string;
  alertType:
    | "risk_increase"
    | "new_flags"
    | "liquidity_change"
    | "holder_change";
  severity: "low" | "medium" | "high" | "critical";
  previousRiskScore?: number;
  currentRiskScore?: number;
  riskScoreChange?: number;
  newFlags?: Array<{ title: string; description: string }>;
  liquidityChange?: {
    previous: number;
    current: number;
    percentage: number;
  };
  holderChange?: {
    previous: number;
    current: number;
    percentage: number;
  };
  viewContractUrl: string;
  manageAlertsUrl: string;
  unsubscribeUrl: string;
}

export function ContractAlertEmail({
  userName,
  contractNickname,
  contractAddress,
  chain,
  alertType,
  severity,
  previousRiskScore,
  currentRiskScore,
  riskScoreChange,
  newFlags,
  liquidityChange,
  holderChange,
  viewContractUrl,
  manageAlertsUrl,
  unsubscribeUrl,
}: ContractAlertEmailProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444",
      critical: "#dc2626",
    };
    return colors[severity as keyof typeof colors] || "#6b7280";
  };

  const getAlertIcon = (alertType: string) => {
    const icons = {
      risk_increase: "📈",
      new_flags: "🚩",
      liquidity_change: "💧",
      holder_change: "👥",
    };
    return icons[alertType as keyof typeof icons] || "⚠️";
  };

  const getAlertTitle = (alertType: string) => {
    const titles = {
      risk_increase: "Risk Score Increased",
      new_flags: "New Security Flags Detected",
      liquidity_change: "Liquidity Changed",
      holder_change: "Holder Count Changed",
    };
    return titles[alertType as keyof typeof titles] || "Contract Alert";
  };

  const renderAlertDetails = () => {
    switch (alertType) {
      case "risk_increase":
        return (
          <InfoBox type="error">
            <Text style={styles.alertTitle}>
              {getAlertIcon(alertType)} Risk Score Increased
            </Text>
            <Text style={styles.alertValue}>
              <strong>{previousRiskScore}</strong> →{" "}
              <strong>{currentRiskScore}</strong>
              {riskScoreChange && (
                <span style={styles.changeIndicator}>
                  (+{Math.abs(riskScoreChange).toFixed(1)}%)
                </span>
              )}
            </Text>
          </InfoBox>
        );

      case "new_flags":
        return (
          <InfoBox type="warning">
            <Text style={styles.alertTitle}>
              {getAlertIcon(alertType)} New Security Flags Detected
            </Text>
            <ul style={styles.flagsList}>
              {newFlags?.map((flag, index) => (
                <li key={index} style={styles.flagItem}>
                  <strong>{flag.title}:</strong> {flag.description}
                </li>
              ))}
            </ul>
          </InfoBox>
        );

      case "liquidity_change":
        return (
          <InfoBox type="info">
            <Text style={styles.alertTitle}>
              {getAlertIcon(alertType)} Liquidity Changed
            </Text>
            <Text style={styles.alertValue}>
              <strong>${liquidityChange?.previous?.toLocaleString()}</strong> →{" "}
              <strong>${liquidityChange?.current?.toLocaleString()}</strong>
              {liquidityChange?.percentage && (
                <span style={styles.changeIndicator}>
                  ({liquidityChange.percentage.toFixed(1)}%)
                </span>
              )}
            </Text>
          </InfoBox>
        );

      case "holder_change":
        return (
          <InfoBox type="info">
            <Text style={styles.alertTitle}>
              {getAlertIcon(alertType)} Holder Count Changed
            </Text>
            <Text style={styles.alertValue}>
              <strong>{holderChange?.previous?.toLocaleString()}</strong> →{" "}
              <strong>{holderChange?.current?.toLocaleString()}</strong>
              {holderChange?.percentage && (
                <span style={styles.changeIndicator}>
                  ({holderChange.percentage.toFixed(1)}%)
                </span>
              )}
            </Text>
          </InfoBox>
        );

      default:
        return null;
    }
  };

  return (
    <EmailLayout preview="Contract alert from your watchlist">
      <EmailHeader title={getAlertTitle(alertType)} />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Hi {userName || "there"},</Text>

        <Text style={styles.paragraph}>
          We've detected changes to a contract on your watchlist that may
          require your attention.
        </Text>

        <Section style={styles.contractInfo}>
          <Text style={styles.contractName}>
            {contractNickname || "Contract"}
          </Text>
          <Text style={styles.contractAddress}>{contractAddress}</Text>
          <Text style={styles.chainInfo}>Chain: {chain}</Text>
        </Section>

        {renderAlertDetails()}

        <Text style={styles.heading}>What should you do?</Text>
        <Text style={styles.paragraph}>
          Review the contract details and assess whether any action is needed
          based on the changes detected.
        </Text>

        <Section style={styles.buttonContainer}>
          <EmailButton
            href={viewContractUrl}
            text="VIEW CONTRACT DETAILS"
            style={{ backgroundColor: getSeverityColor(severity) }}
          />
          <EmailButton
            href={manageAlertsUrl}
            text="MANAGE ALERTS"
            variant="secondary"
          />
        </Section>

        <Text style={styles.signature}>
          Stay vigilant in crypto,
          <br />
          The ContractGuard AI Team
          <br />
          <Link href={siteUrl} style={styles.siteLink}>
            {siteUrl.replace("https://", "").replace("http://", "")}
          </Link>
        </Text>
      </Section>

      <EmailFooter />

      <Section style={styles.unsubscribeSection}>
        <Text style={styles.footerText}>
          <Link href={unsubscribeUrl} style={styles.unsubscribeLink}>
            Unsubscribe from this watchlist
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
  contractInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "20px",
    margin: "24px 0",
  },
  contractName: {
    fontSize: "18px",
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
  chainInfo: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.6)",
    margin: 0,
  },
  alertTitle: {
    fontSize: "16px",
    fontWeight: "600" as const,
    margin: "0 0 12px",
    color: "#ffffff",
  },
  alertValue: {
    fontSize: "16px",
    color: "rgba(255, 255, 255, 0.9)",
    margin: 0,
  },
  changeIndicator: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "14px",
    marginLeft: "8px",
  },
  flagsList: {
    margin: "12px 0 0 0",
    paddingLeft: "20px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  flagItem: {
    marginBottom: "8px",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  signature: {
    marginTop: "40px",
    fontSize: "16px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic" as const,
  },
  unsubscribeSection: {
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
  unsubscribeLink: {
    color: "rgba(255, 255, 255, 0.5)",
    textDecoration: "underline",
  },
  siteLink: {
    color: "rgba(255, 255, 255, 0.5)",
    textDecoration: "underline",
  },
};
