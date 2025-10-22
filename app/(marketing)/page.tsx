import HeroSection from "@/components/HeroSection";
import Feature from "@/components/Feature";
import FAQSection from "@/components/FAQSection";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import JsonLd from "@/components/seo/json-ld";
import { softwareApplicationLd, howToLd, faqPageLd } from "@/lib/seo/jsonld";
import { PricingSectionHybridClient } from "@/components/PricingSectionHybridClient";

export const metadata: Metadata = {
  title: "AI-Powered Smart Contract Security Scanner",
  description:
    "Detect scams, honeypots, and rug pulls in seconds with our AI-powered smart contract analysis. Get instant security insights in plain English.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI-Powered Smart Contract Security Scanner",
    description:
      "Detect scams, honeypots, and rug pulls in seconds with our AI-powered smart contract analysis. Get instant security insights in plain English.",
    url: "/",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI - Smart Contract Security Scanner",
      },
    ],
  },
  twitter: {
    title: "AI-Powered Smart Contract Security Scanner",
    description:
      "Detect scams, honeypots, and rug pulls in seconds with our AI-powered smart contract analysis.",
    images: [siteConfig.socialImage],
  },
};

// FAQ data for structured data
const faqData = [
  {
    question: "What is ContractGuard AI?",
    answer:
      "ContractGuard AI is an AI-powered smart contract security scanner that detects scams, honeypots, and rug pulls in seconds. It provides instant analysis in plain English, making it accessible to both crypto traders and developers.",
  },
  {
    question: "How does the AI analysis work?",
    answer:
      "Our AI analyzes smart contract code, transaction patterns, and on-chain data to identify potential security risks. It uses advanced machine learning models trained on thousands of contracts to detect common scam patterns and vulnerabilities.",
  },
  {
    question: "Is ContractGuard AI free to use?",
    answer:
      "Yes! We offer a free tier with 3 scans per day. For unlimited scans and advanced features, we have a Pro tier at $29/month.",
  },
  {
    question: "What types of scams can it detect?",
    answer:
      "ContractGuard AI can detect honeypots, rug pulls, mint functions, blacklist functions, ownership concentration, liquidity locks, and many other common scam patterns in smart contracts.",
  },
  {
    question: "How accurate is the analysis?",
    answer:
      "While we strive for high accuracy, our AI analysis is for informational purposes only. We recommend conducting additional due diligence before making investment decisions.",
  },
];

// How-to steps for structured data
const howToSteps = [
  {
    name: "Enter Contract Address",
    text: "Paste the smart contract address you want to analyze into the input field.",
  },
  {
    name: "Click Analyze",
    text: "Click the 'Analyze' button to start the AI-powered security scan.",
  },
  {
    name: "Review Results",
    text: "Get instant results with risk scores, detailed explanations, and recommendations in plain English.",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd data={softwareApplicationLd()} />
      <JsonLd data={howToLd(howToSteps)} />
      <JsonLd data={faqPageLd(faqData)} />
      <HeroSection />
      <Feature />
      <PricingSectionHybridClient />
      <FAQSection />
    </>
  );
}
