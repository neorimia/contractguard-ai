"use client";

import { Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

type FAQ = {
  question: string;
  answer: string;
};

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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
      className="py-16 sm:py-24 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 mb-4 rounded-2xl overflow-hidden relative"
    >
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-white/30 to-white/5 dark:from-black/30 dark:to-black/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-white/30 to-white/5 dark:from-black/30 dark:to-black/5 blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

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
            <motion.div
              key={`faq-${faq.question.toLowerCase().replace(/\s+/g, "-")}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
              className="backdrop-blur-sm border border-white/10 dark:border-black/10 bg-white/[0.03] dark:bg-black/[0.03] rounded-lg overflow-hidden shadow-sm shadow-white/5 dark:shadow-black/5 hover:border-white/15 dark:hover:border-black/15 transition-colors"
            >
              <button
                onClick={() => handleToggle(index)}
                className="flex items-center justify-between w-full px-5 py-4 text-left"
                aria-expanded={activeIndex === index}
                aria-controls={`faq-answer-${index}`}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleToggle(index)}
                type="button"
              >
                <h3 className="text-base font-medium text-white dark:text-black">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0 ml-4 flex items-center justify-center h-6 w-6 rounded-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 transition-colors">
                  {activeIndex === index ? (
                    <Minus className="h-3.5 w-3.5 text-white/80 dark:text-black/80" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-white/80 dark:text-black/80" />
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {activeIndex === index && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: {
                          duration: 0.3,
                          ease: "easeInOut",
                        },
                        opacity: {
                          duration: 0.2,
                          delay: 0.1,
                        },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: {
                          duration: 0.3,
                          ease: "easeInOut",
                        },
                        opacity: { duration: 0.2 },
                      },
                    }}
                  >
                    <div className="px-5 pb-4">
                      <div className="w-10 h-px border-t border-dashed border-white/10 dark:border-black/10 mb-3" />
                      <p className="text-white/70 dark:text-black/70 text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-white dark:text-black mb-4">
            Still have questions? Contact our team.
          </h3>
          <div className="inline-block">
            <Button
              size="sm"
              className="h-9 px-5 bg-white dark:bg-black text-black dark:text-white rounded-lg border border-white/10 dark:border-black/10 shadow-sm hover:shadow-md hover:bg-white/90 dark:hover:bg-black/90 transition-all duration-200 group"
            >
              support@contractguard.ai
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
