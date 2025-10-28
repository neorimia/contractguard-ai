"use client";

import { motion } from "motion/react";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HowItWorks({
  hideTitle = false,
  hideDescription = false,
}: { hideTitle?: boolean; hideDescription?: boolean } = {}) {
  const router = useRouter();

  const steps = [
    {
      number: "01",
      title: "Enter contract address",
      description:
        "Paste any smart contract address and select the blockchain network",
      icon: "📝",
    },
    {
      number: "02",
      title: "Get instant risk-score",
      description:
        "Receive AI-powered analysis with plain-English flag list in seconds",
      icon: "⚡",
    },
    {
      number: "03",
      title: "Upgrade for deeper analysis",
      description:
        "Unlock advanced tracking, alerts, and unlimited scans with Pro",
      icon: "🚀",
    },
  ];

  // Clean, consistent animation settings matching project style
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  };

  return (
    <section className="py-20 sm:py-32 bg-black dark:bg-white mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        {!hideTitle ||
          (!hideDescription && (
            <motion.div
              {...fadeIn}
              className="text-center space-y-4 mb-12 sm:mb-16"
            >
              {!hideTitle && (
                <>
                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white dark:text-black">
                    How it works{" "}
                    <span className="text-zinc-300/80 dark:text-zinc-700/80 font-semibold tracking-tighter">
                      in 3 steps
                    </span>
                    .
                  </h2>
                </>
              )}
              {!hideDescription && (
                <p className="text-base sm:text-lg tracking-tight text-white/60 dark:text-black/60 max-w-3xl mx-auto">
                  Get instant security analysis in 3 simple steps.
                  <span className="font-medium text-white dark:text-black">
                    {" "}
                    Start free scan up to 3 contracts daily.
                  </span>{" "}
                  <br />
                  Pay per scan or subscribe for unlimited access. From one-time
                  audits to professional monitoring transparent pricing, no
                  surprises.
                </p>
              )}
            </motion.div>
          ))}

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-black dark:bg-white border border-white/10 dark:border-black/10 rounded-xl p-6 sm:p-8 h-full transition-all duration-300 hover:border-white/15 dark:hover:border-black/15">
                {/* Step Number */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center text-black dark:text-white font-bold text-sm">
                    {step.number}
                  </div>
                  <div className="text-xl">{step.icon}</div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold tracking-tight text-white dark:text-black mb-2">
                  {step.title}
                </h3>
                <p className="text-sm tracking-tight text-white/70 dark:text-black/70 leading-relaxed">
                  {step.description}
                </p>

                {/* Free tier highlight for step 1 */}
                {index === 0 && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    <span className="font-medium">No signup required</span>
                  </div>
                )}

                {/* Upgrade hint for step 3 */}
                {index === 2 && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Zap className="h-3 w-3" />
                    <span className="font-medium">Unlock unlimited scans</span>
                  </div>
                )}
              </div>

              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-4 w-4 text-white/20 dark:text-black/20" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div {...fadeIn} className="text-center">
          <div className="bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 rounded-xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white dark:text-black mb-3">
              Ready to scan your first contract?
            </h3>
            <p className="text-base tracking-tight text-white/70 dark:text-black/70 mb-6 max-w-2xl mx-auto">
              Join thousands of traders who use ContractGuard AI to avoid scams
              and make safer investments.
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="rounded-xl p-1 border border-white/10 dark:border-black/10 hover:border-white/20 dark:hover:border-black/20 transition-all duration-300">
                <Button
                  size="lg"
                  onClick={() => router.push("/audit")}
                  className="bg-white dark:bg-black text-black dark:text-white hover:bg-white/90 dark:hover:bg-black/90 px-8 py-3"
                >
                  Start scanning now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-white/60 dark:text-black/60">
                <span className="font-medium">Free forever</span> • No credit
                card required
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
