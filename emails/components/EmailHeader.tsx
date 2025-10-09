import { Section, Text, Img } from "@react-email/components";
import * as React from "react";

interface EmailHeaderProps {
  title: string;
}

export function EmailHeader({ title }: EmailHeaderProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  return (
    <Section style={styles.header}>
      <div style={styles.borderTop} />
      <Img
        src={`${siteUrl}/logo.svg`}
        alt="ContractGuard AI"
        width="48"
        height="48"
        style={styles.logo}
      />
      <Text style={styles.title}>{title}</Text>
      <div style={styles.borderBottom} />
    </Section>
  );
}

const styles = {
  header: {
    padding: "40px 30px 32px",
    textAlign: "center" as const,
    background:
      "linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
    position: "relative" as const,
  },
  borderTop: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    top: 0,
    height: "1px",
    background:
      "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)",
  },
  borderBottom: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: "1px",
    background:
      "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)",
  },
  logo: {
    display: "block",
    margin: "0 auto 20px",
    width: "48px",
    height: "48px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#ffffff",
    background: "linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.7))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
};
