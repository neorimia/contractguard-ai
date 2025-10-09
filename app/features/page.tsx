import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/Header";
import Feature from "@/components/Feature";
import PageHero from "@/components/PageHero";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import JsonLd from "@/components/seo/json-ld";

const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Features - AI-Powered Smart Contract Security Analysis",
  description:
    "Discover ContractGuard AI's powerful features: instant security analysis, honeypot detection, rug pull analysis, and comprehensive risk assessment. AI-powered protection in seconds.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features - AI-Powered Smart Contract Security Analysis",
    description:
      "Discover ContractGuard AI's powerful features: instant security analysis, honeypot detection, rug pull analysis, and comprehensive risk assessment.",
    url: "/features",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI Features - Smart Contract Security Scanner",
      },
    ],
  },
  twitter: {
    title: "Features - AI-Powered Smart Contract Security Analysis",
    description:
      "Discover ContractGuard AI's powerful features: instant security analysis, honeypot detection, rug pull analysis, and comprehensive risk assessment.",
    images: [siteConfig.socialImage],
  },
};

// Features structured data
const featuresLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Features - ContractGuard AI",
  description:
    "AI-powered smart contract security analysis features including honeypot detection, rug pull analysis, and instant risk assessment.",
  url: `${siteConfig.siteUrl.href}features`,
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "ContractGuard AI",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Instant AI-powered security analysis in 10 seconds",
      "Honeypot detection with advanced pattern recognition",
      "Rug pull analysis and liquidity drain detection",
      "99% accuracy rate on contract security assessment",
      "Plain English explanations for all findings",
      "Multi-chain support (Ethereum, BSC, Polygon)",
      "Real-time risk scoring and threat level analysis",
      "Holder distribution and ownership analysis",
    ],
  },
  about: {
    "@type": "Thing",
    name: "Smart Contract Security",
    description:
      "Security analysis and vulnerability detection for blockchain smart contracts",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.siteUrl.href,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: `${siteConfig.siteUrl.href}features`,
      },
    ],
  },
};

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={featuresLd} />
      <Header />

      <PageHero
        title="Powerful security features"
        highlightedText="at your fingertips"
        description="ContractGuard AI provides comprehensive smart contract security analysis with AI-powered detection, giving you instant insights before you invest."
      />

      <Feature />
    </>
  );
}
