import { Section, Text } from "@react-email/components";
import * as React from "react";

interface EmailHeaderProps {
  title: string;
}

export function EmailHeader({ title }: EmailHeaderProps) {
  return (
    <Section style={styles.header}>
      <div style={styles.borderTop} />
      <div style={styles.logoContainer}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={styles.logo}
        >
          {/* Shield outline */}
          <path
            d="M24 4L8 12V22C8 32 15 40 24 44C33 40 40 32 40 22V12L24 4Z"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Checkmark */}
          <path
            d="M17 24L22 29L31 19"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner glow effect */}
          <path
            d="M24 4L8 12V22C8 32 15 40 24 44C33 40 40 32 40 22V12L24 4Z"
            fill="url(#shield-gradient)"
            opacity="0.15"
          />
          <defs>
            <linearGradient
              id="shield-gradient"
              x1="24"
              y1="4"
              x2="24"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" stopOpacity="0.3" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
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
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20px",
  },
  logo: {
    display: "block",
    width: "48px",
    height: "48px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#ffffff",
    background: "linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.7))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
};
