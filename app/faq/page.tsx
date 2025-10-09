import { Geist } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/Header";
import FAQSection from "@/components/FAQSection";
import PageHero from "@/components/PageHero";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import JsonLd from "@/components/seo/json-ld";

const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions About Smart Contract Security",
  description:
    "Get answers to common questions about ContractGuard AI, smart contract security analysis, honeypot detection, pricing, blockchain support, and more. Learn how we protect your crypto investments.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ - Frequently Asked Questions About Smart Contract Security",
    description:
      "Get answers to common questions about ContractGuard AI, smart contract security analysis, honeypot detection, pricing, and more.",
    url: "/faq",
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ContractGuard AI FAQ - Smart Contract Security Questions",
      },
    ],
  },
  twitter: {
    title: "FAQ - Frequently Asked Questions About Smart Contract Security",
    description:
      "Get answers to common questions about ContractGuard AI, smart contract security analysis, and protection.",
    images: [siteConfig.socialImage],
  },
};

// FAQ structured data - comprehensive list
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does ContractGuard AI work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ContractGuard AI analyzes smart contracts using advanced AI models to detect security vulnerabilities, honeypots, rug pulls, and scams. Simply paste a contract address and get instant analysis with plain English explanations in under 10 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "What security issues can you detect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We detect honeypots (contracts that trap users), rug pulls (liquidity drainage schemes), scam patterns, malicious functions, and other security vulnerabilities. Our AI provides detailed explanations of each risk in plain English.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI achieves 99% accuracy in detecting common security patterns. We use multiple AI models including GPT-4, Claude, and specialized security analysis models to ensure comprehensive coverage and high reliability.",
      },
    },
    {
      "@type": "Question",
      name: "Which blockchains do you support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We currently support Ethereum mainnet with plans to add BSC, Polygon, and other major chains. Our analysis works on any verified smart contract address on supported networks.",
      },
    },
    {
      "@type": "Question",
      name: "Is my contract address safe to scan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we only read publicly available contract data and never store your contract addresses. We use read-only blockchain queries and don't require any private keys or wallet connections.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between Free and Pro tiers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free tier includes 3 scans per day with basic analysis. Pro tier ($29/month) offers unlimited scans, advanced AI analysis, API access, PDF exports, and priority processing. Enterprise includes custom features and white-label options.",
      },
    },
    {
      "@type": "Question",
      name: "What is ContractGuard AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ContractGuard AI is an AI-powered smart contract security scanner that detects scams, honeypots, and rug pulls in seconds. It provides instant analysis in plain English, making it accessible to both crypto traders and developers.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI analysis work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI analyzes smart contract code, transaction patterns, and on-chain data to identify potential security risks. It uses advanced machine learning models trained on thousands of contracts to detect common scam patterns and vulnerabilities.",
      },
    },
    {
      "@type": "Question",
      name: "Is ContractGuard AI free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We offer a free tier with 3 scans per day. For unlimited scans and advanced features, we have a Pro tier at $29/month.",
      },
    },
    {
      "@type": "Question",
      name: "What types of scams can it detect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ContractGuard AI can detect honeypots, rug pulls, mint functions, blacklist functions, ownership concentration, liquidity locks, and many other common scam patterns in smart contracts.",
      },
    },
  ],
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
        name: "FAQ",
        item: `${siteConfig.siteUrl.href}faq`,
      },
    ],
  },
};

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqLd} />
      <div className="relative bg-white/95 dark:bg-black/5 pt-14">
        <Header />

        <PageHero
          title="Frequently asked"
          highlightedText="questions"
          description="Everything you need to know about ContractGuard AI, smart contract security analysis, and protecting your crypto investments."
        />

        <FAQSection />

        {/* Additional Help Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/95 dark:bg-white/95 rounded-2xl p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-black mb-4">
                Need more help?
              </h2>
              <p className="text-white/60 dark:text-black/60 mb-6 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our support team is
                here to help you with any questions about smart contract
                security analysis.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:support@contractguard.ai"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-black text-black dark:text-white rounded-lg font-medium hover:bg-white/90 dark:hover:bg-black/90 transition-all"
                >
                  Email Support
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white/10 dark:bg-black/10 text-white dark:text-black rounded-lg font-medium border border-white/20 dark:border-black/20 hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                >
                  Scan Contract
                </a>
              </div>
            </div>
          </div>
        </section>
        </>
  );
}
