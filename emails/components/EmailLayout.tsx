import { Html, Head, Body, Container, Preview } from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <title>ContractGuard AI</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>{children}</Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    backgroundColor: "#fafafa",
    margin: 0,
    padding: "40px 0",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#000000",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
};
