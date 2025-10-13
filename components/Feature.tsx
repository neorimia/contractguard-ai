"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function FeaturesSection() {
  const router = useRouter();

  // Clean, consistent animation settings
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  };

  const handleScanContract = () => {
    router.push("/audit");
  };

  return (
    <section
      id="features"
      className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div {...fadeIn} className="text-left space-y-4 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
            AI-powered security analysis{" "}
            <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
              in seconds
            </span>
            .
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl">
            Get instant, plain English security analysis that detects scams,
            honeypots, and rug pulls before you invest.
          </p>
        </motion.div>

        {/* Row One: Image on left, content on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left: Security Analysis Demo */}
          <motion.div
            {...fadeIn}
            className="relative h-full min-h-[300px] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group hover:border-black/15 dark:hover:border-white/15 transition-all duration-300"
          >
            {/* Security Analysis Demo */}
            <Image
              src="/images/security-analysis.jpg"
              alt="Security Analysis"
              width={560}
              height={315}
              className="object-center object-cover block h-full w-full"
            />
          </motion.div>

          {/* Right: Content */}
          <motion.div
            {...fadeIn}
            className="flex flex-col justify-center space-y-6"
          >
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white">
              Instant security analysis
            </h3>
            <p className="text-base tracking-tight text-black/70 dark:text-white/70">
              <span className="font-semibold">AI-Powered Detection</span>{" "}
              analyzes smart contracts in seconds, detecting honeypots, rug
              pulls, and scams with plain English explanations that anyone can
              understand.
            </p>
            <div className="pt-2">
              <Button
                size="lg"
                className="flex-1 bg-black dark:bg-white text-white dark:text-black"
                onClick={() => handleScanContract()}
              >
                Try it now
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Row Two: Content on left, image on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left: Content */}
          <motion.div {...fadeIn} className="flex flex-col space-y-6">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white">
              Comprehensive security coverage
            </h3>
            <p className="text-base tracking-tight text-black/70 dark:text-white/70">
              Our AI analyzes multiple security vectors including contract code,
              liquidity patterns, and holder distribution to provide complete
              risk assessment.
            </p>

            {/* Two cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 border border-black/15 dark:border-white/15 rounded-xl p-1">
              {/* Card 1 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15">
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Honeypot Detection
                </h4>
                <p className="text-sm tracking-tight text-black/60 dark:text-white/60">
                  Identify contracts that trap users and prevent selling with
                  advanced pattern recognition.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15">
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Rug Pull Analysis
                </h4>
                <p className="text-sm tracking-tight text-black/60 dark:text-white/60">
                  Detect contracts designed to drain liquidity and identify
                  potential rug pull schemes.
                </p>
              </div>
            </div>

            {/* Additional title and subtitle below cards */}
            <div className="flex items-center gap-2">
              <div className="w-1/2 flex flex-col items-center gap-2">
                <h4 className="font-semibold tracking-tight text-black dark:text-white text-4xl">
                  10s
                </h4>
                <p className="text-xs tracking-tight text-black/60 dark:text-white/60">
                  Analysis time
                </p>
              </div>
              <div className="w-1/2 flex flex-col items-center gap-2">
                <h4 className="font-semibold tracking-tight text-black dark:text-white text-4xl">
                  99%
                </h4>
                <p className="text-xs tracking-tight text-black/60 dark:text-white/60">
                  Accuracy rate
                </p>
              </div>

              <div className="w-1/2 flex flex-col items-center gap-2">
                <h4 className="font-semibold tracking-tight text-black dark:text-white text-4xl">
                  5k+
                </h4>
                <p className="text-xs tracking-tight text-black/60 dark:text-white/60">
                  Contracts scanned
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Security Success Demo */}
          <motion.div
            {...fadeIn}
            className="relative h-full min-h-[300px] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group hover:border-black/15 dark:hover:border-white/15 transition-all duration-300"
          >
            {/* Security Success Demo */}
            <Image
              src="/images/security-success.jpg"
              alt="Security Success"
              width={560}
              height={315}
              className="object-cover h-full w-full text-center align-middle"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
