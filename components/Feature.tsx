"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FeatureCard } from "@/components/FeatureCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const rulesOfThree = [
  {
    number: 1,
    title: "Detect",
    description:
      "Honeypots, hidden mints, liquidity traps, and more spotted instantly.",
  },
  {
    number: 2,
    title: "Decode",
    description:
      "Plain-English explanations you can act on (no technical skills required).",
  },
  {
    number: 3,
    title: "Decide",
    description: "Clear risk score and next steps before you deploy capital.",
  },
];

export default function FeaturesSection() {
  const router = useRouter();
  const [isDisclosureOpen, setIsDisclosureOpen] = useState(false);

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
        <div className="text-left space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
            Outcomes{" "}
            <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
              you can trust
            </span>
            .
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl">
            Get instant, plain English security analysis that detects scams,
            honeypots, and rug pulls before you invest.
          </p>
        </div>

        {/* Rule of 3: Detect · Decode · Decide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {rulesOfThree.map((rule, index) => (
            <FeatureCard
              key={rule.number}
              number={rule.number}
              title={rule.title}
              showConnector={index < rulesOfThree.length - 1}
              description={rule.description}
            />
          ))}
        </div>

        {/* Before/After Strip */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-black/10 dark:border-white/10 rounded-xl p-6 sm:p-8 bg-black/[0.02] dark:bg-white/[0.02] hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
            {/* Before */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-black/60 dark:text-white/60">
                  Before
                </h3>
              </div>
              <p className="text-base tracking-tight text-black/70 dark:text-white/70">
                Guessing, Telegram hype, code you can't read, "I hope."
              </p>
            </div>

            {/* After */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-black/60 dark:text-white/60">
                  After
                </h3>
              </div>
              <p className="text-base tracking-tight text-black/70 dark:text-white/70">
                Instant red flags, plain-English reasoning, confident trades.
              </p>
            </div>
          </div>
          <p className="text-center mt-6 text-sm font-medium tracking-tight text-black/80 dark:text-white/80">
            We don't sell audits. We sell confidence.
          </p>
        </div>

        {/* Row One: Image on left, content on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left: Security Analysis Demo */}
          <div className="relative h-full min-h-[300px] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group hover:border-black/15 dark:hover:border-white/15 transition-all duration-300">
            {/* Security Analysis Demo */}
            <Image
              src="/images/security-analysis.jpg"
              alt="Security Analysis"
              width={560}
              height={315}
              className="object-center object-cover block h-full w-full"
            />
          </div>

          {/* Right: Content */}
          <div className="flex flex-col justify-center space-y-6">
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
                Try it now free
              </Button>
              <p className="text-sm text-black/60 dark:text-white/60 mt-2 text-left">
                <span className="font-medium">No signup required</span> • Scan
                up to 3 contracts daily
              </p>
            </div>
          </div>
        </div>

        {/* Row Two: Content on left, image on right */}
        <div className="grid grid-cols-1 gap-6">
          {/* Left: Content */}
          <div className="flex flex-col space-y-6">
            <div className="text-left space-y-4 mb-12">
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-white">
                Comprehensive security coverage
              </h3>
              <p className="text-base tracking-tight text-black/70 dark:text-white/70 mb-">
                Our AI analyzes multiple security vectors including contract
                code, liquidity patterns, and holder distribution to provide
                complete risk assessment.
              </p>
            </div>
            {/* Two cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Card 1 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Honeypot Detection
                </h4>
                <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                  Don't get trapped in a token you can't sell.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Rug-Pull Analysis
                </h4>
                <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                  Spot code that can drain liquidity before it drains you.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Scam Signals
                </h4>
                <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                  Flag impersonations, phishing, and shady deployer histories.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                  Plain-English Reports
                </h4>
                <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                  You'll know exactly why it's risky (or not).
                </p>
              </div>
            </div>

            {/* What we check disclosure */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 transition-all hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
              <h4 className="text-lg font-medium tracking-tight text-black dark:text-white mb-2">
                What we check
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ul className="space-y-2 text-sm tracking-tight text-black/70 dark:text-white/70">
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Contract source code analysis for malicious functions
                    </p>
                  </li>
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Liquidity pool composition and lock status
                    </p>
                  </li>
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Token holder distribution patterns
                    </p>
                  </li>
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Deployer wallet history and reputation
                    </p>
                  </li>
                </ul>
                <ul className="space-y-2 text-sm tracking-tight text-black/70 dark:text-white/70">
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Contract ownership and admin controls
                    </p>
                  </li>
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Transfer restrictions and blacklist functions
                    </p>
                  </li>
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Minting and burning capabilities
                    </p>
                  </li>
                  <li>
                    <p className="text-sm tracking-tight text-black/70 dark:text-white/70">
                      • Reentrancy vulnerabilities
                    </p>
                  </li>
                </ul>
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
          </div>
        </div>
      </div>
    </section>
  );
}
