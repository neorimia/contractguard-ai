import { Text, Section, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";
import { EmailHeader } from "./components/EmailHeader";

interface FeedbackNotificationEmailProps {
  reason: string;
  feedback: string;
  rating?: number;
  userEmail?: string;
  timestamp: string;
}

export function FeedbackNotificationEmail({
  reason,
  feedback,
  rating,
  userEmail,
  timestamp,
}: FeedbackNotificationEmailProps) {
  const getReasonEmoji = () => {
    switch (reason) {
      case "cancellation":
        return "😢";
      case "feature":
        return "💡";
      case "bug":
        return "🐛";
      default:
        return "💬";
    }
  };

  const getRatingStars = () => {
    if (!rating) return null;
    return "⭐".repeat(rating);
  };

  return (
    <EmailLayout preview={`New ${reason} feedback received`}>
      <EmailHeader title={`${getReasonEmoji()} New Feedback Received`} />

      <Section style={styles.content}>
        <Text style={styles.greeting}>Team,</Text>

        <Text style={styles.paragraph}>
          A new feedback submission has been received.
        </Text>

        {/* Feedback Details Box */}
        <Section style={styles.detailsBox}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.labelCell}>Type:</td>
                <td style={styles.valueCell}>
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </td>
              </tr>
              {rating && (
                <tr>
                  <td style={styles.labelCell}>Rating:</td>
                  <td style={styles.valueCell}>
                    {getRatingStars()} ({rating}/5)
                  </td>
                </tr>
              )}
              {userEmail && (
                <tr>
                  <td style={styles.labelCell}>From:</td>
                  <td style={styles.valueCell}>{userEmail}</td>
                </tr>
              )}
              <tr>
                <td style={styles.labelCell}>Time:</td>
                <td style={styles.valueCell}>
                  {new Date(timestamp).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Hr style={styles.divider} />

        <Text style={styles.heading}>Feedback Message</Text>
        <Section style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Section>

        <Hr style={styles.divider} />

        <Text style={styles.note}>
          This feedback has been automatically stored in your database.
        </Text>
      </Section>

      <Section style={styles.footer}>
        <Text style={styles.footerText}>ContractGuard AI</Text>
        <Text style={styles.footerSubtext}>
          Automated Feedback Notification
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
    margin: "24px 0 16px",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  detailsBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "24px",
    margin: "24px 0",
  },
  table: {
    width: "100%",
    fontSize: "15px",
  },
  labelCell: {
    padding: "8px 0",
    color: "rgba(255, 255, 255, 0.6)",
    width: "30%",
  },
  valueCell: {
    padding: "8px 0",
    fontWeight: "600" as const,
    color: "#ffffff",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    margin: "24px 0",
  },
  feedbackBox: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "12px",
    padding: "20px",
    margin: "16px 0",
  },
  feedbackText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.9)",
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  note: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.5)",
    margin: "24px 0 0",
    fontStyle: "italic" as const,
  },
  footer: {
    padding: "30px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    textAlign: "center" as const,
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  footerText: {
    margin: "8px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
  },
  footerSubtext: {
    margin: "8px 0",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.6)",
  },
};
