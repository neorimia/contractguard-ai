import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Smart Contract Analysis Tool",
  description:
    "Analyze any smart contract for security vulnerabilities, honeypots, and rug pulls. Get instant AI-powered analysis in plain English.",
  alternates: {
    canonical: "/chat",
  },
  openGraph: {
    title: "Smart Contract Analysis Tool",
    description:
      "Analyze any smart contract for security vulnerabilities, honeypots, and rug pulls. Get instant AI-powered analysis in plain English.",
    url: "/chat",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI - Smart Contract Analysis Tool",
      },
    ],
  },
  twitter: {
    title: "Smart Contract Analysis Tool",
    description:
      "Analyze any smart contract for security vulnerabilities, honeypots, and rug pulls.",
    images: [siteConfig.socialImage],
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
