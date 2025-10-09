import { Section, Text, Link } from "@react-email/components";
import * as React from "react";

export function EmailFooter() {
  return (
    <Section style={styles.footer}>
      <Text style={styles.title}>ContractGuard AI</Text>
      <Text style={styles.subtitle}>
        AI-Powered Smart Contract Security Scanner
      </Text>
      <Text style={styles.contact}>
        Questions? Contact us at{" "}
        <Link href="mailto:support@contractguard.ai" style={styles.link}>
          support@contractguard.ai
        </Link>
      </Text>
    </Section>
  );
}

const styles = {
  footer: {
    padding: "30px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    textAlign: "center" as const,
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  title: {
    margin: "8px 0",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
  },
  subtitle: {
    margin: "8px 0",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.6)",
  },
  contact: {
    margin: "16px 0 8px",
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.6)",
  },
  link: {
    color: "#ffffff",
    textDecoration: "underline",
  },
};
