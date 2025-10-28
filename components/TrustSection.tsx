"use client";

import { Shield, Lock, Eye, CheckCircle, Zap, Users } from "lucide-react";
import { motion } from "motion/react";

export function TrustSection() {
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

  const trustFeatures = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and security protocols",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "No Data Storage",
      description: "We don't store your contract addresses or personal data",
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Privacy First",
      description: "Read-only blockchain access, no private keys needed",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Get results in under 10 seconds",
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "99% Accuracy",
      description: "Advanced AI trained on thousands of contracts",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Trusted by Traders",
      description: "Used by crypto traders worldwide",
    },
  ];

  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          {...fadeIn}
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
            Trusted by crypto traders{" "}
            <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
              worldwide
            </span>
            .
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl mx-auto">
            Built for the crypto community with enterprise-grade security and
            privacy-first design.
          </p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div {...fadeIn} className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-xl">
            <div className="text-green-600 dark:text-green-400">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Encrypted results, we don't store your contract addresses
              </span>
              <span className="text-xs text-green-600 dark:text-green-400">
                Your privacy is protected with enterprise-grade security
              </span>
            </div>
          </div>
        </motion.div>

        {/* Trust Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: index * 0.1 }}
              className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl hover:border-black/15 dark:hover:border-white/15 transition-all duration-300"
            >
              <div className="text-blue-600 dark:text-blue-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-black dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Security Indicators */}
        <motion.div
          {...fadeIn}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-black/60 dark:text-white/60 mb-8"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>No Data Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Privacy First</span>
          </div>
        </motion.div>

        {/* Disclaimers */}
        <motion.div {...fadeIn} className="max-w-4xl mx-auto">
          <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/30">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                  Important Disclaimer
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This analysis is for informational purposes only and does not
                  constitute financial advice. Always conduct your own research
                  (DYOR) before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Compact trust section for smaller spaces
export function CompactTrustSection() { 
  return (
    <div className="py-8 px-4 bg-black/[0.02] dark:bg-white/[0.02] mx-2 sm:mx-4 my-4 rounded-xl border border-black/10 dark:border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
            <div className="text-green-600 dark:text-green-400">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Encrypted & Private
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-black/60 dark:text-white/60">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span>No Data Storage</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trust badges for specific pages
export function PageTrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6">
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
        <div className="text-green-600 dark:text-green-400">
          <Shield className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-green-800 dark:text-green-200">
          Encrypted results, we don't store your contract addresses
        </span>
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
        <div className="text-blue-600 dark:text-blue-400">
          <Lock className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Encrypted & Private
        </span>
      </div>
    </div>
  );
}
