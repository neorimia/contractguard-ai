"use client";

import { AlertCircle, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FeatureCard } from "@/components/FeatureCard";

export default function HowItWorks({
  hideTitle = false,
  hideDescription = false,
}: { hideTitle?: boolean; hideDescription?: boolean } = {}) {
  const router = useRouter();

  const steps = [
    {
      number: "01",
      title: "Paste contract address + pick chain",
      description:
        "Enter any smart contract address and select the blockchain network",
      badge: (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          <span className="font-medium">No signup required</span>
        </div>
      ),
    },
    {
      number: "02",
      title: "AI scan (10s) → risk score + flags + other insights",
      description:
        "Get instant AI-powered analysis with risk score and plain-English flag list and other insights",
      badge: (
        <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-3 w-3" />
          <span className="font-medium">Results in 10 seconds</span>
        </div>
      ),
    },
    {
      number: "03",
      title: "Share or save your result and set alerts on risky updates",
      description:
        "Save your analysis, share with others, or set alerts for contract changes",
      badge: (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <Zap className="h-3 w-3" />
          <span className="font-medium">Set alerts & track changes</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <section className="py-20 sm:py-32 bg-black/95 dark:bg-white mx-2 sm:mx-4 mb-16 rounded-xl overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Header */}
          {!hideTitle && !hideDescription && (
            <div className="text-center space-y-4 mb-12 sm:mb-16">
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
            </div>
          )}

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {steps.map((step, index) => (
              <FeatureCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                variant="dark"
                showConnector={index < steps.length - 1}
                badge={step.badge}
              />
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white/[0.02] dark:bg-black/[0.02] border border-white/10 dark:border-black/10 rounded-xl p-6 sm:p-8 transition-all hover:border-white/15 dark:hover:border-black/15 hover:bg-white/[0.04] dark:hover:bg-black/[0.04]">
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white dark:text-black mb-3">
                Ready to scan your first contract?
              </h3>
              <p className="text-base tracking-tight text-white/70 dark:text-black/70 mb-6 max-w-2xl mx-auto">
                Join thousands of traders who use ContractGuard AI to avoid
                scams and make safer investments.
              </p>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-xl p-1 border dark:border-black/30 border-white/30 dark:hover:border-black/50 hover:border-white/50 transition-all duration-300">
                  <Button
                    size="lg"
                    onClick={() => router.push("/audit")}
                    className="dark:text-white text-black tracking-tight group bg-white/95 dark:bg-black rounded-lg hover:bg-white dark:hover:bg-black transition-all duration-300"
                  >
                    Start scanning now
                    {/* <ArrowRight className="ml-2 h-4 w-4" /> */}
                  </Button>
                </div>
                <p className="text-sm text-white/60 dark:text-black/60">
                  <span className="font-medium">Free forever</span> • No credit
                  card required
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Footnote */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/50 dark:text-black/50">
            This analysis is for informational purposes only and does not constitute financial advice.
          </p>
        </div>
      </section>

      {/* Video Section */}
      <div className="max-w-6xl mx-4 xl:mx-auto rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 aspect-video">
        <iframe
          src="https://www.youtube.com/embed/SnVPMHxKSv8"
          title="ContractGuard AI Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </>
  );
}
