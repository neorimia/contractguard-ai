import { Link } from "@react-email/components";
import * as React from "react";

interface EmailButtonProps {
  href: string;
  text: string;
  variant?: "primary" | "secondary";
  style?: React.CSSProperties;
}

export function EmailButton({
  href,
  text,
  variant = "primary",
  style = {},
}: EmailButtonProps) {
  const buttonStyle = variant === "primary" ? styles.primary : styles.secondary;

  return (
    <div style={styles.container}>
      <Link href={href} style={{ ...buttonStyle, ...style }}>
        {text}
      </Link>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  primary: {
    display: "inline-block",
    padding: "16px 32px",
    backgroundColor: "#ffffff",
    color: "#000000",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "16px",
    letterSpacing: "0.5px",
  },
  secondary: {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
};
