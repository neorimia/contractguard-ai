import { Section, Text } from "@react-email/components";
import * as React from "react";

interface InfoBoxProps {
  children: React.ReactNode;
  type?: "info" | "warning" | "success" | "error";
}

const typeStyles = {
  info: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  success: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
};

export function InfoBox({ children, type = "info" }: InfoBoxProps) {
  const boxStyle = typeStyles[type];

  return <Section style={{ ...styles.box, ...boxStyle }}>{children}</Section>;
}

const styles = {
  box: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "20px",
    margin: "24px 0",
  },
};
