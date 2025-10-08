"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function FeaturesSection() {
  // Shared transition settings
  const sharedTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };

  return (
    <section
      id="features"
      className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-left space-y-4 mb-12 sm:mb-16"
        >
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
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative h-full min-h-[300px] rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group hover:border-black/15 dark:hover:border-white/15 transition-all duration-300"
          >
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-black dark:text-white">
                Security Alert
              </h3>
              <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                Honeypot detected
              </p>
              <div className="text-xs tracking-tight text-black/60 dark:text-white/60">
                Only owner can sell
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="pt-2"
            >
              <Button
                size="sm"
                onClick={() => (window.location.href = "/")}
                className="h-6 group text-white dark:text-black bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90"
              >
                Try it now
                <span className="ml-2 transition-transform group-hover:translate-x-1 h-1 w-1 rounded-full bg-current" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Row Two: Content on left, image on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col space-y-6"
          >
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white">
              Comprehensive security coverage
            </h3>
            <p className="text-base tracking-tight text-black/70 dark:text-white/70">
              Our AI analyzes multiple security vectors including contract code,
              liquidity patterns, and holder distribution to provide complete
              risk assessment.
            </p>

            {/* Two cards side by side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 border border-black/15 dark:border-white/15 rounded-xl p-1"
            >
              {/* Card 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                whileHover={{ scale: 1.01 }}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15"
              >
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Honeypot Detection
                </h4>
                <p className="text-sm tracking-tight text-black/60 dark:text-white/60">
                  Identify contracts that trap users and prevent selling with
                  advanced pattern recognition.
                </p>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
                whileHover={{ scale: 1.01 }}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15"
              >
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Rug Pull Analysis
                </h4>
                <p className="text-sm tracking-tight text-black/60 dark:text-white/60">
                  Detect contracts designed to drain liquidity and identify
                  potential rug pull schemes.
                </p>
              </motion.div>
            </motion.div>

            {/* Additional title and subtitle below cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="w-1/2 flex flex-col items-center gap-2"
              >
                <h4 className="font-semibold tracking-tight text-black dark:text-white text-4xl">
                  10s
                </h4>
                <p className="text-xs tracking-tight text-black/60 dark:text-white/60">
                  Analysis time
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="w-1/2 flex flex-col items-center gap-2"
              >
                <h4 className="font-semibold tracking-tight text-black dark:text-white text-4xl">
                  99%
                </h4>
                <p className="text-xs tracking-tight text-black/60 dark:text-white/60">
                  Accuracy rate
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.0 }}
                className="w-1/2 flex flex-col items-center gap-2"
              >
                <h4 className="font-semibold tracking-tight text-black dark:text-white text-4xl">
                  5k+
                </h4>
                <p className="text-xs tracking-tight text-black/60 dark:text-white/60">
                  Contracts scanned
                </p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right: Security Success Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative h-full min-h-[300px] rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group hover:border-black/15 dark:hover:border-white/15 transition-all duration-300"
          >
            <div className="text-center space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10">
                <span className="text-2xl text-green-500">✓</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-black dark:text-white">
                Security Passed
              </h3>
              <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                No issues detected
              </p>
              <div className="text-xs tracking-tight text-black/60 dark:text-white/60">
                Safe to invest
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
