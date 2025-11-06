"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQItem } from "@/components/ui/faq-item";

type FAQ = {
  question: string;
  answer: string;
};

export default function FAQSection() {
  // FAQ data
  const faqs: FAQ[] = [
    {
      question: "How does ContractGuard AI work?",
      answer:
        "ContractGuard AI analyzes smart contracts using advanced AI models to detect security vulnerabilities, honeypots, rug pulls, and scams. Simply paste a contract address and get instant analysis with plain English explanations in under 10 seconds.",
    },
    {
      question: "What security issues can you detect?",
      answer:
        "We detect honeypots (contracts that trap users), rug pulls (liquidity drainage schemes), scam patterns, malicious functions, and other security vulnerabilities. Our AI provides detailed explanations of each risk in plain English.",
    },
    {
      question: "How accurate is the analysis?",
      answer:
        "Our AI achieves 99% accuracy in detecting common security patterns. We use multiple AI models including GPT-4, Claude, and specialized security analysis models to ensure comprehensive coverage and high reliability.",
    },
    {
      question: "Which blockchains do you support?",
      answer:
        "We currently support Ethereum mainnet with plans to add BSC, Polygon, and other major chains. Our analysis works on any verified smart contract address on supported networks.",
    },
    {
      question: "Is my contract address safe to scan?",
      answer:
        "Yes, we only read publicly available contract data and never store your contract addresses. We use read-only blockchain queries and don't require any private keys or wallet connections.",
    },
    {
      question: "What's the difference between Free and Pro tiers?",
      answer:
        "Free tier includes 3 scans per day with basic analysis. Pro tier ($29/month) offers unlimited scans, advanced AI analysis, API access, PDF exports, and priority processing. Enterprise includes custom features and white-label options.",
    },
  ];

  return (
    <section
      id="faq"
      className="py-16 sm:py-24 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 rounded-2xl overflow-hidden relative"
    >
      {/* <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-white/30 to-white/5 dark:from-black/30 dark:to-black/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-white/30 to-white/5 dark:from-black/30 dark:to-black/5 blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" /> */}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center space-y-4 mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white dark:text-black">
            FAQ.
          </h2>
          <p className="text-sm sm:text-base tracking-tight text-white/60 dark:text-black/60 max-w-2xl mx-auto">
            Everything you need to know about smart contract security analysis.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => (
            <FAQItem
              key={`faq-${faq.question.toLowerCase().replace(/\s+/g, "-")}`}
              question={faq.question}
              answer={faq.answer}
              index={index}
              variant="inverted"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
